import { Controller, Post, Get, Param, Put, Delete, Body } from '@nestjs/common';
import { SubjectEvaluationService } from './subject-evaluation.service';
import { CreateSubjectEvaluationDto } from './dto/create-subject-evaluation.dto';
import { UpdateSubjectEvaluationDto } from './dto/update-subject-evaluation.dto';
import { SubjectEvaluation } from './subject-evaluation.entity';

@Controller('subject-evaluations')
export class SubjectEvaluationController {
  constructor(private readonly evalService: SubjectEvaluationService) {}

  // Create
  @Post()
  create(@Body() dto: CreateSubjectEvaluationDto): Promise<SubjectEvaluation> {
    return this.evalService.create(dto);
  }

  // Read all
  @Get()
  findAll(): Promise<SubjectEvaluation[]> {
    return this.evalService.findAll();
  }

  // Read one
  @Get(':id')
  findOne(@Param('id') id: string): Promise<SubjectEvaluation> {
    return this.evalService.findOne(id);
  }

  // Update
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSubjectEvaluationDto,
  ): Promise<SubjectEvaluation> {
    return this.evalService.update(id, dto);
  }

  // Delete
  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.evalService.remove(id);
  }

  // Filter by subject name (optional)
  @Get('subject/:name')
  findBySubjectName(@Param('name') name: string): Promise<SubjectEvaluation[]> {
    return this.evalService.findBySubjectName(name);
  }
}