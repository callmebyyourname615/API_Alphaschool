import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Examination } from './examination.entity';
import { Subject } from '../subjects/subject.entity';
import { CreateExaminationDto } from './dto/create-examination.dto';
import { UpdateExaminationDto } from './dto/update-examination.dto';
import * as fs from 'fs';

const RELATIONS = [
  'branch',
  'academicYear',
  'class',
  'subject',
  'subject.lessons',
  'subject.lessons.subjectType',
  'subject.lessons.yearLevel',
  'subject.lessons.curriculums',
];

@Injectable()
export class ExaminationService {
  constructor(
    @InjectRepository(Examination)
    private readonly examinationRepository: Repository<Examination>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  async create(
    dto: CreateExaminationDto,
    files: { exam_file?: Express.Multer.File[] },
  ): Promise<Examination> {
    const maxScore = dto.maxScore ?? 100;
    const passScore = dto.passScore ?? 50;

    if (passScore > maxScore) {
      throw new BadRequestException('pass_score cannot exceed max_score');
    }

    // Validate subject exists
    const subject = await this.subjectRepository.findOne({
      where: { id: dto.subjectId },
    });
    if (!subject) {
      throw new NotFoundException(`Subject ${dto.subjectId} not found`);
    }

    const examination = this.examinationRepository.create({
      ...dto,
      maxScore,
      passScore,
      examFile: files.exam_file?.[0]?.path ?? null,
    });

    const saved = await this.examinationRepository.save(examination);
    return this.findOne(saved.id);
  }

  async findAll(): Promise<Examination[]> {
    return this.examinationRepository.find({
      where: { isDeleted: false },
      relations: RELATIONS,
      order: { examDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Examination> {
    const examination = await this.examinationRepository.findOne({
      where: { id, isDeleted: false },
      relations: RELATIONS,
    });

    if (!examination) {
      throw new NotFoundException(`Examination with ID ${id} not found`);
    }

    return examination;
  }

  async findByClass(classId: string): Promise<Examination[]> {
    return this.examinationRepository.find({
      where: { classId, isDeleted: false },
      relations: RELATIONS,
      order: { examDate: 'ASC' },
    });
  }

  async findByAcademicYear(academicYearId: string): Promise<Examination[]> {
    return this.examinationRepository.find({
      where: { academicYearId, isDeleted: false },
      relations: RELATIONS,
      order: { examDate: 'ASC' },
    });
  }

  async update(
    id: string,
    dto: UpdateExaminationDto,
    files: { exam_file?: Express.Multer.File[] },
  ): Promise<Examination> {
    const examination = await this.findOne(id);

    const maxScore = dto.maxScore ?? Number(examination.maxScore);
    const passScore = dto.passScore ?? Number(examination.passScore);

    if (passScore > maxScore) {
      throw new BadRequestException('pass_score cannot exceed max_score');
    }

    // Validate subject if changed
    if (dto.subjectId && dto.subjectId !== examination.subjectId) {
      const subject = await this.subjectRepository.findOne({
        where: { id: dto.subjectId },
      });
      if (!subject) {
        throw new NotFoundException(`Subject ${dto.subjectId} not found`);
      }
    }

    // Replace old file if new one uploaded
    if (files.exam_file?.[0]) {
      if (examination.examFile && fs.existsSync(examination.examFile)) {
        fs.unlinkSync(examination.examFile);
      }
      examination.examFile = files.exam_file[0].path;
    }

    Object.assign(examination, dto);
    await this.examinationRepository.save(examination);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const examination = await this.findOne(id);
    examination.isDeleted = true;
    await this.examinationRepository.save(examination);
    return { message: `Examination #${id} deleted successfully` };
  }
}