// src/save_withdraw_reason/save-withdraw-reason.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { SaveWithdrawReasonService } from './save-withdraw-reason.service';
import {
  CreateSaveWithdrawReasonDto,
  UpdateSaveWithdrawReasonDto,
} from './dto/save-withdraw-reason.dto';

@Controller('save-withdraw-reasons')
export class SaveWithdrawReasonController {
  constructor(private readonly service: SaveWithdrawReasonService) {}

  /** POST /save-withdraw-reasons */
  @Post()
  create(@Body() dto: CreateSaveWithdrawReasonDto) {
    return this.service.create(dto);
  }

  /** GET /save-withdraw-reasons */
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /** GET /save-withdraw-reasons/active */
  @Get('active')
  findAllActive() {
    return this.service.findAllActive();
  }

  /** GET /save-withdraw-reasons/:id */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  /** PATCH /save-withdraw-reasons/:id */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSaveWithdrawReasonDto,
  ) {
    return this.service.update(id, dto);
  }

  /** PATCH /save-withdraw-reasons/:id/toggle-status */
  @Patch(':id/toggle-status')
  toggleStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.toggleStatus(id);
  }

  /** DELETE /save-withdraw-reasons/:id */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}