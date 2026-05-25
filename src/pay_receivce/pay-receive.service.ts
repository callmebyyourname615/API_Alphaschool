import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PayReceive,
  PayReceiveFlowType,
  PayReceiveStatus,
} from './pay-receive.entity';
import {
  AdminConfirmWithdrawalDto,
  AdminReceiveDto,
  BankDepositDto,
  CreatePayReceiveDto,
  ParentReceiveDto,
  RejectDto,
  SuperAdminApproveWithdrawalDto,
  SuperAdminConfirmDepositDto,
  SuperAdminRejectWithdrawalDto,
  TeacherReceiveDto,
  TeacherSubmitDto,
  UpdatePayReceiveDto,
} from './dto/pay-receive.dto';
import { SavingsService } from '../savings/savings.service';
import { SavingOwnerType } from '../savings/savings.entity';

@Injectable()
export class PayReceiveService {
  constructor(
    @InjectRepository(PayReceive)
    private readonly payReceiveRepo: Repository<PayReceive>,

    @Inject(forwardRef(() => SavingsService))
    private readonly savingsService: SavingsService,
  ) {}

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

  private withRelations() {
    return {
      saving: {
        student:       true,
        class:         true,
        branch:        true,
        academic_year: true,
      },
    } as const;
  }

  private guardStatus(
    record: PayReceive,
    required: PayReceiveStatus,
    action: string,
  ): void {
    if (record.status !== required) {
      throw new BadRequestException(
        `Cannot "${action}": status is "${record.status}", expected "${required}"`,
      );
    }
  }

  private guardStatusIn(
    record: PayReceive,
    allowed: PayReceiveStatus[],
    action: string,
  ): void {
    if (!allowed.includes(record.status)) {
      throw new BadRequestException(
        `Cannot "${action}": status is "${record.status}", expected one of [${allowed.join(', ')}]`,
      );
    }
  }

  private guardNotDeleted(record: PayReceive): void {
    if (record.is_deleted)
      throw new BadRequestException('This record has been soft-deleted');
  }

