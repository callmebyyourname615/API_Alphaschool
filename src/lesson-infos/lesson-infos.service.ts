import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLessonInfoDto } from './dto/create-lesson-info.dto';
import { UpdateLessonInfoDto } from './dto/update-lesson-info.dto';
import { LessonInfo } from './lesson_info.entity';
import { Lesson } from '../lessons/lesson.entity';

@Injectable()
export class LessonInfosService {
  constructor(
    @InjectRepository(LessonInfo)
    private lessonInfoRepo: Repository<LessonInfo>,

    @InjectRepository(Lesson)
    private lessonRepo: Repository<Lesson>,
  ) {}

  async create(dto: CreateLessonInfoDto): Promise<LessonInfo> {
    const lesson = await this.lessonRepo.findOneBy({ id: dto.lessonId });
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${dto.lessonId} not found`);
    }

    const entity = this.lessonInfoRepo.create({
      lesson,
      lessonInfoNo: dto.lessonInfoNo,
      title: dto.title,
      info: dto.info ?? null,
      isEvaluation: dto.isEvaluation ?? false,
      evaluationMaxScore: dto.evaluationMaxScore ?? null,
      evaluationSample: dto.evaluationSample ?? null,
      infoImage: dto.infoImage ?? null,
      attachment: dto.attachment ?? null,
      evaluationItems: dto.evaluationItems ?? null,
    });

    return this.lessonInfoRepo.save(entity);
  }

  async findAll(): Promise<LessonInfo[]> {
    return this.lessonInfoRepo.find({
      relations: ['lesson'],
      order: { lessonInfoNo: 'ASC', createdAt: 'DESC' },
    });
  }

  async findByLesson(lessonId: string): Promise<LessonInfo[]> {
    return this.lessonInfoRepo.find({
      where: { lesson: { id: lessonId } },
      relations: ['lesson'],
      order: { lessonInfoNo: 'ASC' },
    });
  }

  async findOne(id: string): Promise<LessonInfo> {
    const entity = await this.lessonInfoRepo.findOne({
      where: { id },
      relations: ['lesson'],
    });
    if (!entity) {
      throw new NotFoundException(`LessonInfo ${id} not found`);
    }
    return entity;
  }

  async update(id: string, updateDto: UpdateLessonInfoDto): Promise<LessonInfo> {
  const entity = await this.lessonInfoRepo.findOne({
    where: { id },
    relations: ['lesson'], // if you need lesson in response
  });

  if (!entity) {
    throw new NotFoundException(`LessonInfo with ID ${id} not found`);
  }

  // Merge new values (only update provided fields)
  Object.assign(entity, updateDto);

  // Special handling for files (if new filename came)
  if (updateDto.infoImage) {
    entity.infoImage = updateDto.infoImage;
  }
  if (updateDto.attachment) {
    entity.attachment = updateDto.attachment;
  }

  // Save and return updated entity
  const updated = await this.lessonInfoRepo.save(entity);

  return updated;
}

  async remove(id: string): Promise<void> {
    const entity = await this.findOne(id);
    await this.lessonInfoRepo.remove(entity);
  }
}