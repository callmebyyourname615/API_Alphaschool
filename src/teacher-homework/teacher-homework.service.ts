import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherHomework } from './teacher-homework.entity';
import { TeacherHomeworkItem } from './teacher-homework-item.entity';
import { CreateTeacherHomeworkDto } from './dto/create-teacher-homework.dto';
import { UpdateTeacherHomeworkDto } from './dto/update-teacher-homework.dto';
import { CreateTeacherHomeworkItemDto } from './dto/create-teacher-homework-item.dto';
import { UpdateTeacherHomeworkItemDto } from './dto/update-teacher-homework-item.dto';
import { TeacherHomeworkStatus } from './teacher-homework-status.enum';
import { TeachLearning } from '../teach_learning/teach-learning.entity';
import { Teaching } from '../teachings/teaching.entity';

@Injectable()
export class TeacherHomeworkService {
  constructor(
    @InjectRepository(TeacherHomework)
    private readonly teacherHomeworkRepo: Repository<TeacherHomework>,

    @InjectRepository(TeacherHomeworkItem)
    private readonly teacherHomeworkItemRepo: Repository<TeacherHomeworkItem>,

    @InjectRepository(TeachLearning)
    private readonly teachLearningRepo: Repository<TeachLearning>,

    @InjectRepository(Teaching)
    private readonly teachingRepo: Repository<Teaching>,
  ) {}

  async create(createDto: CreateTeacherHomeworkDto): Promise<TeacherHomework> {
    // หาข้อมูล teaching
    const teaching = await this.teachingRepo.findOne({
      where: { id: createDto.teachingId },
      relations: ['branch'],
    });
    if (!teaching) {
      throw new BadRequestException('teachingId not found');
    }

    // หาข้อมูล teachLearning
    const teachLearning = await this.teachLearningRepo.findOne({
      where: { id: createDto.teachLearningId },
      relations: ['admin', 'subject'],
    });
    if (!teachLearning) {
      throw new BadRequestException('teachLearningId not found');
    }

    // สร้าง items
    const items = (createDto.items ?? []).map((item, index) =>
      this.teacherHomeworkItemRepo.create({
        title: item.title,
        teacherGuidePage: item.teacherGuidePage ?? null,
        itemInstruction: item.itemInstruction ?? null,
        imageUrl: item.imageUrl ?? null,
        sortOrder: item.sortOrder ?? index + 1,
        score: item.score,
      }),
    );
    this.validateAllItemsHaveScore(items);

    const status = createDto.status ?? TeacherHomeworkStatus.DRAFT;
    if (status === TeacherHomeworkStatus.SENT) {
      this.validateCanPublish(items);
    }

    const homework = this.teacherHomeworkRepo.create({
      teachingId: teaching.id,
      teaching,
      branchId: teaching.branch.id, // ต้องเอา id ของ branch
      branch: teaching.branch,
      teachLearningId: teachLearning.id,
      teachLearning,
      title: createDto.title,
      overallInstruction: createDto.overallInstruction ?? null,
      dueDate: createDto.dueDate ? new Date(createDto.dueDate) : null,
      status,
      sentAt: status === TeacherHomeworkStatus.SENT ? new Date() : null,
      totalScore: this.calculateTotalScore(items),
      items,
    });

    const saved = await this.teacherHomeworkRepo.save(homework);
    return this.findOne(saved.id);
  }