  private guardFlowType(
    record: PayReceive,
    expected: PayReceiveFlowType,
    action: string,
  ): void {
    if (record.flow_type !== expected) {
      throw new BadRequestException(
        `Cannot "${action}": endpoint is for flow_type="${expected}" but record is "${record.flow_type}"`,
      );
    }
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async create(dto: CreatePayReceiveDto): Promise<PayReceive> {
    const record = this.payReceiveRepo.create({
      saving_id:    dto.saving_id,
      amount:       dto.amount,
      note:         dto.note ?? null,
      initiated_by: dto.initiated_by ?? null, // ✅ who created it
      flow_type:    PayReceiveFlowType.DEPOSIT,
      status:       PayReceiveStatus.PENDING,
      is_deleted:   false,
    });
    return await this.payReceiveRepo.save(record);
  }

  // ─── FIND ALL ─────────────────────────────────────────────────────────────

  async findAll(): Promise<PayReceive[]> {
    return await this.payReceiveRepo.find({
      where:     { is_deleted: false },
      relations: this.withRelations(),
      order:     { created_at: 'DESC' },
    });
  }

  async findAllDeposits(): Promise<PayReceive[]> {
    return await this.payReceiveRepo.find({
      where:     { flow_type: PayReceiveFlowType.DEPOSIT, is_deleted: false },
      relations: this.withRelations(),
      order:     { created_at: 'DESC' },
    });
  }

  async findAllWithdrawals(): Promise<PayReceive[]> {
    return await this.payReceiveRepo.find({
      where:     { flow_type: PayReceiveFlowType.WITHDRAWAL, is_deleted: false },
      relations: this.withRelations(),
      order:     { created_at: 'DESC' },
    });
  }

  async findBySaving(savingId: string): Promise<PayReceive[]> {
    return await this.payReceiveRepo.find({
      where:     { saving_id: savingId, is_deleted: false },
      relations: this.withRelations(),
      order:     { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PayReceive> {
    const record = await this.payReceiveRepo.findOne({
      where:     { id, is_deleted: false },
      relations: this.withRelations(),
    });
    if (!record) throw new NotFoundException(`PayReceive "${id}" not found`);
    return record;
  }

  // ─── UPDATE (PENDING only) ────────────────────────────────────────────────

  async update(id: string, dto: UpdatePayReceiveDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardStatus(record, PayReceiveStatus.PENDING, 'edit');
    Object.assign(record, dto);
    return await this.payReceiveRepo.save(record);
  }

  // ===========================================================================
  // DEPOSIT CHAIN
  // ===========================================================================

  async teacherSubmit(id: string, dto: TeacherSubmitDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.DEPOSIT, 'teacher-submit');
    this.guardStatus(record, PayReceiveStatus.PENDING, 'teacher-submit');

    record.status       = PayReceiveStatus.TEACHER_SUBMITTED;
    record.submitted_by = dto.submitted_by;
    record.submitted_at = new Date();
    if (dto.note) record.note = dto.note;

    return await this.payReceiveRepo.save(record);
  }

  async adminReceiveDeposit(id: string, dto: AdminReceiveDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.DEPOSIT, 'admin-receive-deposit');
    this.guardStatus(record, PayReceiveStatus.TEACHER_SUBMITTED, 'admin-receive-deposit');

    record.status      = PayReceiveStatus.ADMIN_RECEIVED;
    record.received_by = dto.received_by;
    record.received_at = new Date();
    if (dto.note) record.note = dto.note;

    return await this.payReceiveRepo.save(record);
  }

  async confirmBankDeposit(id: string, dto: BankDepositDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.DEPOSIT, 'bank-deposit');
    this.guardStatus(record, PayReceiveStatus.ADMIN_RECEIVED, 'bank-deposit');

    record.status            = PayReceiveStatus.BANK_DEPOSITED;
    record.bank_deposited_by = dto.bank_deposited_by;
    record.bank_deposited_at = new Date();
    record.bank_reference    = dto.bank_reference ?? null;
    record.bank_deposited_paper = dto.bank_deposited_paper ?? null;
    if (dto.note) record.note = dto.note;

    return await this.payReceiveRepo.save(record);
  }

  async superAdminConfirmDeposit(
    id: string,
    dto: SuperAdminConfirmDepositDto,
  ): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.DEPOSIT, 'super-admin-confirm-deposit');
    this.guardStatus(record, PayReceiveStatus.BANK_DEPOSITED, 'super-admin-confirm-deposit');

    record.status                   = PayReceiveStatus.SUPER_ADMIN_CONFIRMED;
    record.super_admin_confirmed_by = dto.super_admin_confirmed_by;
    record.super_admin_confirmed_at = new Date();
    if (dto.note) record.note = dto.note;

    return await this.payReceiveRepo.save(record);
  }

  // ===========================================================================
  // WITHDRAWAL CHAIN
  // ===========================================================================

