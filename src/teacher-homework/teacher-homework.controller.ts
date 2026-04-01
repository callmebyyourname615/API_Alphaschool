import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TeacherHomeworkService } from './teacher-homework.service';
import { CreateTeacherHomeworkDto } from './dto/create-teacher-homework.dto';
import { UpdateTeacherHomeworkDto } from './dto/update-teacher-homework.dto';
import { CreateTeacherHomeworkItemDto } from './dto/create-teacher-homework-item.dto';
import { UpdateTeacherHomeworkItemDto } from './dto/update-teacher-homework-item.dto';
import { TeacherHomeworkStatus } from './teacher-homework-status.enum';

@Controller('teacher-homework')
export class TeacherHomeworkController {
  constructor(
    private readonly teacherHomeworkService: TeacherHomeworkService,
  ) {}

  @Post()
  create(@Body() createDto: CreateTeacherHomeworkDto) {
    return this.teacherHomeworkService.create(createDto);
  }

  @Get()
  findAll(
    @Query('teachLearningId') teachLearningId?: string,
    @Query('status') status?: TeacherHomeworkStatus,
  ) {
    return this.teacherHomeworkService.findAll(teachLearningId, status);
  }

  @Post(':homeworkId/items')
  createItem(
    @Param('homeworkId', ParseUUIDPipe) homeworkId: string,
    @Body() createDto: CreateTeacherHomeworkItemDto,
  ) {
    return this.teacherHomeworkService.createItem(homeworkId, createDto);
  }

  @Get(':homeworkId/items')
  findItems(@Param('homeworkId', ParseUUIDPipe) homeworkId: string) {
    return this.teacherHomeworkService.findItems(homeworkId);
  }

  @Get('items/:itemId')
  findItem(@Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.teacherHomeworkService.findItem(itemId);
  }

  @Patch('items/:itemId')
  updateItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() updateDto: UpdateTeacherHomeworkItemDto,
  ) {
    return this.teacherHomeworkService.updateItem(itemId, updateDto);
  }

  @Delete('items/:itemId')
  removeItem(@Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.teacherHomeworkService.removeItem(itemId);
  }

  @Patch(':id/publish')
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.teacherHomeworkService.publish(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.teacherHomeworkService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTeacherHomeworkDto,
  ) {
    return this.teacherHomeworkService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.teacherHomeworkService.remove(id);
  }
}