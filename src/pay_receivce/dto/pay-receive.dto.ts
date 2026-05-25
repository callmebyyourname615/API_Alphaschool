import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PayReceiveStatus } from '../pay-receive.entity';

// ─── CREATE ───────────────────────────────────────────────────────────────────

export class CreatePayReceiveDto {
  @IsUUID()
  saving_id: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsUUID()
  initiated_by?: string;  // ✅ new
}

export class TeacherReceiveDto {
  @IsUUID()
  teacher_received_by: string;

  @IsOptional()
  @IsString()
  note?: string;
}

// ─── UPDATE (note / amount while PENDING) ─────────────────────────────────────

export class UpdatePayReceiveDto {
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

// =============================================================================
// DEPOSIT CHAIN DTOs
// =============================================================================

// Step 2a — Teacher submits cash to admin
export class TeacherSubmitDto {
  @IsUUID()
  @IsNotEmpty()
  submitted_by: string;

  @IsString()
  @IsOptional()
  note?: string;
}

// Step 2b — Admin confirms receipt from teacher
export class AdminReceiveDto {
  @IsUUID()
  @IsNotEmpty()
  received_by: string;

  @IsString()
  @IsOptional()
  note?: string;
}

// Step 3 — Admin confirms bank deposit
export class BankDepositDto {
  @IsUUID()
  @IsNotEmpty()
  bank_deposited_by: string;

  @IsString()
  @IsOptional()
  bank_reference?: string;

  @IsString()
  @IsOptional()
  bank_deposited_paper?: string | null;  // ✅ PDF file path/URL for bank deposit paper

  @IsString()
  @IsOptional()
  note?: string;
}

// Step 4 — Super admin final confirmation (deposit)
export class SuperAdminConfirmDepositDto {
  @IsUUID()
  @IsNotEmpty()
  super_admin_confirmed_by: string;

  @IsString()
  @IsOptional()
  note?: string;
}

// =============================================================================
// WITHDRAWAL CHAIN DTOs
// =============================================================================

// Step 2 — Admin confirms withdrawal and forwards to super admin
export class AdminConfirmWithdrawalDto {
  @IsUUID()
  @IsNotEmpty()
  admin_confirmed_by: string;

  @IsString()
  @IsOptional()
  note?: string;
}

// Step 3a — Super admin approves withdrawal
export class SuperAdminApproveWithdrawalDto {
  @IsUUID()
  @IsNotEmpty()
  super_admin_approved_by: string;

  @IsString()
  @IsOptional()
  note?: string;
}

// Step 3b — Super admin rejects withdrawal (saving will be reversed)
export class SuperAdminRejectWithdrawalDto {
  @IsUUID()
  @IsNotEmpty()
  super_admin_rejected_by: string;

  @IsString()
  @IsOptional()
  rejection_reason?: string;
}

// Step 4 — Parent confirms pickup on mobile app
export class ParentReceiveDto {
  @IsUUID()
  @IsNotEmpty()
  parent_received_by: string;

  @IsString()
  @IsOptional()
  note?: string;
}

// =============================================================================
// SHARED
// =============================================================================

// Reject at any point before a terminal status
export class RejectDto {
  @IsUUID()
  @IsNotEmpty()
  rejected_by: string;

  @IsString()
  @IsOptional()
  rejection_reason?: string;
}

// Legacy — kept for backwards compatibility
export class UpdatePayReceiveStatusDto {
  @IsEnum(PayReceiveStatus)
  status: PayReceiveStatus;

  @IsUUID()
  @IsOptional()
  received_by?: string;
}