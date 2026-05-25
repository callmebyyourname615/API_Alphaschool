import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { In } from 'typeorm';
import { CreateSavingDto } from './dto/create-saving.dto';
import { CreateBulkSavingDto } from './dto/create-bulk-saving.dto';
import { CreateClassSavingDto } from './dto/create-class-saving.dto';
import { CreateStudentsSavingSessionDto } from './dto/create-students-saving-session.dto';
import { UpdateSavingDto } from './dto/update-saving.dto';
import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';
import {
  Saving,
  SavingOwnerType,
  SavingTransactionType,
} from './savings.entity';
import {
  PayReceive,
  PayReceiveFlowType,
  PayReceiveStatus,
} from '../pay_receivce/pay-receive.entity';
import { CreateBulkSavingByClassDto } from './dto/create-bulk-saving-by-class.dto';
import { SavingSession } from './saving-session.entity';

@Injectable()
export class SavingsService {
  constructor(
    @InjectRepository(Saving)
    private readonly savingRepository: Repository<Saving>,

    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,

    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,

    @InjectRepository(PayReceive)
    private readonly payReceiveRepository: Repository<PayReceive>,
    @InjectRepository(SavingSession)
    private readonly savingSessionRepository: Repository<SavingSession>,
  ) {}

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

  private applyTransaction(
    balance: number,
    transactionType: SavingTransactionType,
    amount: number,
  ): number {
    if (transactionType === SavingTransactionType.DEPOSIT)
      return balance + amount;
    if (transactionType === SavingTransactionType.WITHDRAW)
      return balance - amount;
    return balance;
  }

  // ✅ Guard: withdraw_reason_id is required for WITHDRAW transactions
  private guardWithdrawReason(
    transactionType: SavingTransactionType,
    withdrawReasonId?: string,
  ): void {
    if (
      transactionType === SavingTransactionType.WITHDRAW &&
      !withdrawReasonId
    ) {
      throw new BadRequestException(
        'withdraw_reason_id is required for WITHDRAW transactions',
      );
    }
  }

  private async getStudentWithRelations(
    studentId: string,
  ): Promise<Student | null> {
    return await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.branch', 'branch')
      .where('student.id = :studentId', { studentId })
      .getOne();
  }

  async recalculateStudentBalances(studentId: string): Promise<void> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const savings = await this.savingRepository.find({
      where: { student_id: studentId, is_deleted: false },
      order: { created_at: 'ASC', updated_at: 'ASC' },
    });

    let runningBalance = 0;

    for (const item of savings) {
      const amount = Number(item.amount);
      item.opening_balance = runningBalance;

      const nextBalance = this.applyTransaction(
        runningBalance,
        item.transaction_type,
        amount,
      );

      if (nextBalance < 0) {
        throw new BadRequestException(
          `Saving balance cannot be negative for student ${studentId}`,
        );
      }

      item.closing_balance = nextBalance;
      runningBalance = nextBalance;
    }

    if (savings.length > 0) await this.savingRepository.save(savings);

