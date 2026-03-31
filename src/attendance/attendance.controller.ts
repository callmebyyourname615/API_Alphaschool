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
import { AttendancesService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { ScanQrDto } from './dto/scan-qr.dto';
import { GetStudentsByDateRangeDto } from './dto/get-students-by-date-range.dto';

@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post()
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendancesService.create(createAttendanceDto);
  }

  @Post('scan')
  scanQr(@Body() scanQrDto: ScanQrDto) {
    return this.attendancesService.scanQr(scanQrDto);
  }

  @Post('auto-absent/run')
  runAutoAbsentNow() {
    return this.attendancesService.runAutoAbsentNow();
  }

  @Get()
  findAll() {
    return this.attendancesService.findAll();
  }

  @Get('today/status')
  getTodayStudentStatuses() {
    return this.attendancesService.getTodayStudentStatuses();
  }

  @Get('classes/:classId/students')
  getStudentsByClass(@Param('classId', new ParseUUIDPipe()) classId: string) {
    return this.attendancesService.getStudentsByClass(classId);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.attendancesService.findOne(id);
  }

  @Post('classes/all-students')
  getAllStudentsByClassByPost(
    @Body('classId', new ParseUUIDPipe()) classId: string,
  ) {
    return this.attendancesService.getAllStudentsByClass(classId);
  }

  @Post('students/date-range')
  getStudentsByDateRange(@Body() body: GetStudentsByDateRangeDto) {
    return this.attendancesService.getStudentsByDateRange(body);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ) {
    return this.attendancesService.update(id, updateAttendanceDto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.attendancesService.remove(id);
  }
}
