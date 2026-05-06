import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayReceive, PayReceiveStatus } from './pay-receive.entity';
import {
  CreatePayReceiveDto,
  UpdatePayReceiveDto,
  UpdatePayReceiveStatusDto,
} from './dto/pay-receive.dto';

@Injectable()
export class PayReceiveService {
  constructor(
    @InjectRepository(PayReceive)
    private readonly payReceiveRepo: Repository<PayReceive>,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────
  async create(dto: CreatePayReceiveDto): Promise<PayReceive> {
    const record = this.payReceiveRepo.create({
      saving_id: dto.saving_id,
      amount: dto.amount,
      note: dto.note ?? null,
      status: PayReceiveStatus.PENDING,
      is_deleted: false,
    });
    return await this.payReceiveRepo.save(record);
  }

  // ─── FIND ALL ─────────────────────────────────────────────────────────────
  async findAll(): Promise<PayReceive[]> {
    return await this.payReceiveRepo.find({
      where: { is_deleted: false },
      relations: {
        saving: {
          student: true,
          class: true,
          branch: true,
          academic_year: true,
        },
      },
      order: { created_at: 'DESC' },
    });
  }

  // ─── FIND BY SAVING ───────────────────────────────────────────────────────
  async findBySaving(savingId: string): Promise<PayReceive[]> {
    return await this.payReceiveRepo.find({
      where: { saving_id: savingId, is_deleted: false },
      relations: {
        saving: {
          student: true,
          class: true,
          branch: true,
          academic_year: true,
        },
      },
      order: { created_at: 'DESC' },
    });
  }

  // ─── FIND ONE ─────────────────────────────────────────────────────────────
  async findOne(id: string): Promise<PayReceive> {
    const record = await this.payReceiveRepo.findOne({
      where: { id, is_deleted: false },
      relations: {
        saving: {
          student: true,
          class: true,
          branch: true,
          academic_year: true,
        },
      },
    });
    if (!record) {
      throw new NotFoundException(`PayReceive "${id}" not found`);
    }
    return record;
  }

  // ─── UPDATE (pending only) ────────────────────────────────────────────────
  async update(id: string, dto: UpdatePayReceiveDto): Promise<PayReceive> {
    const record = await this.findOne(id);
    if (record.status !== PayReceiveStatus.PENDING) {
      throw new BadRequestException('Only pending records can be edited');
    }
    Object.assign(record, dto);
    return await this.payReceiveRepo.save(record);
  }

  // ─── UPDATE STATUS ────────────────────────────────────────────────────────
  async updateStatus(
    id: string,
    dto: UpdatePayReceiveStatusDto,
  ): Promise<PayReceive> {
    const record = await this.findOne(id);

    if (record.status === PayReceiveStatus.RECEIVED) {
      throw new BadRequestException('This record has already been received');
    }

    record.status = dto.status;

    if (dto.status === PayReceiveStatus.RECEIVED) {
      record.received_by = dto.received_by ?? null;
      record.received_at = new Date();
    }

    return await this.payReceiveRepo.save(record);
  }

  // ─── SOFT DELETE ──────────────────────────────────────────────────────────
  async remove(id: string): Promise<{ message: string }> {
    const record = await this.findOne(id);
    if (record.status === PayReceiveStatus.RECEIVED) {
      throw new BadRequestException('Cannot delete a received record');
    }
    record.is_deleted = true;
    await this.payReceiveRepo.save(record);
    return { message: `PayReceive "${id}" deleted successfully` };
  }
}
