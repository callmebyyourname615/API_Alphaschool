import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SubjectEvaluation } from './subject-evaluation.entity';
import { Subject } from '../subjects/subject.entity';
import { CreateSubjectEvaluationDto } from './dto/create-subject-evaluation.dto';
import { UpdateSubjectEvaluationDto } from './dto/update-subject-evaluation.dto';

@Injectable()
export class SubjectEvaluationService {
  constructor(
    @InjectRepository(SubjectEvaluation)
    private readonly evalRepo: Repository<SubjectEvaluation>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
  ) {}

  // Create
  async create(dto: CreateSubjectEvaluationDto): Promise<SubjectEvaluation> {
    const subject = await this.subjectRepo.findOne({
      where: { id: dto.subject_id },
      relations: ['subjectType', 'curriculum', 'class'],
    });
    if (!subject) throw new NotFoundException(`Subject ${dto.subject_id} not found`);

    const evalEntity = this.evalRepo.create({
      subject,
      topic: dto.topic,
      description: dto.description,
      contents: dto.contents,
    });

    return this.evalRepo.save(evalEntity);
  }

  // Read all
  async findAll(): Promise<SubjectEvaluation[]> {
    return this.evalRepo.find({
      relations: ['subject', 'subject.subjectType', 'subject.curriculum', 'subject.class'],
    });
  }

  // Read one
  async findOne(id: string): Promise<SubjectEvaluation> {
    const evalEntity = await this.evalRepo.findOne({
      where: { id },
      relations: ['subject', 'subject.subjectType', 'subject.curriculum', 'subject.class'],
    });
    if (!evalEntity) throw new NotFoundException(`Evaluation ${id} not found`);
    return evalEntity;
  }

  // Update
  async update(id: string, dto: UpdateSubjectEvaluationDto): Promise<SubjectEvaluation> {
    const evalEntity = await this.evalRepo.findOne({ where: { id }, relations: ['subject'] });
    if (!evalEntity) throw new NotFoundException(`Evaluation ${id} not found`);

    if (dto.subject_id) {
      const subject = await this.subjectRepo.findOne({
        where: { id: dto.subject_id },
        relations: ['subjectType', 'curriculum', 'class'],
      });
      if (!subject) throw new NotFoundException(`Subject ${dto.subject_id} not found`);
      evalEntity.subject = subject;
    }

    evalEntity.topic = dto.topic ?? evalEntity.topic;
    evalEntity.description = dto.description ?? evalEntity.description;
    evalEntity.contents = dto.contents ?? evalEntity.contents;

    return this.evalRepo.save(evalEntity);
  }

  // Delete
  async remove(id: string): Promise<void> {
    const result = await this.evalRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Evaluation ${id} not found`);
  }

  // Filter by subject name
  async findBySubjectName(name: string): Promise<SubjectEvaluation[]> {
    return this.evalRepo
      .createQueryBuilder('evaluation')
      .leftJoinAndSelect('evaluation.subject', 'subject')
      .leftJoinAndSelect('subject.subjectType', 'subjectType')
      .leftJoinAndSelect('subject.curriculum', 'curriculum')
      .leftJoinAndSelect('subject.class', 'class')
      .where('subjectType.name = :name', { name })
      .getMany();
  }
}