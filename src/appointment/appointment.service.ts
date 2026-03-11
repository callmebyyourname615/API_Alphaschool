import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './create-appointment.dto';
import { UpdateAppointmentDto } from './update-appointment.dto';
import { randomUUID } from 'crypto';
import { Branch } from '../branches/branch.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private repo: Repository<Appointment>,

    @InjectRepository(Branch)
    private branchRepo: Repository<Branch>,

    @InjectRepository(AcademicYear)
    private yearRepo: Repository<AcademicYear>,
  ) {}

  // -----------------------------
  // Create appointment with validation
  // -----------------------------
  async create(dto: CreateAppointmentDto) {
    // Validate branch
    const branch = await this.branchRepo.findOne({
      where: { id: dto.branch_id, is_deleted: false },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    // Validate academic year
    const academicYear = await this.yearRepo.findOne({
      where: { id: dto.academic_year_id, is_deleted: false },
    });
    if (!academicYear) throw new NotFoundException('Academic Year not found');

    const appointment = this.repo.create({
      id: randomUUID(),
      ...dto,
      created_at: new Date(),
    });

    return this.repo.save(appointment);
  }

  // -----------------------------
  // Get all appointments
  // -----------------------------
  async findAll() {
    return this.repo.find({
      where: { is_deleted: false },
      relations: ['branch', 'academicYear'], // return branch & academic year info
    });
  }

  async findBydate(dateFrom?: string, dateTo?: string) {
    const where: any = { is_deleted: false };

    // Add date range filter if both dates are provided
    if (dateFrom && dateTo) {
      where.date = Between(dateFrom, dateTo);
    }

    return this.repo.find({
      where,
      relations: ['branch', 'academicYear'],
    });
  }

  // -----------------------------
  // Get by ID
  // -----------------------------
  async findOne(id: string) {
    const appointment = await this.repo.findOne({
      where: { id, is_deleted: false },
      relations: ['branch', 'academicYear'],
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  // -----------------------------
  // Get by branch
  // -----------------------------
  async findByBranch(branch_id: string) {
    return this.repo.find({
      where: { branch_id, is_deleted: false },
      relations: ['branch', 'academicYear'],
    });
  }

  // -----------------------------
  // Update appointment
  // -----------------------------
  async update(id: string, dto: UpdateAppointmentDto) {
    const existing = await this.findOne(id);

    // Optional: validate branch_id or academic_year_id if updated
    if (dto.branch_id) {
      const branch = await this.branchRepo.findOne({
        where: { id: dto.branch_id, is_deleted: false },
      });
      if (!branch) throw new NotFoundException('Branch not found');
    }

    if (dto.academic_year_id) {
      const academicYear = await this.yearRepo.findOne({
        where: { id: dto.academic_year_id, is_deleted: false },
      });
      if (!academicYear) throw new NotFoundException('Academic Year not found');
    }

    const updated = { ...existing, ...dto, updated_at: new Date() };
    return this.repo.save(updated);
  }

  // -----------------------------
  // Soft delete
  // -----------------------------
  async softDelete(id: string) {
    const appointment = await this.findOne(id);
    appointment.is_deleted = true;
    appointment.updated_at = new Date();
    return this.repo.save(appointment);
  }
}
