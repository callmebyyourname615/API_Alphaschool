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
  getClassBalanceWithStudentsByPost(
    @Body() body: GetClassBalanceStudentsDto,
  ) {
    return this.savingsService.getClassBalanceWithStudents(body.class_id);
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
}
