import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PayReceiveService } from './pay-receive.service';
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

// ─── File interceptor for bank deposit paper (PDF only) ───────────────────────

export const bankDepositPaperInterceptor = FileInterceptor('bank_deposited_paper', {
  storage: diskStorage({
    destination: './uploads/bank-deposit-papers',
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(
        new BadRequestException(
          `File type '${ext}' not allowed. Allowed: ${allowed.join(', ')}`,
        ),
        false,
      );
    }
    cb(null, true);
  },
});

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller('pay-receive')
export class PayReceiveController {
  constructor(private readonly payReceiveService: PayReceiveService) {}

  // ─── CREATE ─────────────────────────────────────────────────────────────────

  @Post()
  create(@Body() dto: CreatePayReceiveDto) {
    return this.payReceiveService.create(dto);
  }

  // ─── FIND ALL ───────────────────────────────────────────────────────────────

  @Get()
  findAll() {
    return this.payReceiveService.findAll();
  }

  @Get('deposits')
  findAllDeposits() {
    return this.payReceiveService.findAllDeposits();
  }

  @Get('withdrawals')
  findAllWithdrawals() {
    return this.payReceiveService.findAllWithdrawals();
  }

  @Get('by-saving/:savingId')
  findBySaving(@Param('savingId', ParseUUIDPipe) savingId: string) {
    return this.payReceiveService.findBySaving(savingId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.payReceiveService.findOne(id);
  }

  // ─── UPDATE ─────────────────────────────────────────────────────────────────

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePayReceiveDto,
  ) {
    return this.payReceiveService.update(id, dto);
  }

  // ===========================================================================
  // DEPOSIT CHAIN
  // ===========================================================================

  @Patch(':id/teacher-submit')
  teacherSubmit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TeacherSubmitDto,
  ) {
    return this.payReceiveService.teacherSubmit(id, dto);
  }

  @Patch(':id/admin-receive-deposit')
  adminReceiveDeposit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminReceiveDto,
  ) {
    return this.payReceiveService.adminReceiveDeposit(id, dto);
  }

  /**
   * DEPOSIT — Step 3: Admin confirms bank deposit and uploads the bank receipt PDF.
   *
   * Request: multipart/form-data
   * Fields:
   *   - bank_deposited_by      (UUID, required)
   *   - bank_reference         (string, optional)
   *   - note                   (string, optional)
   *   - bank_deposited_paper   (PDF file, optional)
   *
   * Stored in DB as: "originalname|uploads/bank-deposit-papers/<timestamp-random>.pdf"
   * Split on "|" on the frontend → [displayName, filePath]
   */
  @Patch(':id/bank-deposit')
  @UseInterceptors(bankDepositPaperInterceptor)
  async confirmBankDeposit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: BankDepositDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const bank_deposited_paper = file
      ? `${file.originalname}|uploads/bank-deposit-papers/${file.filename}`
      : null;

    return this.payReceiveService.confirmBankDeposit(id, {
      ...body,
      bank_deposited_paper,
    });
  }

  @Patch(':id/super-admin-confirm-deposit')
  superAdminConfirmDeposit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuperAdminConfirmDepositDto,
  ) {
    return this.payReceiveService.superAdminConfirmDeposit(id, dto);
  }

  // ===========================================================================
  // WITHDRAWAL CHAIN
  // ===========================================================================

  @Patch(':id/admin-confirm-withdrawal')
  adminConfirmWithdrawal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminConfirmWithdrawalDto,
  ) {
    return this.payReceiveService.adminConfirmWithdrawal(id, dto);
  }

  @Patch(':id/super-admin-approve-withdrawal')
  superAdminApproveWithdrawal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuperAdminApproveWithdrawalDto,
  ) {
    return this.payReceiveService.superAdminApproveWithdrawal(id, dto);
  }

  @Patch(':id/super-admin-reject-withdrawal')
  superAdminRejectWithdrawal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuperAdminRejectWithdrawalDto,
  ) {
    return this.payReceiveService.superAdminRejectWithdrawal(id, dto);
  }

  @Patch(':id/parent-receive')
  parentReceive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ParentReceiveDto,
  ) {
    return this.payReceiveService.parentReceive(id, dto);
  }

  @Patch(':id/teacher-receive')
  teacherReceive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TeacherReceiveDto,
  ) {
    return this.payReceiveService.teacherReceive(id, dto);
  }

  // ===========================================================================
  // SHARED
  // ===========================================================================

  @Patch(':id/reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectDto,
  ) {
    return this.payReceiveService.reject(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.payReceiveService.remove(id);
  }
}