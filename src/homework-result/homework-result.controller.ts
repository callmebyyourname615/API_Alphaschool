import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HomeworkResultService } from './homework-result.service';
import { CreateHomeworkResultDto } from './dto/create-homework-result.dto';
import { BulkCreateHomeworkResultDto } from './dto/bulk-create-homework-result.dto';
import { UpdateHomeworkResultDto } from './dto/update-homework-result.dto';

@Controller('homework-results')
export class HomeworkResultController {
  constructor(private readonly homeworkResultService: HomeworkResultService) {}

  // POST /homework-results
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateHomeworkResultDto) {
    return this.homeworkResultService.create(dto);
  }

  // POST /homework-results/bulk
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  bulkCreate(@Body() dto: BulkCreateHomeworkResultDto) {
    return this.homeworkResultService.bulkCreate(dto);
  }

  // GET /homework-results
  @Get()
  findAll() {
    return this.homeworkResultService.findAll();
  }

  // GET /homework-results/:id
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.homeworkResultService.findOne(id);
  }

  // GET /homework-results/homework/:homeworkId
  @Get('homework/:homeworkId')
  findByHomework(
    @Param('homeworkId', ParseUUIDPipe) homeworkId: string,
  ) {
    return this.homeworkResultService.findByHomework(homeworkId);
  }

  // GET /homework-results/student/:studentId
  @Get('student/:studentId')
  findByStudent(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.homeworkResultService.findByStudent(studentId);
  }

  // GET /homework-results/class/:classId
  @Get('class/:classId')
  findByClass(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.homeworkResultService.findByClass(classId);
  }

  // PATCH /homework-results/:id
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHomeworkResultDto,
  ) {
    return this.homeworkResultService.update(id, dto);
  }

  // DELETE /homework-results/:id  (soft delete)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.homeworkResultService.remove(id);
  }
}
