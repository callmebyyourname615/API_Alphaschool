import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PayReceiveService } from './pay-receive.service';
import { UpdatePayReceiveStatusDto } from './dto/pay-receive.dto';

@Controller('pay-receive')
export class PayReceiveController {
  constructor(private readonly payReceiveService: PayReceiveService) {}

  // GET /pay-receive
  // Admin sees all pending/received/rejected records
  @Get()
  findAll() {
    return this.payReceiveService.findAll();
  }

  // GET /pay-receive/:id
  // Admin sees one record with full saving detail
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.payReceiveService.findOne(id);
  }

  // PATCH /pay-receive/:id/status
  // Admin clicks Receive or Reject
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePayReceiveStatusDto,
  ) {
    return this.payReceiveService.updateStatus(id, dto);
  }
}