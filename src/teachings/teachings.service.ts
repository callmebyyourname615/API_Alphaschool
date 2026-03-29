import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teaching } from './teaching.entity';
import { CreateTeachingDto } from './dto/create-teaching.dto';
import { UpdateTeachingDto } from './dto/update-teaching.dto';

@Injectable()
export class TeachingService {
  constructor(
    @InjectRepository(Teaching)
    private readonly teachingRepo: Repository<Teaching>,
  ) {}

  // Create - Assign teacher to subject
  async create(createDto: CreateTeachingDto): Promise<Teaching> {
    const existing = await this.teachingRepo.findOne({
      where: {
        adminId: createDto.adminId,
        subjectId: createDto.subjectId,
        academicYearId: createDto.academicYearId,
        branchId: createDto.branchId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'This teacher is already assigned to this subject in the same academic year and branch',
      );
    }

    const teaching = this.teachingRepo.create(createDto);
    return await this.teachingRepo.save(teaching);
  }

  // Get all teachings with optional filters
 async findAll(branchId?: string, academicYearId?: string) {
  const query = this.teachingRepo
    .createQueryBuilder('teaching')
    .leftJoinAndSelect('teaching.teacher', 'teacher')
    .leftJoinAndSelect('teaching.subject', 'subject')
    .leftJoinAndSelect('teaching.academicYear', 'academicYear')
    .leftJoinAndSelect('teaching.branch', 'branch')
    .leftJoinAndSelect('subject.subjectType', 'subjectType')
    .leftJoinAndSelect('subject.class', 'class'); // ← add this

  if (branchId) {
    query.andWhere('teaching.branchId = :branchId', { branchId });
  }
  if (academicYearId) {
    query.andWhere('teaching.academicYearId = :academicYearId', { academicYearId });
  }

  return query.orderBy('teaching.createdAt', 'DESC').getMany();
}

async findOne(id: string): Promise<Teaching> {
  const teaching = await this.teachingRepo.findOne({
    where: { id },
    relations: [
      'teacher',
      'subject',
      'subject.subjectType',
      'subject.class',      // ← add this
      'academicYear',
      'branch',
    ],
  });

  if (!teaching) {
    throw new NotFoundException(`Teaching assignment with ID ${id} not found`);
  }

  return teaching;
}

  // Update
  async update(id: string, updateDto: UpdateTeachingDto): Promise<Teaching> {
    const teaching = await this.findOne(id);
    Object.assign(teaching, updateDto);
    return await this.teachingRepo.save(teaching);
  }

  // Hard delete for now — add is_deleted column to entity for soft delete later
  async remove(id: string): Promise<{ message: string }> {
    const teaching = await this.findOne(id);
    await this.teachingRepo.remove(teaching);
    return { message: 'Teaching assignment deleted successfully' };
  }
}