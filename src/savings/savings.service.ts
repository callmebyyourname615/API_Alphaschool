import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { In } from 'typeorm';
import { CreateSavingDto } from './dto/create-saving.dto';
import { UpdateSavingDto } from './dto/update-saving.dto';
import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';
import {
  Saving,
  SavingOwnerType,
  SavingTransactionType,
} from './savings.entity';

@Injectable()
export class SavingsService {
  constructor(
    @InjectRepository(Saving)
    private readonly savingRepository: Repository<Saving>,

    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,

    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
  ) {}

  private applyTransaction(
    balance: number,
    transactionType: SavingTransactionType,
    amount: number,
  ): number {
    if (transactionType === SavingTransactionType.DEPOSIT) {
      return balance + amount;
    }

    if (transactionType === SavingTransactionType.WITHDRAW) {
      return balance - amount;
    }

    return balance;
  }

  private async getStudentWithRelations(
    studentId: string,
  ): Promise<Student | null> {
    return await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.branch', 'branch')
      .leftJoinAndSelect('student.academicYear', 'academicYear')
      .leftJoinAndSelect('student.classId', 'class')
      .where('student.id = :studentId', { studentId })
      .getOne();
  }

  private async recalculateStudentBalances(studentId: string): Promise<void> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const savings = await this.savingRepository.find({
      where: {
        student_id: studentId,
        is_deleted: false,
      },
      order: {
        created_at: 'ASC',
        updated_at: 'ASC',
      },
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

    if (savings.length > 0) {
      await this.savingRepository.save(savings);
    }

    (student as any).saving_wallet = runningBalance.toFixed(2);
    await this.studentRepository.save(student);
  }

  async create(createSavingDto: CreateSavingDto): Promise<Saving> {
    const {
      owner_type,
      student_id,
      class_id,
      branch_id,
      academic_year_id,
      transaction_type,
      amount,
      note,
    } = createSavingDto;

    if (owner_type === SavingOwnerType.STUDENT) {
      if (!student_id) {
        throw new BadRequestException('student_id is required');
      }

      const student = await this.getStudentWithRelations(student_id);

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      const studentData = student as any;
      const currentBalance = Number(studentData.saving_wallet ?? 0);

      const nextBalance = this.applyTransaction(
        currentBalance,
        transaction_type,
        Number(amount),
      );

      if (nextBalance < 0) {
        throw new BadRequestException('Insufficient balance');
      }

      const savingData: DeepPartial<Saving> = {
        owner_type: SavingOwnerType.STUDENT,
        student_id: student.id,
        class_id: studentData.classId?.id ?? null,
        branch_id: studentData.branch?.id ?? null,
        academic_year_id: studentData.academicYear?.id ?? null,
        transaction_type,
        opening_balance: currentBalance,
        amount: Number(amount),
        closing_balance: nextBalance,
        note,
        is_active: true,
        is_deleted: false,
      };

      const saving = this.savingRepository.create(savingData);
      const created = await this.savingRepository.save(saving);

      await this.recalculateStudentBalances(student.id);

      return await this.findOne(created.id);
    }

    if (owner_type === SavingOwnerType.CLASS) {
      if (!class_id) {
        throw new BadRequestException('class_id is required');
      }

      if (!branch_id) {
        throw new BadRequestException('branch_id is required');
      }

      if (!academic_year_id) {
        throw new BadRequestException('academic_year_id is required');
      }

      const classInfo = await this.classRepository.findOne({
        where: { id: class_id },
      });

      if (!classInfo) {
        throw new NotFoundException('Class not found');
      }

      const lastClassSaving = await this.savingRepository.findOne({
        where: {
          owner_type: SavingOwnerType.CLASS,
          class_id,
          is_deleted: false,
        },
        order: {
          created_at: 'DESC',
          updated_at: 'DESC',
        },
      });

      const currentBalance = Number(lastClassSaving?.closing_balance ?? 0);

      const nextBalance = this.applyTransaction(
        currentBalance,
        transaction_type,
        Number(amount),
      );

      if (nextBalance < 0) {
        throw new BadRequestException('Insufficient class balance');
      }

      const savingData: DeepPartial<Saving> = {
        owner_type: SavingOwnerType.CLASS,
        student_id: null,
        class_id,
        branch_id,
        academic_year_id,
        transaction_type,
        opening_balance: currentBalance,
        amount: Number(amount),
        closing_balance: nextBalance,
        note,
        is_active: true,
        is_deleted: false,
      };

      const saving = this.savingRepository.create(savingData);
      const created = await this.savingRepository.save(saving);
      return await this.findOne(created.id);
    }

    throw new BadRequestException('Invalid owner_type');
  }

  async findAll(): Promise<Saving[]> {
    return await this.savingRepository.find({
      where: {
        is_deleted: false,
      },
      relations: {
        student: true,
        class: true,
        branch: true,
        academic_year: true,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Saving> {
    const saving = await this.savingRepository.findOne({
      where: {
        id,
        is_deleted: false,
      },
      relations: {
        student: true,
        class: true,
        branch: true,
        academic_year: true,
      },
    });

    if (!saving) {
      throw new NotFoundException('Saving not found');
    }

    return saving;
  }

  async update(id: string, updateSavingDto: UpdateSavingDto): Promise<Saving> {
    const saving = await this.savingRepository.findOne({
      where: {
        id,
        is_deleted: false,
      },
    });

    if (!saving) {
      throw new NotFoundException('Saving not found');
    }

    if (!saving.student_id) {
      throw new BadRequestException('Saving.student_id is missing');
    }

    const oldStudentId = saving.student_id;
    const nextStudentId = updateSavingDto.student_id ?? oldStudentId;

    const student = await this.getStudentWithRelations(nextStudentId);

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const studentData = student as any;

    if (updateSavingDto.student_id !== undefined) {
      saving.owner_type = SavingOwnerType.STUDENT;
      saving.student_id = student.id;
      saving.class_id = studentData.classId?.id ?? null;
      saving.branch_id = studentData.branch?.id ?? null;
      saving.academic_year_id = studentData.academicYear?.id ?? null;
    }

    if (updateSavingDto.transaction_type !== undefined) {
      saving.transaction_type = updateSavingDto.transaction_type;
    }

    if (updateSavingDto.amount !== undefined) {
      saving.amount = Number(updateSavingDto.amount);
    }

    if (updateSavingDto.note !== undefined) {
      saving.note = updateSavingDto.note;
    }

    const updated = await this.savingRepository.save(saving);

    await this.recalculateStudentBalances(oldStudentId);

    if (saving.owner_type === SavingOwnerType.STUDENT && saving.student_id) {
      await this.recalculateStudentBalances(saving.student_id);
    }

    return await this.findOne(updated.id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const saving = await this.savingRepository.findOne({
      where: {
        id,
        is_deleted: false,
      },
    });

    if (!saving) {
      throw new NotFoundException('Saving not found');
    }

    if (!saving.student_id) {
      throw new BadRequestException('Saving.student_id is missing');
    }

    saving.is_deleted = true;
    saving.is_active = false;

    await this.savingRepository.save(saving);
    await this.recalculateStudentBalances(saving.student_id);

    return {
      message: 'Saving deleted successfully',
    };
  }
  async getStudentBalance(studentId: string) {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const studentData = student as any;

    return {
      student_id: student.id,
      student_code: studentData.student_id,
      student_name:
        `${studentData.first_name ?? ''} ${studentData.last_name ?? ''}`.trim(),
      current_balance: Number(studentData.saving_wallet ?? 0),
    };
  }

  async getClassBalance(classId: string) {
    const classInfo = await this.classRepository.findOne({
      where: { id: classId },
    });

    if (!classInfo) {
      throw new NotFoundException('Class not found');
    }

    const savings = await this.savingRepository.find({
      where: {
        class_id: classId,
        is_deleted: false,
      },
    });

    let total = 0;

    for (const item of savings) {
      if (item.transaction_type === SavingTransactionType.DEPOSIT) {
        total += Number(item.amount);
      } else if (item.transaction_type === SavingTransactionType.WITHDRAW) {
        total -= Number(item.amount);
      }
    }

    return {
      class_id: classId,
      current_balance: total,
      total_transactions: savings.length,
    };
  }

  async getSavingHistoryByStudent(studentId: string): Promise<Saving[]> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return await this.savingRepository.find({
      where: {
        student_id: studentId,
        is_deleted: false,
      },
      relations: {
        student: true,
        class: true,
        branch: true,
        academic_year: true,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  async getClassBalanceWithStudents(classId: string) {
    const classInfo = await this.classRepository.findOne({
      where: { id: classId },
    });

    if (!classInfo) {
      throw new NotFoundException('Class not found');
    }

    const classSavings = await this.savingRepository.find({
      where: {
        owner_type: SavingOwnerType.CLASS,
        class_id: classId,
        is_deleted: false,
      },
      order: {
        created_at: 'ASC',
        updated_at: 'ASC',
      },
    });

    const classBalance =
      classSavings.length > 0
        ? Number(classSavings[classSavings.length - 1].closing_balance)
        : 0;

    const classDepositTotal = classSavings
      .filter((item) => item.transaction_type === SavingTransactionType.DEPOSIT)
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const classWithdrawTotal = classSavings
      .filter(
        (item) => item.transaction_type === SavingTransactionType.WITHDRAW,
      )
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const students = await this.studentRepository.find({
      where: {
        classId: {
          id: classId,
        },
        is_deleted: false,
      } as any,
      relations: {
        classId: true,
        branch: true,
        academicYear: true,
      } as any,
      order: {
        created_at: 'ASC',
      },
    });

    const studentIds = students.map((student: any) => student.id);

    let studentSavings: Saving[] = [];

    if (studentIds.length > 0) {
      studentSavings = await this.savingRepository.find({
        where: {
          owner_type: SavingOwnerType.STUDENT,
          student_id: In(studentIds),
          is_deleted: false,
        },
        order: {
          created_at: 'ASC',
          updated_at: 'ASC',
        },
      });
    }

    const savingMap = new Map<string, Saving[]>();

    for (const item of studentSavings) {
      const key = item.student_id ?? '';
      if (!savingMap.has(key)) {
        savingMap.set(key, []);
      }
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
        created_at: item.created_at,
        updated_at: item.updated_at,
      })),
      total_students: students.length,
      students: students.map((student: any) => {
        const histories = savingMap.get(student.id) ?? [];

        const depositTotal = histories
          .filter(
            (item) => item.transaction_type === SavingTransactionType.DEPOSIT,
          )
          .reduce((sum, item) => sum + Number(item.amount), 0);

        const withdrawTotal = histories
          .filter(
            (item) => item.transaction_type === SavingTransactionType.WITHDRAW,
          )
          .reduce((sum, item) => sum + Number(item.amount), 0);

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
          class: student.classId,
          branch: student.branch,
          academic_year: student.academicYear,
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
            created_at: item.created_at,
            updated_at: item.updated_at,
          })),
        };
      }),
    };
  }

  private formatMoney(value: string | number | null | undefined): string {
    return Number(value ?? 0).toFixed(2);
  }
}
