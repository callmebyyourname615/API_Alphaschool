import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluation } from './evaluation.entity';
import { Subject } from '../subjects/subject.entity';
import { Class } from '../classes/class.entity';
import { Student } from '../students/student.entity';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { Admin } from '../admins/admin.entity';

@Injectable()
export class EvaluationService {
  constructor(
    @InjectRepository(Evaluation)
    private readonly evaluationRepo: Repository<Evaluation>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async createEvaluation(dto: CreateEvaluationDto) {
  const subject = await this.subjectRepo.findOne({
    where: { id: String(dto.subject_id) },
  });

  const admin = await this.adminRepo.findOne({
    where: { id: String(dto.admin_id) },
  });

  const classEntity = await this.classRepo.findOne({
    where: { id: String(dto.class_id) },
  });

  const student = await this.studentRepo.findOne({
    where: { id: String(dto.student_id) },
  });

  if (!subject || !admin || !classEntity || !student) {
    throw new NotFoundException('Related entity not found');
  }

  const evaluation = this.evaluationRepo.create({
    subject,
    admin,
    class: classEntity,
    student,
    score: dto.score,
    created_at: dto.created_at ?? new Date(),
    updated_at: dto.updated_at ?? new Date(),
  });

  return this.evaluationRepo.save(evaluation);
}

  async getAllEvaluations() {
    return this.evaluationRepo.find({
      relations: ['subject', 'lesson', 'lesson_info', 'admin', 'class', 'student'],
    });
  }

  async getEvaluationById(id: number) {
    const evaluation = await this.evaluationRepo.findOne({
      where: { id },
      relations: ['subject', 'lesson', 'lesson_info', 'admin', 'class', 'student'],
    });
    if (!evaluation) throw new NotFoundException('Evaluation not found');
    return evaluation;
  }

  async updateEvaluation(id: number, dto: UpdateEvaluationDto) {
  const evaluation = await this.getEvaluationById(id);

  if (dto.subject_id) {
    const subject = await this.subjectRepo.findOne({
      where: { id: String(dto.subject_id) },
    });
    if (!subject) throw new NotFoundException(`Subject with id ${dto.subject_id} not found`);
    evaluation.subject = subject;
  }

  if (dto.admin_id) {
    const admin = await this.adminRepo.findOne({
      where: { id: String(dto.admin_id) },
    });
    if (!admin) throw new NotFoundException(`Admin with id ${dto.admin_id} not found`);
    evaluation.admin = admin;
  }

  if (dto.class_id) {
    const classEntity = await this.classRepo.findOne({
      where: { id: String(dto.class_id) },
    });
    if (!classEntity) throw new NotFoundException(`Class with id ${dto.class_id} not found`);
    evaluation.class = classEntity;
  }

  if (dto.student_id) {
    const student = await this.studentRepo.findOne({
      where: { id: String(dto.student_id) },
    });
    if (!student) throw new NotFoundException(`Student with id ${dto.student_id} not found`);
    evaluation.student = student;
  }

  if (dto.score !== undefined) evaluation.score = dto.score;

  evaluation.updated_at = new Date();

  return this.evaluationRepo.save(evaluation);
}

  async deleteEvaluation(id: number) {
    const evaluation = await this.getEvaluationById(id);
    return this.evaluationRepo.remove(evaluation);
  }
}
