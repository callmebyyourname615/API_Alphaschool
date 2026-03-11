// src/teachings/teachings.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTeachingDto } from './dto/create-teaching.dto';
import { UpdateTeachingDto } from './dto/update-teaching.dto';
import { Teaching } from './teaching.entity';

@Injectable()
export class TeachingsService {
  constructor(
    @InjectRepository(Teaching)
    private readonly teachingRepository: Repository<Teaching>,
  ) {}

async create(dto: CreateTeachingDto): Promise<Teaching> {
const teaching = this.teachingRepository.create({
  adminId:        dto.adminId,
  subjectId:      dto.subjectId,
  classId:        dto.classId,
  academicYearId: dto.academicYearId,
  branchId:       dto.branchId,
});

  try {
    return await this.teachingRepository.save(teaching);
  } catch (error) {
    if (error.code === '23505') {
      throw new BadRequestException('This teaching assignment already exists (duplicate combination)');
    }
    if (error.code === '23503') {
      throw new BadRequestException(
        'One of the referenced entities (teacher/subject/class/year/branch) does not exist'
      );
    }
    throw error;
  }
}

  async findAll(): Promise<Teaching[]> {
    return this.teachingRepository.find({
      relations: ['teacher', 'subject', 'class', 'academicYear', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Teaching> {
    const teaching = await this.teachingRepository.findOne({
      where: { id },
      relations: ['teacher', 'subject', 'class', 'academicYear', 'branch'],
    });

    if (!teaching) {
      throw new NotFoundException(`Teaching assignment with ID ${id} not found`);
    }

    return teaching;
  }

  async update(id: string, dto: UpdateTeachingDto): Promise<Teaching> {
    const teaching = await this.findOne(id);

    const updated = {
      teacher: dto.adminId ? { id: dto.adminId } : teaching.teacher,
      subject: dto.subjectId ? { id: dto.subjectId } : teaching.subject,
      class: dto.classId ? { id: dto.classId } : teaching.class,
      academicYear: dto.academicYearId ? { id: dto.academicYearId } : teaching.academicYear,
      branch: dto.branchId ? { id: dto.branchId } : teaching.branch,
    };

    Object.assign(teaching, updated);

    try {
      return await this.teachingRepository.save(teaching);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('This teaching assignment already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const teaching = await this.findOne(id);
    await this.teachingRepository.remove(teaching);
  }
}