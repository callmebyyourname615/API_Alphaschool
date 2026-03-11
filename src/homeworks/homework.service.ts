import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Homework } from './homework.entity';
import { Task } from '../task/task.entity';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';

@Injectable()
export class HomeworkService {
  constructor(
    @InjectRepository(Homework)
    private homeworkRepo: Repository<Homework>,

    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
  ) {}

  // teachings.service.ts
async create(dto: CreateHomeworkDto): Promise<Homework> {
    const homework = this.homeworkRepo.create({
      title: dto.title,
      description: dto.description || null,
      score: dto.score ?? null,
      deadline: dto.deadline ? new Date(dto.deadline) : null,

      // Foreign keys
      teachingId: dto.teachingId,
      branchId: dto.branchId,
      lessonId: dto.lessonId || null,
      lessonInfoId: dto.lessonInfoId || null,

      // Relations — MUST provide objects for TypeORM to populate FKs
      teaching: { id: dto.teachingId },
      branch: { id: dto.branchId },
      lesson: dto.lessonId ? { id: dto.lessonId } : null,
      lessonInfo: dto.lessonInfoId ? { id: dto.lessonInfoId } : null,

      tasks: dto.tasks || [],
    });

    try {
      return await this.homeworkRepo.save(homework);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }


  async findAll(branchId?: string): Promise<Homework[]> {
    const qb = this.homeworkRepo.createQueryBuilder('homework')
      .leftJoinAndSelect('homework.tasks', 'tasks')
      .leftJoinAndSelect('homework.teaching', 'teaching')
      .leftJoinAndSelect('homework.lesson', 'lesson')
      .leftJoinAndSelect('homework.lessonInfo', 'lessonInfo')
      .leftJoinAndSelect('homework.branch', 'branch');

    if (branchId) qb.where('homework.branchId = :branchId', { branchId });

    qb.orderBy('homework.created_at', 'DESC');
    return qb.getMany();
  }

  async findOne(id: string): Promise<Homework> {
    const homework = await this.homeworkRepo.findOne({
      where: { id },
      relations: ['tasks', 'teaching', 'lesson', 'lessonInfo', 'branch'],
    });
    if (!homework) throw new NotFoundException(`Homework with ID ${id} not found`);
    return homework;
  }

  async update(id: string, dto: UpdateHomeworkDto): Promise<Homework> {
    const homework = await this.findOne(id);

    if (dto.title !== undefined) homework.title = dto.title;
    if (dto.description !== undefined) homework.description = dto.description ?? null;
    if (dto.score !== undefined) homework.score = dto.score ?? null;
    if (dto.deadline !== undefined) homework.deadline = dto.deadline ? new Date(dto.deadline) : null;

    if (dto.teachingId !== undefined) homework.teachingId = dto.teachingId;
    if (dto.lessonId !== undefined) homework.lessonId = dto.lessonId ?? null;
    if (dto.lessonInfoId !== undefined) homework.lessonInfoId = dto.lessonInfoId ?? null;
    if (dto.branchId !== undefined) homework.branchId = dto.branchId;

    // Replace tasks if provided
    if (dto.tasks !== undefined) {
      await this.taskRepo.delete({ homework: { id } });

      homework.tasks = dto.tasks.map(t =>
        this.taskRepo.create({
          name: t.name,
          description: t.description,
          deadline: new Date(t.deadline),
          added_by_id: t.added_by_id,
          added_by_type: t.added_by_type,
          homework,
        }),
      );
    }

    return this.homeworkRepo.save(homework);
  }

  async remove(id: string): Promise<void> {
    const homework = await this.findOne(id);
    await this.homeworkRepo.remove(homework);
  }
}
