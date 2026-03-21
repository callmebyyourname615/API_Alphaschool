import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Branch } from './branch.entity';
import { Subject } from '../subjects/subject.entity';

import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

import * as fs from 'fs';

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
    const branch = this.branchRepo.create({
      branch_id: dto.branch_id,
      name: dto.name,
      address: dto.address,
      contact: dto.contact,
      phone: dto.phone,
      // don't assign subjects yet
    });

    if (file) {
      branch.profile_pic = `/uploads/branches/${file.filename}`;
    }

    // 🔥 Assign Subjects
    if (dto.subjects?.length) {
      const subjects = await this.subjectRepo.find({
        where: { id: In(dto.subjects) },
      });

      branch.subjects = subjects; // assign actual Subject entities
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
    const branch = await this.branchRepo.findOne({
      where: { id },
      relations: ['subjects'],
    });

    if (!branch) throw new NotFoundException('Branch not found');

    return branch;
  }

  async update(
    id: string,
    dto: UpdateBranchDto,
    file?: Express.Multer.File,
  ): Promise<Branch> {
    const branch = await this.findOne(id);

    Object.assign(branch, dto);

    // update subjects
    if (dto.subjects) {
      const subjects = await this.subjectRepo.find({
        where: { id: In(dto.subjects) },
      });

      branch.subjects = subjects;
    }

    // replace image
    if (file) {
      if (branch.profile_pic) {
        const oldPath = '.' + branch.profile_pic;

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
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
