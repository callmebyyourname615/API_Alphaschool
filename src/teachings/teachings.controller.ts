// src/teachings/teachings.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { TeachingsService } from './teachings.service';
import { CreateTeachingDto } from './dto/create-teaching.dto';
import { UpdateTeachingDto } from './dto/update-teaching.dto';

@Controller('teaching')
export class TeachingsController {
  constructor(private readonly teachingsService: TeachingsService) {}

  @Post()
  async create(@Body() createTeachingDto: CreateTeachingDto) {
    return this.teachingsService.create(createTeachingDto);
  }

  @Get()
  async findAll() {
    return this.teachingsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.teachingsService.findOne(id);
  }

@Put(':id')
update(@Param('id') id: string, @Body() updateTeachingDto: UpdateTeachingDto) {
  return this.teachingsService.update(id, updateTeachingDto);
}
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.teachingsService.remove(id);
  }
}