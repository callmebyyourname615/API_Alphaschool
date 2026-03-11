// src/lessons/lessons.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Lesson } from './lesson.entity';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
  ) {}

  async create(dto: CreateLessonDto): Promise<Lesson> {
    const lesson = this.lessonRepository.create({
      teaching: { id: dto.teachingId },
      title: dto.title,
      description: dto.description || null,
      lessonDate: new Date(dto.lessonDate),
    });

    try {
      return await this.lessonRepository.save(lesson);
    } catch (error) {
      if (error.code === '23503') {
        throw new BadRequestException('The referenced teaching assignment does not exist');
      }
      throw error;
    }
  }

  async findAll(): Promise<Lesson[]> {
    return this.lessonRepository.find({
      relations: ['teaching', 'teaching.teacher', 'teaching.subject', 'teaching.class'],
      order: { lessonDate: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id },
      relations: ['teaching', 'teaching.teacher', 'teaching.subject', 'teaching.class'],
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    return lesson;
  }

  async findByTeaching(teachingId: string): Promise<Lesson[]> {
    return this.lessonRepository.find({
      where: { teaching: { id: teachingId } },
      relations: ['teaching'],
      order: { lessonDate: 'ASC' },
    });
  }

async update(id: string, dto: UpdateLessonDto): Promise<Lesson> {
  const lesson = await this.lessonRepository.preload({
    id,
    ...dto,
    lessonDate: dto.lessonDate ? new Date(dto.lessonDate) : undefined,
  });

  if (!lesson) throw new NotFoundException('Lesson not found');

  return this.lessonRepository.save(lesson);
}


  async remove(id: string): Promise<void> {
    const lesson = await this.findOne(id);
    await this.lessonRepository.remove(lesson);
  }
}