import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Subject } from './subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { Curriculum } from '../curriculums/curriculum.entity';

@Injectable()
export class SubjectService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(Curriculum)
    private readonly curriculumRepo: Repository<Curriculum>,
  ) {}

  async create(dto: CreateSubjectDto): Promise<Subject> {
    const subject = this.subjectRepo.create(dto);
    return await this.subjectRepo.save(subject);
  }

  async findAll(): Promise<Subject[]> {
    return await this.subjectRepo.find({
      relations: ['curriculum', 'subjectType', 'class'],
      order: { create_dt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Subject> {
    const subject = await this.subjectRepo.findOne({
      where: { id },
      relations: ['curriculum', 'subjectType', 'class'],
    });

    if (!subject) {
      throw new NotFoundException(`Subject ${id} not found`);
    }

    return subject;
  }

  async update(id: string, dto: UpdateSubjectDto): Promise<Subject> {
    // โหลด entity พร้อม relation
    const subject = await this.subjectRepo.findOne({
      where: { id },
      relations: ['curriculum', 'subjectType', 'class'],
    });

    if (!subject) throw new Error(`Subject with ID ${id} not found`);

    // อัปเดต curriculum ถ้า dto มี
    if (dto.curriculum_id) {
      const curriculum = await this.curriculumRepo.findOne({
        where: { id: dto.curriculum_id },
      });
      if (!curriculum)
        throw new Error(`Curriculum with ID ${dto.curriculum_id} not found`);
      subject.curriculum = curriculum;
      subject.curriculum_id = curriculum.id;
    }

    // อัปเดต fields อื่น ๆ
    if (dto.subject_type_id) subject.subject_type_id = dto.subject_type_id;
    if (dto.class_id) subject.class_id = dto.class_id;
    if (dto.file_s !== undefined) subject.file_s = dto.file_s;
    if (dto.file_t !== undefined) subject.file_t = dto.file_t;
    if (dto.file_e !== undefined) subject.file_e = dto.file_e;

    // save
    await this.subjectRepo.save(subject);

    // reload entity พร้อม relations
    return await this.subjectRepo.findOneOrFail({
      where: { id },
      relations: ['curriculum', 'subjectType', 'class'],
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    const subject = await this.findOne(id);

    await this.subjectRepo.remove(subject);

    return { message: 'Subject deleted successfully' };
  }
}