  async adminConfirmWithdrawal(
    id: string,
    dto: AdminConfirmWithdrawalDto,
  ): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.WITHDRAWAL, 'admin-confirm-withdrawal');
    this.guardStatus(record, PayReceiveStatus.PENDING, 'admin-confirm-withdrawal');

    record.status             = PayReceiveStatus.ADMIN_CONFIRMED;
    record.admin_confirmed_by = dto.admin_confirmed_by;
    record.admin_confirmed_at = new Date();
    if (dto.note) record.note = dto.note;

    return await this.payReceiveRepo.save(record);
  }

  async superAdminApproveWithdrawal(
    id: string,
    dto: SuperAdminApproveWithdrawalDto,
  ): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.WITHDRAWAL, 'super-admin-approve-withdrawal');
    this.guardStatus(record, PayReceiveStatus.ADMIN_CONFIRMED, 'super-admin-approve-withdrawal');

    record.status                  = PayReceiveStatus.SUPER_ADMIN_APPROVED;
    record.super_admin_approved_by = dto.super_admin_approved_by;
    record.super_admin_approved_at = new Date();
    if (dto.note) record.note = dto.note;

    return await this.payReceiveRepo.save(record);
  }

  /**
   * WITHDRAWAL — Step 3b (REJECT)
   * ✅ Fixed: handles both STUDENT and CLASS owner types correctly.
   * For STUDENT → soft-delete saving and recalculate wallet.
   * For CLASS   → soft-delete saving only (no wallet recalculation).
   */
  async superAdminRejectWithdrawal(
    id: string,
    dto: SuperAdminRejectWithdrawalDto,
  ): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.WITHDRAWAL, 'super-admin-reject-withdrawal');
    this.guardStatus(record, PayReceiveStatus.ADMIN_CONFIRMED, 'super-admin-reject-withdrawal');

    const ownerType = record.saving?.owner_type;

    if (ownerType === SavingOwnerType.STUDENT) {
      // Soft-delete saving → recalculateStudentBalances runs inside remove()
      await this.savingsService.remove(record.saving_id);
    } else if (ownerType === SavingOwnerType.CLASS) {
      // Soft-delete saving only — no student wallet involved
      await this.savingsService.removeClassSaving(record.saving_id);
    } else {
      throw new BadRequestException('Unknown saving owner_type on this record');
    }

    record.status                  = PayReceiveStatus.SUPER_ADMIN_REJECTED;
    record.super_admin_rejected_by = dto.super_admin_rejected_by;
    record.super_admin_rejected_at = new Date();
    record.rejection_reason        = dto.rejection_reason ?? null;

    return await this.payReceiveRepo.save(record);
  }

  /**
   * WITHDRAWAL — Step 4a (STUDENT flow)
   * Parent collects cash and confirms on mobile.
   * SUPER_ADMIN_APPROVED → PARENT_RECEIVED
   */
  async parentReceive(id: string, dto: ParentReceiveDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.WITHDRAWAL, 'parent-receive');
    this.guardStatus(record, PayReceiveStatus.SUPER_ADMIN_APPROVED, 'parent-receive');

    // ✅ Guard: only STUDENT savings should reach this endpoint
    if (record.saving?.owner_type !== SavingOwnerType.STUDENT) {
      throw new BadRequestException(
        'Cannot "parent-receive": this saving belongs to a CLASS, use teacher-receive instead',
      );
    }

    record.status             = PayReceiveStatus.PARENT_RECEIVED;
    record.parent_received_by = dto.parent_received_by;
    record.parent_received_at = new Date();
    if (dto.note) record.note = dto.note;

    return await this.payReceiveRepo.save(record);
  }

  /**
   * WITHDRAWAL — Step 4b (CLASS flow) ✅ new
   * Teacher/admin collects cash from super admin.
   * SUPER_ADMIN_APPROVED → TEACHER_RECEIVED
   */
  async teacherReceive(id: string, dto: TeacherReceiveDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardFlowType(record, PayReceiveFlowType.WITHDRAWAL, 'teacher-receive');
    this.guardStatus(record, PayReceiveStatus.SUPER_ADMIN_APPROVED, 'teacher-receive');

    // ✅ Guard: only CLASS savings should reach this endpoint
    if (record.saving?.owner_type !== SavingOwnerType.CLASS) {
      throw new BadRequestException(
        'Cannot "teacher-receive": this saving belongs to a STUDENT, use parent-receive instead',
      );
    }

    record.status               = PayReceiveStatus.TEACHER_RECEIVED;
    record.teacher_received_by  = dto.teacher_received_by;
    record.teacher_received_at  = new Date();
    if (dto.note) record.note   = dto.note;

    return await this.payReceiveRepo.save(record);
  }

  // ===========================================================================
  // SHARED REJECT
  // ===========================================================================

  async reject(id: string, dto: RejectDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);

    const terminalStatuses: PayReceiveStatus[] = [
      PayReceiveStatus.SUPER_ADMIN_CONFIRMED,
      PayReceiveStatus.PARENT_RECEIVED,
      PayReceiveStatus.TEACHER_RECEIVED, // ✅ new terminal
      PayReceiveStatus.SUPER_ADMIN_REJECTED,
      PayReceiveStatus.REJECTED,
    ];

    if (terminalStatuses.includes(record.status)) {
      throw new BadRequestException(
        `Cannot reject: already in terminal status "${record.status}"`,
      );
    }

    record.status           = PayReceiveStatus.REJECTED;
    record.rejected_by      = dto.rejected_by;
    record.rejected_at      = new Date();
    record.rejection_reason = dto.rejection_reason ?? null;

    return await this.payReceiveRepo.save(record);
  }

  // ─── SOFT DELETE (PENDING only) ───────────────────────────────────────────

  async remove(id: string): Promise<{ message: string }> {
    const record = await this.findOne(id);
    this.guardNotDeleted(record);
    this.guardStatus(record, PayReceiveStatus.PENDING, 'delete');

    record.is_deleted = true;
    await this.payReceiveRepo.save(record);
    return { message: `PayReceive "${id}" deleted successfully` };
  }
}