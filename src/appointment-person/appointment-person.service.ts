import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentPerson } from './appointment-person.entity';
import { CreateAppointmentPersonDto } from './dto/create-appointment-person.dto';
import { UpdateAppointmentPersonDto } from './dto/update-appointment-person.dto';
import { randomUUID } from 'crypto';
import { Appointment } from '../appointment/appointment.entity';
import { Branch } from '../branches/branch.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';

@Injectable()
export class AppointmentPersonService {
  constructor(
    @InjectRepository(AppointmentPerson)
    private repo: Repository<AppointmentPerson>,
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(Branch)
    private branchRepo: Repository<Branch>,
    @InjectRepository(AcademicYear)
    private yearRepo: Repository<AcademicYear>,
  ) {}

  async create(dto: CreateAppointmentPersonDto) {
    const branch = await this.branchRepo.findOne({
      where: { id: dto.branch_id },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    const appointment = await this.appointmentRepo.findOne({
      where: { id: dto.appointment_id },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');

    const year = await this.yearRepo.findOne({
      where: { id: dto.academic_year_id },
    });
    if (!year) throw new NotFoundException('Academic Year not found');

    const ap = this.repo.create({
      id: randomUUID().replace(/-/g, '').slice(0, 24),
      ...dto,
      is_deleted: false,
    });

    return this.repo.save(ap);
  }

  async findAll() {
    return this.repo.find({ where: { is_deleted: false } });
  }

  async findOne(id: string) {
    const ap = await this.repo.findOne({ where: { id, is_deleted: false } });
    if (!ap) throw new NotFoundException('AppointmentPerson not found');
    return ap;
  }

  async findByAppointment(appointmentId: string) {
    return this.repo.find({
      where: { appointment_id: appointmentId, is_deleted: false },
    });
  }

  async findByAppointmentBody(appointmentId: string) {
    return this.repo.find({
      where: { appointment_id: appointmentId, is_deleted: false },
    });
  }
  async findByBranch(branchId: string) {
    return this.repo.find({
      where: { branch_id: branchId, is_deleted: false },
    });
  }

  async update(id: string, dto: UpdateAppointmentPersonDto) {
    const existing = await this.findOne(id);
    const updated = { ...existing, ...dto };
    return this.repo.save(updated);
  }

  async softDelete(id: string) {
    const ap = await this.findOne(id);
    ap.is_deleted = true;
    return this.repo.save(ap);
  }
}
