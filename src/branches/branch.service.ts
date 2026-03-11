import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchResponseDto } from './dto/branch-response.dto';
import * as fs from 'fs';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
  ) {}

  async create(
    dto: CreateBranchDto,
    file?: Express.Multer.File,
  ): Promise<BranchResponseDto> {
    const branch = this.branchRepo.create(dto);

    if (file) {
      branch.profile_pic = `/uploads/branches/${file.filename}`;
    }

    const saved = await this.branchRepo.save(branch);

    // return as DTO
    return saved;
  }

  async findAll(): Promise<Branch[]> {
    return this.branchRepo.find({
      where: { is_deleted: false },
      order: { created_at: 'DESC' },
    });
  }

  // branches.service.ts
async findOne(id: string): Promise<Branch> {
  const branch = await this.branchRepo.findOne({ where: { id } });
  if (!branch) throw new NotFoundException('Branch not found');
  return branch;
}


async update(
    id: string,
    dto: UpdateBranchDto,
    file?: Express.Multer.File,
  ): Promise<BranchResponseDto> {
    const branch = await this.branchRepo.findOne({ where: { id } });
    if (!branch) throw new NotFoundException('Branch not found');

    Object.assign(branch, dto);

    // ลบรูปเก่า ถ้ามีรูปใหม่
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
    { id, is_deleted: false }, // only active rows
    { is_deleted: true }
  );

  if (result.affected === 0) {
    throw new NotFoundException('Branch not found or already deleted');
  }

  return { message: 'Branch deleted successfully' };
}

}