    (student as any).saving_wallet = runningBalance.toFixed(2);
    await this.studentRepository.save(student);
  }

  private async createPayReceive(saving: Saving): Promise<void> {
    const flowType =
      saving.transaction_type === SavingTransactionType.WITHDRAW
        ? PayReceiveFlowType.WITHDRAWAL
        : PayReceiveFlowType.DEPOSIT;

    const payReceive = this.payReceiveRepository.create({
      saving_id: saving.id,
      amount: saving.amount,
      flow_type: flowType,
      status: PayReceiveStatus.PENDING,
      initiated_by: saving.created_by,
      is_deleted: false,
    });
    await this.payReceiveRepository.save(payReceive);
  }

  private formatMoney(value: string | number | null | undefined): string {
    return Number(value ?? 0).toFixed(2);
  }

  // ─── CREATE SINGLE ────────────────────────────────────────────────────────

  async create(createSavingDto: CreateSavingDto): Promise<Saving> {
    const {
      owner_type,
      created_by,
      student_id,
      class_id,
      branch_id,
      academic_year_id,
      transaction_type,
      amount,
      note,
      withdraw_reason_id, // ✅
    } = createSavingDto;

    // ✅ validate withdraw reason early for both owner types
    this.guardWithdrawReason(transaction_type, withdraw_reason_id);

    if (owner_type === SavingOwnerType.STUDENT) {
      if (!student_id) throw new BadRequestException('student_id is required');

      const student = await this.getStudentWithRelations(student_id);
      if (!student) throw new NotFoundException('Student not found');

      const studentData = student as any;
      const currentBalance = Number(studentData.saving_wallet ?? 0);
      const nextBalance = this.applyTransaction(
        currentBalance,
        transaction_type,
        Number(amount),
      );

      if (nextBalance < 0)
        throw new BadRequestException('Insufficient balance');

      const savingData: DeepPartial<Saving> = {
        owner_type: SavingOwnerType.STUDENT,
        created_by,
        student_id: student.id,
        class_id: null,
        branch_id: studentData.branch?.id ?? null,
        academic_year_id: null,
        transaction_type,
        opening_balance: currentBalance,
        amount: Number(amount),
        closing_balance: nextBalance,
        note,
        withdraw_reason_id: withdraw_reason_id ?? null, // ✅
        is_active: true,
        is_deleted: false,
      };

      const saving = this.savingRepository.create(savingData);
      const created = await this.savingRepository.save(saving);

      await this.recalculateStudentBalances(student.id);
      await this.createPayReceive(created);

      return await this.findOne(created.id);
    }

    if (owner_type === SavingOwnerType.CLASS) {
      if (!class_id) throw new BadRequestException('class_id is required');
      if (!branch_id) throw new BadRequestException('branch_id is required');
      if (!academic_year_id)
        throw new BadRequestException('academic_year_id is required');

      const classInfo = await this.classRepository.findOne({
        where: { id: class_id },
      });
      if (!classInfo) throw new NotFoundException('Class not found');

      const lastClassSaving = await this.savingRepository.findOne({
        where: {
          owner_type: SavingOwnerType.CLASS,
          class_id,
          is_deleted: false,
        },
        order: { created_at: 'DESC', updated_at: 'DESC' },
      });

      const currentBalance = Number(lastClassSaving?.closing_balance ?? 0);
      const nextBalance = this.applyTransaction(
        currentBalance,
        transaction_type,
        Number(amount),
      );

      if (nextBalance < 0)
        throw new BadRequestException('Insufficient class balance');

      const savingData: DeepPartial<Saving> = {
        owner_type: SavingOwnerType.CLASS,
        created_by,
        student_id: null,
        class_id,
        branch_id,
        academic_year_id,
        transaction_type,
        opening_balance: currentBalance,
        amount: Number(amount),
        closing_balance: nextBalance,
        note,
        withdraw_reason_id: withdraw_reason_id ?? null, // ✅
        is_active: true,
        is_deleted: false,
      };

      const saving = this.savingRepository.create(savingData);
      const created = await this.savingRepository.save(saving);

      await this.createPayReceive(created);

      return await this.findOne(created.id);
    }

    throw new BadRequestException('Invalid owner_type');
  }

  // ─── CREATE CLASS SAVING ──────────────────────────────────────────────────

  async createClassSaving(dto: CreateClassSavingDto): Promise<Saving> {
    const {
      created_by,
      class_id,
      branch_id,
      academic_year_id,
      transaction_type,
      amount,
      note,
      withdraw_reason_id, // ✅
    } = dto;

    this.guardWithdrawReason(transaction_type, withdraw_reason_id); // ✅

    const classInfo = await this.classRepository.findOne({
      where: { id: class_id },
    });
    if (!classInfo) throw new NotFoundException('Class not found');

    const lastClassSaving = await this.savingRepository.findOne({
      where: { owner_type: SavingOwnerType.CLASS, class_id, is_deleted: false },
      order: { created_at: 'DESC', updated_at: 'DESC' },
    });

    const currentBalance = Number(lastClassSaving?.closing_balance ?? 0);
    const nextBalance = this.applyTransaction(
      currentBalance,
      transaction_type,
      Number(amount),
    );

    if (nextBalance < 0)
      throw new BadRequestException('Insufficient class balance');

    const savingData: DeepPartial<Saving> = {
      owner_type: SavingOwnerType.CLASS,
      created_by,
      student_id: null,
      class_id,
      branch_id,
      academic_year_id,
      transaction_type,
      opening_balance: currentBalance,
      amount: Number(amount),
      closing_balance: nextBalance,
      note,
      withdraw_reason_id: withdraw_reason_id ?? null, // ✅
      is_active: true,
      is_deleted: false,
    };

    const saving = this.savingRepository.create(savingData);
    const created = await this.savingRepository.save(saving);
    await this.createPayReceive(created);

    return await this.findOne(created.id);
  }

  // ─── CREATE STUDENTS SAVING SESSION ───────────────────────────────────────

  async createStudentsSavingSession(
    dto: CreateStudentsSavingSessionDto,
  ): Promise<SavingSession> {
    const {
      created_by,
      class_id,
      branch_id,
      academic_year_id,
      transaction_type,
      shared_note,
      students,
      withdraw_reason_id,
    } = dto;

    if (!students || students.length === 0)
      throw new BadRequestException('students must not be empty');

    this.guardWithdrawReason(transaction_type, withdraw_reason_id);

    // ── 1. Create session header first ────────────────────────────────────
    const session = await this.savingSessionRepository.save(
      this.savingSessionRepository.create({
        created_by,
        class_id: class_id ?? null,
        branch_id: branch_id ?? null,
        academic_year_id: academic_year_id ?? null,
        transaction_type,
        note: shared_note ?? null,
        withdraw_reason_id: withdraw_reason_id ?? null,
        total_students: students.length,
        total_amount: 0,
        success_count: 0,
        failed_count: 0,
      }),
    );

    // ── 2. Process each student ───────────────────────────────────────────
    let totalAmount = 0;
    let successCount = 0;
    let failedCount = 0;

    for (const entry of students) {
      try {
        const effectiveReasonId =
          entry.withdraw_reason_id ?? withdraw_reason_id;
        this.guardWithdrawReason(transaction_type, effectiveReasonId);

        const student = await this.getStudentWithRelations(entry.student_id);
        if (!student) {
          failedCount++;
          continue;
        }

        const studentData = student as any;
        const currentBalance = Number(studentData.saving_wallet ?? 0);
        const nextBalance = this.applyTransaction(
          currentBalance,
          transaction_type,
          Number(entry.amount),
        );

        if (nextBalance < 0) {
          failedCount++;
          continue;
        }

        const savingData: DeepPartial<Saving> = {
          owner_type: SavingOwnerType.STUDENT,
          created_by,
          session_id: session.id, // ✅ link to session
          student_id: student.id,
          class_id: studentData.classId?.id ?? null,
          branch_id: studentData.branch?.id ?? null,
          academic_year_id: studentData.academicYear?.id ?? null,
          transaction_type,
          opening_balance: currentBalance,
          amount: Number(entry.amount),
          closing_balance: nextBalance,
          withdraw_reason_id: effectiveReasonId ?? null,
          is_active: true,
          is_deleted: false,
        };

        const saving = this.savingRepository.create(savingData);
        const created = await this.savingRepository.save(saving);

        await this.recalculateStudentBalances(student.id);
        await this.createPayReceive(created);

        totalAmount += Number(entry.amount);
        successCount++;
      } catch {
        failedCount++;
      }
    }

    // ── 3. Update session summary counts ─────────────────────────────────
    session.total_amount = totalAmount;
    session.success_count = successCount;
    session.failed_count = failedCount;
    await this.savingSessionRepository.save(session);

    // ── 4. Return full session with nested savings ────────────────────────
    const result = await this.savingSessionRepository.findOne({
      where: { id: session.id },
      relations: {
        createdBy: true,
        class: true,
        branch: true,
        academic_year: true,
        withdrawReason: true,
        savings: {
          student: true,
          withdrawReason: true,
        },
      },
    });
    if (!result)
      throw new NotFoundException('Session not found after creation');

    return result;
  }

  // ─── CREATE BULK ──────────────────────────────────────────────────────────

  async createBulk(dto: CreateBulkSavingDto): Promise<{
    total: number;
    success_count: number;
    failed_count: number;
    success: Saving[];
    failed: { student_id: string; reason: string }[];
  }> {
    const {
      created_by,
      student_ids,
      transaction_type,
      amount,
      note,
      withdraw_reason_id, // ✅
    } = dto;

    if (!student_ids || student_ids.length === 0)
      throw new BadRequestException('student_ids must not be empty');

    this.guardWithdrawReason(transaction_type, withdraw_reason_id); // ✅

    const success: Saving[] = [];
    const failed: { student_id: string; reason: string }[] = [];

    for (const student_id of student_ids) {
      try {
        const student = await this.getStudentWithRelations(student_id);

        if (!student) {
          failed.push({ student_id, reason: 'Student not found' });
          continue;
        }

        const studentData = student as any;
        const currentBalance = Number(studentData.saving_wallet ?? 0);
        const nextBalance = this.applyTransaction(
          currentBalance,
          transaction_type,
          Number(amount),
        );

        if (nextBalance < 0) {
          failed.push({ student_id, reason: 'Insufficient balance' });
          continue;
        }

        const savingData: DeepPartial<Saving> = {
          owner_type: SavingOwnerType.STUDENT,
          created_by,
          student_id: student.id,
          class_id: studentData.classId?.id ?? null,
          branch_id: studentData.branch?.id ?? null,
          academic_year_id: studentData.academicYear?.id ?? null,
          transaction_type,
          opening_balance: currentBalance,
          amount: Number(amount),
          closing_balance: nextBalance,
          note,
          withdraw_reason_id: withdraw_reason_id ?? null, // ✅
          is_active: true,
          is_deleted: false,
        };

        const saving = this.savingRepository.create(savingData);
        const created = await this.savingRepository.save(saving);

        await this.recalculateStudentBalances(student.id);
        await this.createPayReceive(created);

        const full = await this.findOne(created.id);
        success.push(full);
      } catch (err: any) {
        failed.push({ student_id, reason: err?.message ?? 'Unknown error' });
      }
    }

    return {
      total: student_ids.length,
      success_count: success.length,
      failed_count: failed.length,
      success,
      failed,
    };
  }

  // ─── CREATE BULK BY CLASS ─────────────────────────────────────────────────

  async createBulkByClass(dto: CreateBulkSavingByClassDto): Promise<{
    total: number;
    success_count: number;
    failed_count: number;
    success: Saving[];
    failed: { student_id: string; reason: string }[];
  }> {
    const { class_id } = dto;

    const classInfo = await this.classRepository.findOne({
      where: { id: class_id },
    });
    if (!classInfo) throw new NotFoundException('Class not found');

    const students = await this.studentRepository.find({
      where: { classId: { id: class_id }, is_deleted: false } as any,
      select: ['id'] as any,
    });

    if (!students.length)
      throw new NotFoundException('No students found in this class');

    return this.createBulk({
      created_by: dto.created_by,
      student_ids: students.map((s) => s.id),
      transaction_type: dto.transaction_type,
      amount: dto.amount,
      note: dto.note,
      withdraw_reason_id: dto.withdraw_reason_id ?? undefined, // ✅
    });
  }

  // ─── FIND ALL ─────────────────────────────────────────────────────────────

  async findAll(): Promise<Saving[]> {
    return await this.savingRepository.find({
      where: { is_deleted: false },
      relations: {
        student: true,
        class: true,
        branch: true,
        academic_year: true,
        createdBy: true,
        withdrawReason: true, // ✅
      },
      order: { created_at: 'DESC' },
    });
  }

  // ─── FIND ONE ─────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<Saving> {
    const saving = await this.savingRepository.findOne({
      where: { id, is_deleted: false },
      relations: {
        student: true,
        class: true,
        branch: true,
        academic_year: true,
        createdBy: true,
        withdrawReason: true, // ✅
      },
    });

    if (!saving) throw new NotFoundException('Saving not found');
    return saving;
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  async update(id: string, updateSavingDto: UpdateSavingDto): Promise<Saving> {
    const saving = await this.savingRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!saving) throw new NotFoundException('Saving not found');
    if (!saving.student_id)
      throw new BadRequestException('Saving.student_id is missing');

    const oldStudentId = saving.student_id;
    const nextStudentId = updateSavingDto.student_id ?? oldStudentId;
    const student = await this.getStudentWithRelations(nextStudentId);

    if (!student) throw new NotFoundException('Student not found');

    const studentData = student as any;

    if (updateSavingDto.student_id !== undefined) {
      saving.owner_type = SavingOwnerType.STUDENT;
      saving.student_id = student.id;
      saving.class_id = null;
      saving.branch_id = studentData.branch?.id ?? null;
      saving.academic_year_id = null;
    }

    if (updateSavingDto.transaction_type !== undefined)
      saving.transaction_type = updateSavingDto.transaction_type;
    if (updateSavingDto.amount !== undefined)
      saving.amount = Number(updateSavingDto.amount);
    if (updateSavingDto.note !== undefined) saving.note = updateSavingDto.note;
    if (updateSavingDto.withdraw_reason_id !== undefined)
      // ✅
      saving.withdraw_reason_id = updateSavingDto.withdraw_reason_id ?? null;

    const updated = await this.savingRepository.save(saving);

    await this.recalculateStudentBalances(oldStudentId);
    if (
      saving.owner_type === SavingOwnerType.STUDENT &&
      saving.student_id &&
      saving.student_id !== oldStudentId
    ) {
      await this.recalculateStudentBalances(saving.student_id);
    }

    return await this.findOne(updated.id);
  }

  // ─── REMOVE ───────────────────────────────────────────────────────────────

  async remove(id: string): Promise<{ message: string }> {
    const saving = await this.savingRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!saving) throw new NotFoundException('Saving not found');

    saving.is_deleted = true;
    saving.is_active = false;

    await this.savingRepository.save(saving);

    if (saving.student_id)
      await this.recalculateStudentBalances(saving.student_id);

    return { message: 'Saving deleted successfully' };
  }

  // ─── GET STUDENT BALANCE ──────────────────────────────────────────────────

  async getStudentBalance(studentId: string) {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const studentData = student as any;
    return {
      student_id: student.id,
      student_code: studentData.student_id,
      student_name:
        `${studentData.first_name ?? ''} ${studentData.last_name ?? ''}`.trim(),
      current_balance: Number(studentData.saving_wallet ?? 0),
    };
  }

  // ─── GET CLASS BALANCE ────────────────────────────────────────────────────

  async getClassBalance(classId: string) {
    const classInfo = await this.classRepository.findOne({
      where: { id: classId },
    });
    if (!classInfo) throw new NotFoundException('Class not found');

    const savings = await this.savingRepository.find({
      where: { class_id: classId, is_deleted: false },
    });

    let total = 0;
    for (const item of savings) {
      if (item.transaction_type === SavingTransactionType.DEPOSIT)
        total += Number(item.amount);
      else if (item.transaction_type === SavingTransactionType.WITHDRAW)
        total -= Number(item.amount);
    }

    return {
      class_id: classId,
      current_balance: total,
      total_transactions: savings.length,
    };
  }

  // ─── GET SAVING HISTORY BY STUDENT ────────────────────────────────────────

  async getSavingHistoryByStudent(studentId: string): Promise<Saving[]> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    return await this.savingRepository.find({
      where: { student_id: studentId, is_deleted: false },
      relations: {
        student: true,
        class: true,
        branch: true,
        academic_year: true,
        createdBy: true,
        withdrawReason: true, // ✅
      },
      order: { created_at: 'DESC' },
    });
  }

  // ─── GET CLASS BALANCE WITH STUDENTS ──────────────────────────────────────

  async getClassBalanceWithStudents(classId: string) {
    const classInfo = await this.classRepository.findOne({
      where: { id: classId },
    });
    if (!classInfo) throw new NotFoundException('Class not found');

    const classSavings = await this.savingRepository.find({
      where: {
        owner_type: SavingOwnerType.CLASS,
        class_id: classId,
        is_deleted: false,
      },
      relations: { createdBy: true, withdrawReason: true }, // ✅
      order: { created_at: 'ASC', updated_at: 'ASC' },
    });

    const classBalance =
      classSavings.length > 0
        ? Number(classSavings[classSavings.length - 1].closing_balance)
        : 0;

    const classDepositTotal = classSavings
      .filter((i) => i.transaction_type === SavingTransactionType.DEPOSIT)
      .reduce((s, i) => s + Number(i.amount), 0);
    const classWithdrawTotal = classSavings
      .filter((i) => i.transaction_type === SavingTransactionType.WITHDRAW)
      .reduce((s, i) => s + Number(i.amount), 0);

    const students = await this.studentRepository.find({
      where: { classId: { id: classId }, is_deleted: false } as any,
      relations: { classId: true, branch: true, academicYear: true } as any,
      order: { createdAt: 'ASC' },
    });

    const studentIds = students.map((s: any) => s.id);
    let studentSavings: Saving[] = [];

    if (studentIds.length > 0) {
      studentSavings = await this.savingRepository.find({
        where: {
          owner_type: SavingOwnerType.STUDENT,
          student_id: In(studentIds),
          is_deleted: false,
        },
        relations: { createdBy: true, withdrawReason: true }, // ✅
        order: { created_at: 'ASC', updated_at: 'ASC' },
      });
    }

    const savingMap = new Map<string, Saving[]>();
    for (const item of studentSavings) {
      const key = item.student_id ?? '';
      if (!savingMap.has(key)) savingMap.set(key, []);
      savingMap.get(key)!.push(item);
    }

    return {
      class_id: classId,
      class_name: (classInfo as any).name ?? null,
      class_balance: classBalance,
      class_summary: {
        deposit_total: classDepositTotal,
        withdraw_total: classWithdrawTotal,
        total_transactions: classSavings.length,
      },
      class_history: classSavings.map((item) => ({
        id: item.id,
        transaction_type: item.transaction_type,
        opening_balance: this.formatMoney(item.opening_balance),
        amount: this.formatMoney(item.amount),
        closing_balance: this.formatMoney(item.closing_balance),
        note: item.note ?? null,
        withdraw_reason: item.withdrawReason ?? null, // ✅
        created_by: item.createdBy ?? null,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })),
      total_students: students.length,
      students: students.map((student: any) => {
        const histories = savingMap.get(student.id) ?? [];
        const depositTotal = histories
          .filter((i) => i.transaction_type === SavingTransactionType.DEPOSIT)
          .reduce((s, i) => s + Number(i.amount), 0);
        const withdrawTotal = histories
          .filter((i) => i.transaction_type === SavingTransactionType.WITHDRAW)
          .reduce((s, i) => s + Number(i.amount), 0);

        return {
          id: student.id,
          student_id: student.student_id,
          first_name: student.first_name,
          last_name: student.last_name,
          full_name:
            `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim(),
          gender: student.gender,
          profile_image_path: student.profile_image_path,
          saving_wallet: Number(student.saving_wallet ?? 0),
          class: null,
          branch: student.branch,
          academic_year: null,
          summary: {
            deposit_total: depositTotal,
            withdraw_total: withdrawTotal,
            total_transactions: histories.length,
          },
          history: histories.map((item) => ({
            id: item.id,
            transaction_type: item.transaction_type,
            opening_balance: Number(item.opening_balance),
            amount: Number(item.amount),
            closing_balance: Number(item.closing_balance),
            note: item.note ?? null,
            withdraw_reason: item.withdrawReason ?? null, // ✅
            created_by: item.createdBy ?? null,
            created_at: item.created_at,
            updated_at: item.updated_at,
          })),
        };
      }),
    };
  }

  // ─── REMOVE CLASS SAVING ──────────────────────────────────────────────────

  async removeClassSaving(id: string): Promise<{ message: string }> {
    const saving = await this.savingRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!saving) throw new NotFoundException('Saving not found');
    if (saving.owner_type !== SavingOwnerType.CLASS)
      throw new BadRequestException('This method is only for CLASS savings');

    saving.is_deleted = true;
    saving.is_active = false;
    await this.savingRepository.save(saving);

    return { message: 'Class saving deleted successfully' };
  }
}
