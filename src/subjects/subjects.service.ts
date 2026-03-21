import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Subject } from './subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectService {

  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
  ) {}

  async create(dto: CreateSubjectDto): Promise<Subject> {
    const subject = this.subjectRepo.create(dto);
    return await this.subjectRepo.save(subject);
  }

  async findAll(): Promise<Subject[]> {
    return await this.subjectRepo.find({
      relations: [
        'curriculum',
        'subjectType',
        'class'
      ],
      order: { create_dt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Subject> {
    const subject = await this.subjectRepo.findOne({
      where: { id },
      relations: [
        'curriculum',
        'subjectType',
        'class'
      ],
    });

    if (!subject) {
      throw new NotFoundException(`Subject ${id} not found`);
    }

    return subject;
  }

  async update(id: string, dto: UpdateSubjectDto): Promise<Subject> {
    const subject = await this.findOne(id);

    Object.assign(subject, dto);

    return await this.subjectRepo.save(subject);
  }

  async remove(id: string): Promise<{ message: string }> {
    const subject = await this.findOne(id);

    await this.subjectRepo.remove(subject);

    return { message: 'Subject deleted successfully' };
  }
}