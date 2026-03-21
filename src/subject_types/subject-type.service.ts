import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSubjectTypeDto } from './dto/create-subject-type.dto';
import { UpdateSubjectTypeDto } from './dto/update-subject-type.dto';
import { SubjectType } from './subject-type.entity';

@Injectable()
export class SubjectTypeService {

  constructor(
    @InjectRepository(SubjectType)
    private subjectTypeRepo: Repository<SubjectType>,
  ) {}

  async create(createDto: CreateSubjectTypeDto): Promise<SubjectType> {
    const subject = this.subjectTypeRepo.create(createDto);
    return await this.subjectTypeRepo.save(subject);
  }

  async findAll(): Promise<SubjectType[]> {
    return await this.subjectTypeRepo.find({
      order: { id: 'DESC' }
    });
  }

  async findOne(id: number): Promise<SubjectType> {
    const subject = await this.subjectTypeRepo.findOne({ where: { id } });

    if (!subject) {
      throw new NotFoundException(`SubjectType ID ${id} not found`);
    }

    return subject;
  }

  async update(id: number, updateDto: UpdateSubjectTypeDto): Promise<SubjectType> {
    const subject = await this.findOne(id);

    Object.assign(subject, updateDto);

    return await this.subjectTypeRepo.save(subject);
  }

  async remove(id: number): Promise<{ message: string }> {
    const subject = await this.findOne(id);

    await this.subjectTypeRepo.remove(subject);

    return { message: 'Deleted successfully' };
  }

}