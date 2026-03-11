import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { HomeworkService } from './homework.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';

@Controller('homework')
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Post()
  create(@Body() dto: CreateHomeworkDto) {
    return this.homeworkService.create(dto);
  }

  @Get()
  findAll() {
    return this.homeworkService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.homeworkService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHomeworkDto) {
    return this.homeworkService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.homeworkService.remove(id);
  }
}