  async findAll(
    teachingId?: string,
    status?: TeacherHomeworkStatus,
  ): Promise<TeacherHomework[]> {
    const query = this.teacherHomeworkRepo
      .createQueryBuilder('teacherHomework')
      .leftJoinAndSelect('teacherHomework.teaching', 'teaching') // ✅
      .leftJoinAndSelect('teacherHomework.branch', 'branch') // ✅
      .leftJoinAndSelect('teacherHomework.items', 'items');

    if (teachingId) {
      query.andWhere('teacherHomework.teachingId = :teachingId', {
        teachingId,
      });
    }

    if (status) {
      query.andWhere('teacherHomework.status = :status', { status });
    }

    return query
      .orderBy('teacherHomework.createdAt', 'DESC')
      .addOrderBy('items.sortOrder', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<TeacherHomework> {
    const homework = await this.teacherHomeworkRepo.findOne({
      where: { id },
      relations: [
        'teaching', // ✅
        'branch', // ✅
        'items',
      ],
      order: {
        items: {
          sortOrder: 'ASC',
        },
      },
    });

    if (!homework) {
      throw new NotFoundException(`Teacher homework with ID ${id} not found`);
    }

    return homework;
  }
  async update(
    id: string,
    updateDto: UpdateTeacherHomeworkDto,
  ): Promise<TeacherHomework> {
    const existing = await this.findOne(id);

    if (updateDto.teachLearningId) {
      const teachLearning = await this.teachLearningRepo.findOne({
        where: { id: updateDto.teachLearningId },
        relations: ['admin', 'subject'],
      });

      if (!teachLearning) {
        throw new BadRequestException('teachLearningId not found');
      }

      existing.teachLearningId = updateDto.teachLearningId;
      existing.teachLearning = teachLearning;
    }

    if (updateDto.title !== undefined) {
      existing.title = updateDto.title;
    }

    if (updateDto.overallInstruction !== undefined) {
      existing.overallInstruction = updateDto.overallInstruction ?? null;
    }

    if (updateDto.dueDate !== undefined) {
      existing.dueDate = updateDto.dueDate ? new Date(updateDto.dueDate) : null;
    }

    if (updateDto.status !== undefined) {
      existing.status = updateDto.status;

      if (updateDto.status === TeacherHomeworkStatus.SENT) {
        this.validateCanPublish(existing.items);
        existing.sentAt = existing.sentAt ?? new Date();
      }

      if (updateDto.status === TeacherHomeworkStatus.DRAFT) {
        existing.sentAt = null;
      }
    }

    // ป้องกันข้อมูลเก่า/ข้อมูลแก้ไขที่ item ไม่มี score
    this.validateAllItemsHaveScore(existing.items);

    existing.totalScore = this.calculateTotalScore(existing.items);

    const saved = await this.teacherHomeworkRepo.save(existing);
    return this.findOne(saved.id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const homework = await this.findOne(id);
    await this.teacherHomeworkRepo.remove(homework);

    return { message: 'Teacher homework deleted successfully' };
  }

  async publish(id: string): Promise<TeacherHomework> {
    const homework = await this.findOne(id);

    this.validateCanPublish(homework.items);

    homework.status = TeacherHomeworkStatus.SENT;
    homework.sentAt = new Date();
    homework.totalScore = this.calculateTotalScore(homework.items);

    await this.teacherHomeworkRepo.save(homework);

    return this.findOne(id);
  }

  async createItem(
    homeworkId: string,
    createDto: CreateTeacherHomeworkItemDto,
  ): Promise<TeacherHomeworkItem> {
    const homework = await this.teacherHomeworkRepo.findOne({
      where: { id: homeworkId },
      relations: ['items'],
    });

    if (!homework) {
      throw new NotFoundException(
        `Teacher homework with ID ${homeworkId} not found`,
      );
    }

    if (createDto.score === null || createDto.score === undefined) {
      throw new BadRequestException('score is required');
    }

    const item = this.teacherHomeworkItemRepo.create({
      teacherHomeworkId: homeworkId,
      teacherHomework: homework,
      title: createDto.title,
      teacherGuidePage: createDto.teacherGuidePage ?? null,
      itemInstruction: createDto.itemInstruction ?? null,
      imageUrl: createDto.imageUrl ?? null,
      sortOrder: createDto.sortOrder ?? (homework.items?.length ?? 0) + 1,
      score: createDto.score,
    });

    const savedItem = await this.teacherHomeworkItemRepo.save(item);
    await this.refreshTotalScore(homeworkId);

    return this.findItem(savedItem.id);
  }

  async findItems(homeworkId: string): Promise<TeacherHomeworkItem[]> {
    const homework = await this.teacherHomeworkRepo.findOne({
      where: { id: homeworkId },
    });

    if (!homework) {
      throw new NotFoundException(
        `Teacher homework with ID ${homeworkId} not found`,
      );
    }

    return this.teacherHomeworkItemRepo.find({
      where: { teacherHomeworkId: homeworkId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findItem(itemId: string): Promise<TeacherHomeworkItem> {
    const item = await this.teacherHomeworkItemRepo.findOne({
      where: { id: itemId },
      relations: ['teacherHomework'],
    });

    if (!item) {
      throw new NotFoundException(
        `Teacher homework item with ID ${itemId} not found`,
      );
    }

    return item;
  }

  async updateItem(
    itemId: string,
    updateDto: UpdateTeacherHomeworkItemDto,
  ): Promise<TeacherHomeworkItem> {
    const existingItem = await this.findItem(itemId);

    if (updateDto.score === null || updateDto.score === undefined) {
      throw new BadRequestException('score is required');
    }

    if (updateDto.title !== undefined) {
      existingItem.title = updateDto.title;
    }

    if (updateDto.teacherGuidePage !== undefined) {
      existingItem.teacherGuidePage = updateDto.teacherGuidePage ?? null;
    }

    if (updateDto.itemInstruction !== undefined) {
      existingItem.itemInstruction = updateDto.itemInstruction ?? null;
    }

    if (updateDto.imageUrl !== undefined) {
      existingItem.imageUrl = updateDto.imageUrl ?? null;
    }

    if (updateDto.sortOrder !== undefined) {
      existingItem.sortOrder = updateDto.sortOrder;
    }

    existingItem.score = updateDto.score;

    const savedItem = await this.teacherHomeworkItemRepo.save(existingItem);
    await this.refreshTotalScore(existingItem.teacherHomeworkId);

    return this.findItem(savedItem.id);
  }

  async removeItem(itemId: string): Promise<{ message: string }> {
    const item = await this.findItem(itemId);
    const homeworkId = item.teacherHomeworkId;

    await this.teacherHomeworkItemRepo.remove(item);
    await this.refreshTotalScore(homeworkId);

    return { message: 'Teacher homework item deleted successfully' };
  }

  // ใช้ตอน create/update แบบทั่วไป:
  // ถ้าไม่มี items เลย ให้ผ่านได้
  // แต่ถ้ามี items แล้ว ทุก item ต้องมี score
  private validateAllItemsHaveScore(items: Array<{ score?: number | null }>) {
    if (!items || items.length === 0) {
      return;
    }

    const hasMissingScore = items.some(
      (item) => item.score === null || item.score === undefined,
    );

    if (hasMissingScore) {
      throw new BadRequestException('All homework items must have score');
    }
  }

  // ใช้ตอน publish/sent:
  // ต้องมีอย่างน้อย 1 item และทุก item ต้องมี score
  private validateCanPublish(items: Array<{ score?: number | null }>) {
    if (!items || items.length === 0) {
      throw new BadRequestException(
        'Cannot send homework without at least one item',
      );
    }

    this.validateAllItemsHaveScore(items);
  }

  private calculateTotalScore(items: Array<{ score?: number | null }>): number {
    if (!items || items.length === 0) {
      return 0;
    }

    return items.reduce((sum, item) => sum + (item.score ?? 0), 0);
  }

  private async refreshTotalScore(homeworkId: string): Promise<void> {
    const homework = await this.teacherHomeworkRepo.findOne({
      where: { id: homeworkId },
      relations: ['items'],
    });

    if (!homework) {
      return;
    }

    homework.totalScore = this.calculateTotalScore(homework.items);
    await this.teacherHomeworkRepo.save(homework);
  }
}
