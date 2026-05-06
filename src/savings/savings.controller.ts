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
import { SavingsService } from './savings.service';
import { CreateSavingDto } from './dto/create-saving.dto';
import { UpdateSavingDto } from './dto/update-saving.dto';
import { GetClassBalanceStudentsDto } from './dto/get-class-balance-students.dto';
import { CreateBulkSavingDto } from './dto/create-bulk-saving.dto';
import { CreateBulkSavingByClassDto } from './dto/create-bulk-saving-by-class.dto';
import { CreateClassSavingDto } from './dto/create-class-saving.dto';
import { CreateStudentsSavingSessionDto } from './dto/create-students-saving-session.dto';

@Controller('savings')
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  @Post()
  create(@Body() createSavingDto: CreateSavingDto) {
    return this.savingsService.create(createSavingDto);
  }

  @Get()
  findAll() {
    return this.savingsService.findAll();
  }

  @Post('class/balance-students')
  getClassBalanceWithStudentsByPost(@Body() body: GetClassBalanceStudentsDto) {
    return this.savingsService.getClassBalanceWithStudents(body.class_id);
  }

  @Post('class')
  createClassSaving(@Body() dto: CreateClassSavingDto) {
    return this.savingsService.createClassSaving(dto);
  }

  @Post('students/session')
  createStudentsSavingSession(@Body() dto: CreateStudentsSavingSessionDto) {
    return this.savingsService.createStudentsSavingSession(dto);
  }

  @Post('bulk')
  createBulk(@Body() dto: CreateBulkSavingDto) {
    return this.savingsService.createBulk(dto);
  }

  @Post('bulk/by-class')
  createBulkByClass(@Body() dto: CreateBulkSavingByClassDto) {
    return this.savingsService.createBulkByClass(dto);
  }

  @Get('student/:studentId/balance')
  getStudentBalance(
    @Param('studentId', new ParseUUIDPipe()) studentId: string,
  ) {
    return this.savingsService.getStudentBalance(studentId);
  }

  @Get('class/:classId/balance')
  getClassBalance(@Param('classId', new ParseUUIDPipe()) classId: string) {
    return this.savingsService.getClassBalance(classId);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.savingsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateSavingDto: UpdateSavingDto,
  ) {
    return this.savingsService.update(id, updateSavingDto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.savingsService.remove(id);
  }
}