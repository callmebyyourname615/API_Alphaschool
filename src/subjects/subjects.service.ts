import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly repo: Repository<Subject>,
  ) {}

  async create(dto: CreateSubjectDto): Promise<Subject> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async findAll(): Promise<Subject[]> {
    return this.repo.find({ relations: ['branch'] });
  }

  async findOne(id: string): Promise<Subject | null> {
    return this.repo.findOne({ where: { id }, relations: ['branch'] });
  }

  async update(id: string, dto: UpdateSubjectDto): Promise<Subject | null> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
