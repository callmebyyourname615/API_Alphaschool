import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Branch } from './branch.entity';
import { Subject } from '../subjects/subject.entity';

import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

import * as fs from 'fs';
import { AcademicYear } from '../academic_years/academic-year.entity';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,

    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
  ) {}

  async create(
    dto: CreateBranchDto,
    file?: Express.Multer.File,
  ): Promise<Branch> {
    // ✅ parse subjects (กันพังจาก FormData)
    let subjectIds: string[] = [];

    if (dto.subjects) {
      if (typeof dto.subjects === 'string') {
        const parsed = JSON.parse(dto.subjects);

        if (Array.isArray(parsed)) {
          if (typeof parsed[0] === 'object') {
            subjectIds = parsed.map((s: any) => s.id);
          } else {
            subjectIds = parsed;
          }
        }
      } else if (Array.isArray(dto.subjects)) {
        if (typeof dto.subjects[0] === 'object') {
          subjectIds = dto.subjects.map((s: any) => s.id); // ✅ FIX
        } else {
          subjectIds = dto.subjects;
        }
      }
    }

    // ✅ create branch
    const branch = this.branchRepo.create({
      branch_id: dto.branch_id,
      name: dto.name,
      address:
        typeof dto.address === 'string' ? JSON.parse(dto.address) : dto.address,
      contact: dto.contact,
      phone: dto.phone,
    });

    // ✅ image
    if (file) {
      branch.profile_pic = `/uploads/branches/${file.filename}`;
    }

    // ✅ assign subjects
    if (subjectIds.length > 0) {
      const subjects = await this.subjectRepo.find({
        where: { id: In(subjectIds) },
      });

      branch.subjects = subjects;
    }

    return this.branchRepo.save(branch);
  }

  async findAll(): Promise<Branch[]> {
    return this.branchRepo.find({
      where: { is_deleted: false },
      relations: ['subjects'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepo
      .createQueryBuilder('branch')
      .leftJoinAndSelect('branch.subjects', 'subject')
      .leftJoinAndMapOne(
        'branch.academic_year',
        AcademicYear,
        'academic_year',
        'academic_year.branch_id = branch.id AND academic_year.is_active = true AND academic_year.is_deleted = false',
      )
      .where('branch.id = :id', { id })
      .getOne();

    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async update(
    id: string,
    dto: UpdateBranchDto,
    file?: Express.Multer.File,
  ): Promise<Branch> {
    const branch = await this.findOne(id);

    // ✅ Only assign safe fields, not subjects or address directly
    if (dto.branch_id) branch.branch_id = dto.branch_id;
    if (dto.name) branch.name = dto.name;
    if (dto.contact) branch.contact = dto.contact;
    if (dto.phone) branch.phone = dto.phone;

    // ✅ Parse address if it came as string from FormData
    if (dto.address) {
      branch.address =
        typeof dto.address === 'string' ? JSON.parse(dto.address) : dto.address;
    }

    // ✅ Parse subjects — handles both string (FormData) and array
    if (dto.subjects) {
      let subjectIds: string[] = [];

      const raw =
        typeof dto.subjects === 'string'
          ? JSON.parse(dto.subjects)
          : dto.subjects;

      if (Array.isArray(raw)) {
        subjectIds = raw.map((s: string | { id: string }) => {
          if (typeof s === 'string') return s;
          if (typeof s === 'object' && s.id) return s.id;
          throw new Error('Invalid subject format');
        });
      }

      if (subjectIds.length > 0) {
        const subjects = await this.subjectRepo.find({
          where: { id: In(subjectIds) },
        });
        branch.subjects = subjects;
      }
    }

    // ✅ Replace profile image
    if (file) {
      if (branch.profile_pic) {
        const oldPath = '.' + branch.profile_pic;
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      branch.profile_pic = `/uploads/branches/${file.filename}`;
    }

    return await this.branchRepo.save(branch);
  }
  async remove(id: string): Promise<{ message: string }> {
    const result = await this.branchRepo.update(
      { id, is_deleted: false },
      { is_deleted: true },
    );

    if (result.affected === 0) {
      throw new NotFoundException('Branch not found or already deleted');
    }

    return { message: 'Branch deleted successfully' };
  }
}
