import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Parent } from './parent.entity';
import * as bcrypt from 'bcrypt';
import { CreateParentDto } from './dto/CreateParentDto';
import { UpdateParentDto } from './dto/UpdateParentDto';

@Injectable()
export class ParentService {
  constructor(
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
  ) {}

  async create(
    dto: CreateParentDto,
    files: Express.Multer.File[] = [],
  ): Promise<Parent> {
    let passwordHash: string | undefined;

    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    // Spread everything EXCEPT password
    const { password, ...rest } = dto;

    const parent = this.parentRepository.create({
      ...rest,
      passwordHash, // explicitly set the correct field
    });

    this.assignFilesToParent(parent, files);

    return this.parentRepository.save(parent);
  }

  async update(
    id: string,
    dto: UpdateParentDto,
    files: Express.Multer.File[] = [],
  ): Promise<Parent> {
    const parent = await this.parentRepository.findOne({
      where: { id },
      relations: ['roles'], // optional – load if you need roles in response
    });

    if (!parent) {
      throw new NotFoundException(`Parent with ID ${id} not found`);
    }

    // If password is being updated → hash it
    if (dto.password) {
      parent.passwordHash = await bcrypt.hash(dto.password, 10);
      // do NOT set dto.password on entity
    }

    // Update other fields (exclude password from assign)
    const { password, ...rest } = dto;
    Object.assign(parent, rest);

    // Handle new file uploads (overwrite existing)
    this.assignFilesToParent(parent, files);

    return this.parentRepository.save(parent);
  }

  async findAll(): Promise<Parent[]> {
    return this.parentRepository.find({
      where: { isDeleted: false } as FindOptionsWhere<Parent>,
      relations: ['roles'], // ← usually wanted in list
      select: {
        passwordHash: false, // never return password hash
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Parent> {
    const parent = await this.parentRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['roles'],
      select: {
        passwordHash: false,
      },
    });

    if (!parent) {
      throw new NotFoundException(`Parent with ID ${id} not found`);
    }

    return parent;
  }

  async softDelete(id: string): Promise<{ message: string }> {
    const parent = await this.findOne(id); // will throw if not found or deleted

    parent.isDeleted = true;
    parent.isActive = false; // optional – good practice

    await this.parentRepository.save(parent);

    return { message: 'Parent soft deleted successfully' };
  }

  // ────────────────────────────────────────────────
  // Helper: map multer files to correct entity fields
  // ────────────────────────────────────────────────
  private assignFilesToParent(parent: Parent, files: Express.Multer.File[]) {
    for (const file of files) {
      if (file.fieldname === 'profilePicture') {
        parent.profilePictureUrl = file.path; // or `/uploads/${file.filename}`
      }
      if (file.fieldname === 'idCard') {
        parent.idCardUrl = file.path;
      }
    }
  }
}
