import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { Subject } from './subject.entity';

@Controller('subjects')
export class SubjectsController {
  constructor(private readonly service: SubjectsService) {}

  @Post()
  create(@Body() dto: CreateSubjectDto): Promise<Subject> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<Subject[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Subject | null> {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubjectDto): Promise<Subject | null> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
