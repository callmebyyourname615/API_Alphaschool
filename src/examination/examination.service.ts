import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Examination } from './examination.entity';
import { CreateExaminationDto } from './dto/create-examination.dto';
import { UpdateExaminationDto } from './dto/update-examination.dto';
import { Student } from '../students/student.entity';
import { Subject } from '../subjects/subject.entity';
import { Branch } from '../branches/branch.entity';
import { Admin } from '../admins/admin.entity';

@Injectable()
export class ExaminationService {
  constructor(
    @InjectRepository(Examination)
    private readonly examRepo: Repository<Examination>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
  ) {}

  // CREATE
  async create(dto: CreateExaminationDto) {
    const branch = await this.branchRepo.findOne({
      where: { id: dto.branch_id },
    });
    const student = await this.studentRepo.findOne({
      where: { id: dto.student_id },
    });
    const subject = await this.subjectRepo.findOne({
      where: { id: String(dto.subject_id) },
    });

    const admin = dto.admin_id
      ? await this.adminRepo.findOne({ where: { id: dto.admin_id } })
      : null;

    if (!branch) throw new NotFoundException('Branch not found');
    if (!student) throw new NotFoundException('Student not found');
    if (!subject) throw new NotFoundException('Subject not found');

    const exam = this.examRepo.create({
      branch,
      academic_year: dto.academic_year,
      student,
      subject,
      admin: admin ?? undefined,
      score: dto.score,
      label: dto.label,
    });

    return this.examRepo.save(exam);
  }

  // GET ALL
  findAll() {
    return this.examRepo.find({
      relations: ['branch', 'student', 'subject', 'admin'],
    });
  }

  // GET BY ID
  async findOne(id: string) {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['branch', 'student', 'subject', 'admin'],
    });

    if (!exam) throw new NotFoundException('Examination not found');
    return exam;
  }

  // UPDATE
  async update(id: string, dto: UpdateExaminationDto) {
  const exam = await this.findOne(id);

  if (dto.branch_id) {
    const branch = await this.branchRepo.findOne({
      where: { id: dto.branch_id }, // branch = uuid ✔
    });
    if (!branch) throw new NotFoundException('Branch not found');
    exam.branch = branch;
  }

  if (dto.student_id) {
    const student = await this.studentRepo.findOne({
      where: { id: dto.student_id }, // student = uuid ✔
    });
    if (!student) throw new NotFoundException('Student not found');
    exam.student = student;
  }

  if (dto.subject_id) {
    const subject = await this.subjectRepo.findOne({
      where: { id: String(dto.subject_id) }, // 🔥 subject = number
    });
    if (!subject) throw new NotFoundException('Subject not found');
    exam.subject = subject;
  }

  if (dto.admin_id) {
    const admin = await this.adminRepo.findOne({
      where: { id: dto.admin_id }, // admin = uuid ✔
    });
    if (!admin) throw new NotFoundException('Admin not found');
    exam.admin = admin;
  }

  exam.academic_year = dto.academic_year ?? exam.academic_year;
  exam.score = dto.score ?? exam.score;
  exam.label = dto.label ?? exam.label;
  exam.updated_at = new Date();

  return this.examRepo.save(exam);
}


  // DELETE
  async remove(id: string) {
    const exam = await this.findOne(id);
    return this.examRepo.remove(exam);
  }
}
