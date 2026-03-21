import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { Admin } from './admin.entity';
import { Role } from '../roles/role.entity';
import { Branch } from '../branches/branch.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

export interface UploadedFile extends Express.Multer.File {}

export class AdminResponseDto {
  id: string;
  username: string;
  email: string;

  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  gender?: string | null;
  notes?: string | null;
  village?: string | null;
  district?: string | null;
  province?: string | null;
  current_academic_year?: string | null;

  join_date?: string | null;
  dob?: string | null;

  is_active: boolean;
  profile_pic?: string | null;
  created_at: string;
  updated_at: string;

  roles: { id: string; name: string; level: number }[];
  branch?: { id: string; name: string | null } | null;
}

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  // ───────────── CREATE ─────────────
  async create(dto: CreateAdminDto, file?: UploadedFile): Promise<AdminResponseDto> {
    // Required fields
    if (!dto.username || !dto.email || !dto.password) {
      throw new BadRequestException('username, email, and password are required');
    }

    dto.email = dto.email.trim().toLowerCase();

    // Check duplicates
    const existing = await this.adminRepository.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });
    if (existing) {
      throw new ConflictException(
        existing.username === dto.username ? 'Username already exists' : 'Email already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const admin = this.adminRepository.create({
      username: dto.username,
      password: hashedPassword,
      email: dto.email,
      first_name: dto.first_name ?? null,
      last_name: dto.last_name ?? null,
      phone: dto.phone ?? null,
      gender: dto.gender ?? null,
      notes: dto.notes ?? null,
      village: dto.village ?? null,
      district: dto.district ?? null,
      province: dto.province ?? null,
      current_academic_year: dto.current_academic_year ?? null,
      join_date: dto.join_date ? new Date(dto.join_date) : null,
      dob: dto.dob ? new Date(dto.dob) : null,
      is_active: dto.is_active ?? true,
      is_deleted: false,
      profile_pic: file ? `uploads/admin/${file.filename}` : null,
    });

    // Assign roles
    if (dto.role_ids?.length) {
      const roles = await this.roleRepository.findBy({ id: In(dto.role_ids) });
      if (roles.length !== dto.role_ids.length) {
        throw new BadRequestException('Invalid role IDs');
      }
      admin.roles = roles;
    }

    // Assign branch
    //if (dto.branch_id) {
   //   const branch = await this.branchRepository.findOneBy({ id: dto.branch_id });
   //   if (!branch) throw new BadRequestException('Invalid branch ID');
   //   admin.branch = branch;
   // }

    const saved = await this.adminRepository.save(admin);
    return this.toResponseDto(saved);
  }

  // ───────────── FIND ALL ─────────────
  async findAll(): Promise<AdminResponseDto[]> {
    const admins = await this.adminRepository.find({
      where: { is_deleted: false },
      relations: ['roles', 'branch'],
      order: { created_at: 'DESC' },
    });
    return admins.map((a) => this.toResponseDto(a));
  }

  // ───────────── FIND ONE ─────────────
  async findOne(id: string): Promise<AdminResponseDto> {
    const admin = await this.adminRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['roles', 'branch'],
    });
    if (!admin) throw new NotFoundException(`Admin ${id} not found`);
    return this.toResponseDto(admin);
  }

  // ───────────── UPDATE ─────────────
  async update(id: string, dto: UpdateAdminDto, file?: UploadedFile): Promise<AdminResponseDto> {
    const admin = await this.adminRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['roles', 'branch'],
    });
    if (!admin) throw new NotFoundException(`Admin ${id} not found`);

    // Username/email conflict check
    if (dto.username || dto.email) {
      const conflict = await this.adminRepository.findOne({
        where: [
          dto.username ? { username: dto.username } : {},
          dto.email ? { email: dto.email } : {},
        ],
      });
      if (conflict && conflict.id !== id) {
        throw new ConflictException(conflict.username === dto.username ? 'Username taken' : 'Email taken');
      }
    }

    if (file) admin.profile_pic = `uploads/admin/${file.filename}`;

    // Update roles
    if (dto.role_ids !== undefined) {
      if (dto.role_ids.length === 0) admin.roles = [];
      else {
        const roles = await this.roleRepository.findBy({ id: In(dto.role_ids) });
        if (roles.length !== dto.role_ids.length) throw new BadRequestException('Invalid role IDs');
        admin.roles = roles;
      }
    }

    // Update branch
    if (dto.branch_id !== undefined) {
      if (!dto.branch_id) admin.branch = null;
      else {
        const branch = await this.branchRepository.findOneBy({ id: dto.branch_id });
        if (!branch) throw new BadRequestException('Invalid branch ID');
        admin.branch = branch;
      }
    }

    // Safe field updates
    Object.assign(admin, {
      username: dto.username ?? admin.username,
      email: dto.email ?? admin.email,
      first_name: dto.first_name ?? admin.first_name,
      last_name: dto.last_name ?? admin.last_name,
      phone: dto.phone ?? admin.phone,
      gender: dto.gender ?? admin.gender,
      notes: dto.notes ?? admin.notes,
      village: dto.village ?? admin.village,
      district: dto.district ?? admin.district,
      province: dto.province ?? admin.province,
      current_academic_year: dto.current_academic_year ?? admin.current_academic_year,
      join_date: dto.join_date ? new Date(dto.join_date) : admin.join_date,
      dob: dto.dob ? new Date(dto.dob) : admin.dob,
      is_active: dto.is_active ?? admin.is_active,
    });

    const updated = await this.adminRepository.save(admin);
    return this.toResponseDto(updated);
  }

  // ───────────── DELETE ─────────────
  async softRemove(id: string): Promise<{ message: string }> {
    const admin = await this.findOneRaw(id);
    admin.is_deleted = true;
    admin.is_active = false;
    await this.adminRepository.save(admin);
    return { message: `Admin ${id} soft deleted` };
  }

  async hardRemove(id: string): Promise<{ message: string }> {
    const result = await this.adminRepository.delete(id);
    if (!result.affected) throw new NotFoundException(`Admin ${id} not found`);
    return { message: `Admin ${id} permanently deleted` };
  }

  // ───────────── CHANGE PASSWORD ─────────────
  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const admin = await this.findOneRaw(id);
    if (!admin.password) throw new BadRequestException('No password set');

    const match = await bcrypt.compare(currentPassword, admin.password);
    if (!match) throw new BadRequestException('Current password incorrect');

    if (newPassword.length < 6) throw new BadRequestException('Password too short');

    admin.password = await bcrypt.hash(newPassword, 10);
    await this.adminRepository.save(admin);

    return { message: 'Password updated' };
  }

  // ───────────── HELPERS ─────────────
  private toResponseDto(admin: Admin): AdminResponseDto {
    const toIso = (v?: string | Date | null) => (v ? new Date(v).toISOString() : null);
    const nullable = (v?: string | null) => v ?? null;

    return {
      id: admin.id,
      username: admin.username!,
      email: admin.email!,
      first_name: nullable(admin.first_name),
      last_name: nullable(admin.last_name),
      phone: nullable(admin.phone),
      gender: nullable(admin.gender),
      notes: nullable(admin.notes),
      village: nullable(admin.village),
      district: nullable(admin.district),
      province: nullable(admin.province),
      current_academic_year: nullable(admin.current_academic_year),
      join_date: toIso(admin.join_date),
      dob: toIso(admin.dob),
      is_active: admin.is_active,
      profile_pic: nullable(admin.profile_pic),
      created_at: admin.created_at.toISOString(),
      updated_at: admin.updated_at.toISOString(),
      roles: (admin.roles || []).map((r) => ({ id: r.id, name: r.name, level: r.level })),
      branch: admin.branch ? { id: admin.branch.id, name: nullable(admin.branch.name) } : null,
    };
  }

  private async findOneRaw(id: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['roles', 'branch'],
    });
    if (!admin) throw new NotFoundException(`Admin ${id} not found`);
    return admin;
  }
}
