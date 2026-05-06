import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async create(dto: CreateParentDto): Promise<Parent> {
    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

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
      family_book_url: dto.family_book_url ?? null,
      phone: dto.phone,
      mobile_phone: dto.mobile_phone,
      village: dto.village,
      district: dto.district,
      province: dto.province,
      home_address: dto.home_address,
      work_province: dto.work_province,
      work_district: dto.work_district,
      work_village: dto.work_village,
      occupation: dto.occupation,
      company_name: dto.company_name,
      profilePictureUrl: dto.profile_pic,
      idCardUrl: dto.id_card,
      home_picture_url: dto.home_picture_url, // ✅
      isActive: dto.is_active ?? true,
    });

    return this.parentRepository.save(parent);
  }

  async update(id: string, dto: UpdateParentDto): Promise<Parent> {
    const parent = await this.parentRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['roles'],
    });

    if (!parent) {
      throw new NotFoundException(`Parent with ID ${id} not found`);
    }

    if (dto.password) {
      parent.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.first_name !== undefined) parent.firstName = dto.first_name;
    if (dto.last_name !== undefined) parent.lastName = dto.last_name;
    if (dto.dob !== undefined) parent.dateOfBirth = dto.dob;
    if (dto.gender !== undefined) parent.gender = dto.gender;
    if (dto.nationality !== undefined) parent.nationality = dto.nationality;
    if (dto.ethnicity !== undefined) parent.ethnicity = dto.ethnicity;
    if (dto.religion !== undefined) parent.religion = dto.religion;
    if (dto.phone !== undefined) parent.phone = dto.phone;
    if (dto.mobile_phone !== undefined) parent.mobile_phone = dto.mobile_phone;
    if (dto.village !== undefined) parent.village = dto.village;
    if (dto.district !== undefined) parent.district = dto.district;
    if (dto.province !== undefined) parent.province = dto.province;
    if (dto.home_address !== undefined) parent.home_address = dto.home_address;
    if (dto.work_province !== undefined) parent.work_province = dto.work_province;
    if (dto.work_district !== undefined) parent.work_district = dto.work_district;
    if (dto.work_village !== undefined) parent.work_village = dto.work_village;
    if (dto.occupation !== undefined) parent.occupation = dto.occupation;
    if (dto.company_name !== undefined) parent.company_name = dto.company_name;
    if (dto.email !== undefined) parent.email = dto.email;
    if (dto.username !== undefined) parent.username = dto.username;
    if (dto.profile_pic !== undefined) parent.profilePictureUrl = dto.profile_pic;
    if (dto.id_card !== undefined) parent.idCardUrl = dto.id_card;
    if (dto.home_picture_url !== undefined) parent.home_picture_url = dto.home_picture_url; // ✅
    if (dto.family_book_url !== undefined) parent.family_book_url = dto.family_book_url; // ✅
    if (dto.is_active !== undefined) parent.isActive = dto.is_active;

    return this.parentRepository.save(parent);
  }

  async findAll(): Promise<Parent[]> {
    return this.parentRepository.find({
      where: { isDeleted: false },
      relations: ['roles'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Parent> {
    const parent = await this.parentRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['roles'],
    });

    if (!parent) {
      throw new NotFoundException(`Parent with ID ${id} not found`);
    }

    return parent;
  }

  async softDelete(id: string): Promise<{ message: string }> {
    const parent = await this.findOne(id);
    parent.isDeleted = true;
    parent.isActive = false;
    await this.parentRepository.save(parent);
    return { message: 'Parent soft deleted successfully' };
  }
}