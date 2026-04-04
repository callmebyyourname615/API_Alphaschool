import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluation } from './evaluation.entity';
import { Student } from '../students/student.entity';
import { Admin } from '../admins/admin.entity';
import { SubjectEvaluation } from '../subject_evaluations/subject-evaluation.entity';

export interface CreateEvaluationDto {
  studentId: string;
  adminId: string;
  subjectEvaluationId: string;
  score: number;
}

@Injectable()
export class EvaluationService {
  constructor(
    @InjectRepository(Evaluation)
    private readonly evaluationRepo: Repository<Evaluation>,

    @InjectRepository(SubjectEvaluation)
    private readonly subjectEvaluationRepo: Repository<SubjectEvaluation>,
  ) {}

  async create(dto: CreateEvaluationDto): Promise<Evaluation> {
    const subjectEval = await this.subjectEvaluationRepo.findOne({
      where: { id: dto.subjectEvaluationId },
      relations: ['subject'], // class info might come from subjectEval if you have relation
    });

    if (!subjectEval) {
      throw new BadRequestException('subjectEvaluationId not found');
    }

    if (dto.score === null || dto.score === undefined) {
      throw new BadRequestException('score is required');
    }

    const evaluation = this.evaluationRepo.create({
      student: { id: dto.studentId } as Student,
      admin: { id: dto.adminId } as Admin,
      subject: subjectEval.subject,
      score: dto.score,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return this.evaluationRepo.save(evaluation);
  }

  async findAll(): Promise<Evaluation[]> {
    return this.evaluationRepo.find({
      relations: ['student', 'admin', 'subject'],
      order: { created_at: 'DESC' },
    });
  }

  async findByStudent(studentId: string): Promise<Evaluation[]> {
    return this.evaluationRepo.find({
      where: { student: { id: studentId } },
      relations: ['student', 'admin', 'subject'],
      order: { created_at: 'DESC' },
    });
  }

  async updateScore(id: number, score: number): Promise<Evaluation> {
    const evalEntity = await this.evaluationRepo.findOne({ where: { id } });
    if (!evalEntity) {
      throw new NotFoundException(`Evaluation with ID ${id} not found`);
    }

    evalEntity.score = score;
    evalEntity.updated_at = new Date();

    return this.evaluationRepo.save(evalEntity);
  }

  async remove(id: number): Promise<{ message: string }> {
    const evalEntity = await this.evaluationRepo.findOne({ where: { id } });
    if (!evalEntity) {
      throw new NotFoundException(`Evaluation with ID ${id} not found`);
    }

    await this.evaluationRepo.remove(evalEntity);
    return { message: 'Evaluation deleted successfully' };
  }
}