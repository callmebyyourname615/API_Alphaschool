import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluation } from './evaluation.entity';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { SubjectEvaluation } from '../subject_evaluations/subject-evaluation.entity';

@Injectable()
export class EvaluationService {
  constructor(
    @InjectRepository(Evaluation)
    private readonly evaluationRepo: Repository<Evaluation>,
    @InjectRepository(SubjectEvaluation)
    private readonly subjectEvaluationRepo: Repository<SubjectEvaluation>,
  ) {}

  async create(dto: CreateEvaluationDto): Promise<Evaluation> {
    let subjectEvaluation: SubjectEvaluation | null = null;

    if (dto.subjectEvaluationId) {
      subjectEvaluation = await this.subjectEvaluationRepo.findOne({
        where: { id: dto.subjectEvaluationId },
      });

      if (!subjectEvaluation) {
        throw new NotFoundException(
          `Subject evaluation ${dto.subjectEvaluationId} not found`,
        );
      }
    }

    const evaluation = this.evaluationRepo.create({
      admin: { id: dto.adminId } as Evaluation['admin'],
      student: { id: dto.studentId } as Evaluation['student'],
      subjectEvaluation: subjectEvaluation ?? undefined,
      score: dto.score,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return this.evaluationRepo.save(evaluation);
  }

  async findAll(): Promise<Evaluation[]> {
    return this.evaluationRepo.find({
      order: { created_at: 'DESC', id: 'DESC' },
    });
  }

  async findByStudent(studentId: string): Promise<Evaluation[]> {
    return this.evaluationRepo.find({
      where: {
        student: {
          id: studentId,
        },
      },
      order: { created_at: 'DESC', id: 'DESC' },
    });
  }

  async updateScore(id: number, score: number): Promise<Evaluation> {
    const evaluation = await this.evaluationRepo.findOne({
      where: { id },
    });

    if (!evaluation) {
      throw new NotFoundException(`Evaluation ${id} not found`);
    }

    evaluation.score = score;
    evaluation.updated_at = new Date();

    return this.evaluationRepo.save(evaluation);
  }

  async remove(id: number): Promise<{ message: string }> {
    const evaluation = await this.evaluationRepo.findOne({
      where: { id },
    });

    if (!evaluation) {
      throw new NotFoundException(`Evaluation ${id} not found`);
    }

    await this.evaluationRepo.remove(evaluation);

    return { message: `Evaluation ${id} deleted successfully` };
  }
}
