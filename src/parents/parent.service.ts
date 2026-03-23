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
// Service updated with field mapping

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

    // Map DTO snake_case fields to entity camelCase fields
    const parent = this.parentRepository.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
      firstName: dto.first_name,
      lastName: dto.last_name,
      dateOfBirth: dto.dob,
      gender: dto.gender,
      nationality: dto.nationality,
      ethnicity: dto.ethnicity,
      religion: dto.religion,
      phone: dto.phone,
      village: dto.village,
      district: dto.district,
      province: dto.province,
      address: dto.address,
      occupation: dto.occupation,
      workplace: dto.working_place,
      profilePictureUrl: dto.profile_pic,
      idCardUrl: dto.id_card,
      isActive: dto.is_active !== undefined ? dto.is_active : true,
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
    }

    // Map DTO snake_case fields to entity camelCase fields
    if (dto.first_name !== undefined) parent.firstName = dto.first_name;
    if (dto.last_name !== undefined) parent.lastName = dto.last_name;
    if (dto.dob !== undefined) parent.dateOfBirth = dto.dob;
    if (dto.gender !== undefined) parent.gender = dto.gender;
    if (dto.nationality !== undefined) parent.nationality = dto.nationality;
    if (dto.ethnicity !== undefined) parent.ethnicity = dto.ethnicity;
    if (dto.religion !== undefined) parent.religion = dto.religion;
    if (dto.phone !== undefined) parent.phone = dto.phone;
    if (dto.village !== undefined) parent.village = dto.village;
    if (dto.district !== undefined) parent.district = dto.district;
    if (dto.province !== undefined) parent.province = dto.province;
    if (dto.address !== undefined) parent.address = dto.address;
    if (dto.occupation !== undefined) parent.occupation = dto.occupation;
    if (dto.working_place !== undefined) parent.workplace = dto.working_place;
    if (dto.email !== undefined) parent.email = dto.email;
    if (dto.username !== undefined) parent.username = dto.username;
    if (dto.profile_pic !== undefined) parent.profilePictureUrl = dto.profile_pic;
    if (dto.id_card !== undefined) parent.idCardUrl = dto.id_card;
    if (dto.is_active !== undefined) parent.isActive = dto.is_active;

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
      if (file.fieldname === 'profile_pic') {
        parent.profilePictureUrl = file.path;
      }
      if (file.fieldname === 'id_card') {
        parent.idCardUrl = file.path;
      }
    }
  }
}
