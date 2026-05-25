// ============================================================
// FILE: src/appointment/appointment.service.ts
// ============================================================
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository }      from '@nestjs/typeorm';
import { Between, DataSource, Repository } from 'typeorm';
import { randomUUID }            from 'crypto';

import { Appointment }           from './appointment.entity';
import { Branch }                from '../branches/branch.entity';
import { AcademicYear }          from '../academic_years/academic-year.entity';

import { CreateAppointmentDto }  from './dto/create-appointment.dto';
import { UpdateAppointmentDto }  from './dto/update-appointment.dto';
import { RespondAppointmentDto } from './dto/respond-appointment.dto';
import { CreatorRescheduleDto }  from './dto/creator-reschedule.dto';



import { AppointmentStatus, ParticipantStatus, PersonType } from './appointment.enum';
import { AppointmentParticipant, MAX_RESCHEDULE } from './dto/appointment-participant.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private repo: Repository<Appointment>,

    @InjectRepository(AppointmentParticipant)
    private participantRepo: Repository<AppointmentParticipant>,

    @InjectRepository(Branch)
    private branchRepo: Repository<Branch>,

    @InjectRepository(AcademicYear)
    private yearRepo: Repository<AcademicYear>,

    private dataSource: DataSource,
  ) {}

  // ── Private helpers ────────────────────────────────────────
  private async assertBranch(id: string) {
    const b = await this.branchRepo.findOne({
      where: { id, is_deleted: false },
    });
    if (!b) throw new NotFoundException('Branch not found');
    return b;
  }

  private async assertYear(id: string) {
    const y = await this.yearRepo.findOne({
      where: { id, is_deleted: false },
    });
    if (!y) throw new NotFoundException('Academic Year not found');
    return y;
  }

  private assertTimeRange(from: string, to: string, label = '') {
    if (from >= to) {
      throw new BadRequestException(
        `${label} from_time must be before to_time`.trim(),
      );
    }
  }

  private makeParticipantId(): string {
    return randomUUID().replace(/-/g, '').slice(0, 24);
  }

  private withActiveParticipants<T extends { participants?: AppointmentParticipant[] }>(
    appointment: T,
  ): T {
    if (Array.isArray(appointment.participants)) {
      appointment.participants = appointment.participants.filter(
        (p) => !p.is_deleted && p.is_active !== false,
      );
    }
    return appointment;
  }

  // ── CREATE ─────────────────────────────────────────────────
  async create(dto: CreateAppointmentDto) {
    await this.assertBranch(dto.branch_id);
    await this.assertYear(dto.academic_year_id);
    this.assertTimeRange(dto.from_time, dto.to_time);

    return this.dataSource.transaction(async (manager) => {
      const now = new Date();
      const appointment = manager.create(Appointment, {
        id:                randomUUID(),
        created_by:        dto.created_by,
        creator_role:      dto.creator_role,
        branch_id:         dto.branch_id,
        academic_year_id:  dto.academic_year_id,
        title:             dto.title,
        description:       dto.description,
        appointment_place: dto.appointment_place,
        date:              new Date(dto.date),
        from_time:         dto.from_time,
        to_time:           dto.to_time,
        status:            AppointmentStatus.SCHEDULED,
        is_active:         true,
        is_deleted:        false,
        created_at:        now,
        updated_at:        now,
      });
      await manager.save(Appointment, appointment);

      const rows = dto.participants.map((p) =>
        manager.create(AppointmentParticipant, {
          id:               this.makeParticipantId(),
          appointment_id:   appointment.id,
          branch_id:        dto.branch_id,
          academic_year_id: dto.academic_year_id,
          person_id:        p.person_id,
          person_type: p.person_type as PersonType,
          status:           ParticipantStatus.PENDING,
          reschedule_count: 0,
          declined_count:   0,
          is_active:        true,
          is_deleted:       false,
        }),
      );
      await manager.save(AppointmentParticipant, rows);

      return { appointment, participants: rows };
    });
  }

  // ── PARTICIPANT RESPONDS ───────────────────────────────────
  async respond(participantId: string, dto: RespondAppointmentDto) {
    const participant = await this.participantRepo.findOne({
      where: { id: participantId, is_deleted: false },
      relations: ['appointment'],
    });
    if (!participant) throw new NotFoundException('Participant not found');

    const appt = participant.appointment!;
    if (appt.is_deleted)
      throw new NotFoundException('Appointment not found');
    if (appt.status === AppointmentStatus.CANCELLED)
      throw new ForbiddenException('Cannot respond to a cancelled appointment');
    if (participant.status === ParticipantStatus.DECLINED)
      throw new ForbiddenException('You have already declined this appointment');

    switch (dto.status) {
      case ParticipantStatus.ACCEPTED: {
        participant.status        = ParticipantStatus.ACCEPTED;
        participant.response_note = dto.response_note ?? undefined;
        break;
      }

      case ParticipantStatus.DECLINED: {
        participant.declined_count += 1;
        participant.status         = ParticipantStatus.DECLINED;
        participant.response_note  = dto.response_note ?? undefined;
        break;
      }

      case ParticipantStatus.RESCHEDULED: {
        if (
          !dto.proposed_date ||
          !dto.proposed_from_time ||
          !dto.proposed_to_time
        ) {
          throw new BadRequestException(
            'proposed_date, proposed_from_time and proposed_to_time are required when requesting a reschedule',
          );
        }
        this.assertTimeRange(dto.proposed_from_time, dto.proposed_to_time, 'Proposed');

        const nextCount = participant.reschedule_count + 1;

        if (nextCount > MAX_RESCHEDULE) {
          participant.declined_count += 1;
          participant.status         = ParticipantStatus.DECLINED;
          participant.response_note  = `Auto-declined: exceeded maximum ${MAX_RESCHEDULE} reschedule attempts`;
        } else {
          participant.reschedule_count   = nextCount;
          participant.status             = ParticipantStatus.RESCHEDULED;
          participant.response_note      = dto.response_note ?? undefined;
          participant.proposed_date      = new Date(dto.proposed_date);
          participant.proposed_from_time = dto.proposed_from_time;
          participant.proposed_to_time   = dto.proposed_to_time;
        }
        break;
      }

      default:
        throw new BadRequestException('Invalid status value');
    }

    return this.participantRepo.save(participant);
  }

  // ── CREATOR SETS NEW OFFICIAL TIME ────────────────────────
  async creatorReschedule(appointmentId: string, dto: CreatorRescheduleDto) {
    const appointment = await this.repo.findOne({
      where: { id: appointmentId, is_deleted: false },
      relations: ['participants'],
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.status === AppointmentStatus.CANCELLED)
      throw new ForbiddenException('Cannot reschedule a cancelled appointment');

    this.assertTimeRange(
      dto.rescheduled_from_time,
      dto.rescheduled_to_time,
      'Rescheduled',
    );

    appointment.rescheduled_date      = new Date(dto.rescheduled_date);
    appointment.rescheduled_from_time = dto.rescheduled_from_time;
    appointment.rescheduled_to_time   = dto.rescheduled_to_time;
    appointment.status                = AppointmentStatus.RESCHEDULED;

    const toReset = (appointment.participants ?? []).filter(
      (p) => p.status === ParticipantStatus.RESCHEDULED && !p.is_deleted,
    );
    for (const p of toReset) {
      p.status             = ParticipantStatus.PENDING;
      p.proposed_date      = undefined;
      p.proposed_from_time = undefined;
      p.proposed_to_time   = undefined;
    }

    return this.dataSource.transaction(async (manager) => {
      await manager.save(Appointment, appointment);
      if (toReset.length) {
        await manager.save(AppointmentParticipant, toReset);
      }
      return appointment;
    });
  }

  // ── FIND ALL (paginated) ───────────────────────────────────
  async findAll(page = 1, limit = 20) {
    const [data, total] = await this.repo.findAndCount({
      where: { is_deleted: false },
      relations: ['branch', 'academicYear', 'participants'],
      order: { date: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: data.map((appointment) => this.withActiveParticipants(appointment)),
      total,
      page,
      limit,
    };
  }

  // ── FIND BY DATE RANGE ─────────────────────────────────────
  async findByDate(dateFrom?: string, dateTo?: string) {
    const where: any = { is_deleted: false };
    if (dateFrom && dateTo) {
      if (dateFrom > dateTo)
        throw new BadRequestException('dateFrom must be before or equal to dateTo');
      where.date = Between(new Date(dateFrom), new Date(dateTo));
    }
    const appointments = await this.repo.find({
      where,
      relations: ['branch', 'academicYear', 'participants'],
      order: { date: 'ASC' },
    });
    return appointments.map((appointment) => this.withActiveParticipants(appointment));
  }

  // ── FIND ONE ───────────────────────────────────────────────
  async findOne(id: string) {
    const a = await this.repo.findOne({
      where: { id, is_deleted: false },
      relations: ['branch', 'academicYear', 'participants'],
    });
    if (!a) throw new NotFoundException('Appointment not found');
    return this.withActiveParticipants(a);
  }

  // ── FIND BY BRANCH ─────────────────────────────────────────
  async findByBranch(branch_id: string, page = 1, limit = 20) {
    await this.assertBranch(branch_id);
    const [data, total] = await this.repo.findAndCount({
      where: { branch_id, is_deleted: false },
      relations: ['branch', 'academicYear', 'participants'],
      order: { date: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: data.map((appointment) => this.withActiveParticipants(appointment)),
      total,
      page,
      limit,
    };
  }

  // ── FIND BY PERSON (my appointments) ──────────────────────
  async findByPerson(personId: string, page = 1, limit = 20) {
    const [rows, total] = await this.participantRepo.findAndCount({
      where: { person_id: personId, is_deleted: false },
      relations: [
        'appointment',
        'appointment.branch',
        'appointment.academicYear',
      ],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: rows, total, page, limit };
  }

  // ── FIND BY CREATOR ────────────────────────────────────────
  async findByCreator(creatorId: string, page = 1, limit = 20) {
    const [data, total] = await this.repo.findAndCount({
      where: { created_by: creatorId, is_deleted: false },
      relations: ['branch', 'academicYear', 'participants'],
      order: { date: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: data.map((appointment) => this.withActiveParticipants(appointment)),
      total,
      page,
      limit,
    };
  }

  // ── FIND RESCHEDULE REQUESTS (for creator to review) ──────
  async findRescheduleRequests(appointmentId: string) {
    const appointment = await this.findOne(appointmentId);
    const requests = (appointment.participants ?? []).filter(
      (p) => p.status === ParticipantStatus.RESCHEDULED,
    );
    return {
      appointment_id:      appointmentId,
      reschedule_requests: requests,
    };
  }

  // ── UPDATE basic info ──────────────────────────────────────
  async update(id: string, dto: UpdateAppointmentDto) {
    // Load WITHOUT participants relation — loading + filtering participants
    // client-side then calling save() with cascade:true causes TypeORM to
    // NULL-out the appointment_id of soft-deleted rows, violating the constraint.
    const existing = await this.repo.findOne({
      where: { id, is_deleted: false },
    });
    if (!existing) throw new NotFoundException('Appointment not found');

    if (dto.branch_id)        await this.assertBranch(dto.branch_id);
    if (dto.academic_year_id) await this.assertYear(dto.academic_year_id);

    const from = dto.from_time ?? existing.from_time;
    const to   = dto.to_time   ?? existing.to_time;
    if (from && to) {
      this.assertTimeRange(from, to);
    }

    Object.assign(existing, dto);
    return this.repo.save(existing);
  }

  // ── SOFT DELETE ────────────────────────────────────────────
  async softDelete(id: string) {
    return this.dataSource.transaction(async (manager) => {
      const a = await manager.findOne(Appointment, {
        where: { id, is_deleted: false },
      });
      if (!a) throw new NotFoundException('Appointment not found');

      a.is_deleted = true;
      a.is_active  = false;
      a.status     = AppointmentStatus.CANCELLED;

      await manager.update(
        AppointmentParticipant,
        { appointment_id: id, is_deleted: false },
        { is_deleted: true, is_active: false },
      );

      return manager.save(Appointment, a);
    });
  }
}
