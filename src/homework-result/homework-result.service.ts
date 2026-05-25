import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomeworkResult } from './homework-result.entity';
import { TeacherHomework } from '../teacher-homework/teacher-homework.entity';
import { CreateHomeworkResultDto } from './dto/create-homework-result.dto';
import { UpdateHomeworkResultDto } from './dto/update-homework-result.dto';
import { BulkCreateHomeworkResultDto } from './dto/bulk-create-homework-result.dto';

@Injectable()
export class HomeworkResultService {
  constructor(
    @InjectRepository(HomeworkResult)
    private readonly resultRepository: Repository<HomeworkResult>,

    @InjectRepository(TeacherHomework)
    private readonly homeworkRepository: Repository<TeacherHomework>,
  ) {}

  // -------------------------------------------------------
  // Helpers
  // -------------------------------------------------------
  private async getHomework(homeworkId: string): Promise<TeacherHomework> {
    const hw = await this.homeworkRepository.findOne({
      where: { id: homeworkId },
      relations: ['teaching', 'branch', 'class'],
    });
    if (!hw) {
      throw new NotFoundException(
        `TeacherHomework with ID ${homeworkId} not found`,
      );
    }
    return hw;
  }

  // -------------------------------------------------------
  // CREATE — single result
  // -------------------------------------------------------
  async create(dto: CreateHomeworkResultDto): Promise<HomeworkResult> {
    const hw = await this.getHomework(dto.homeworkId);

    if (dto.score > hw.totalScore) {
      throw new BadRequestException(
        `Score ${dto.score} exceeds homework total score ${hw.totalScore}`,
      );
    }

    const existing = await this.resultRepository.findOne({
      where: {
        homeworkId: dto.homeworkId,
        studentId: dto.studentId,
        isDeleted: false,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Result for student ${dto.studentId} in this homework already exists`,
      );
    }

    const result = this.resultRepository.create({
      ...dto,
      classId: dto.classId ?? hw.classId ?? null,
      branchId: dto.branchId ?? hw.branchId ?? null,
    });

    return this.resultRepository.save(result);
  }

  // -------------------------------------------------------
  // BULK CREATE — submit all student scores at once
  // -------------------------------------------------------
  async bulkCreate(
    dto: BulkCreateHomeworkResultDto,
  ): Promise<HomeworkResult[]> {
    const hw = await this.getHomework(dto.homeworkId);

    const resultsToSave: HomeworkResult[] = [];

    for (const item of dto.results) {
      if (item.score > hw.totalScore) {
        throw new BadRequestException(
          `Score ${item.score} for student ${item.studentId} exceeds homework total score ${hw.totalScore}`,
        );
      }

      const existing = await this.resultRepository.findOne({
        where: {
          homeworkId: dto.homeworkId,
          studentId: item.studentId,
          isDeleted: false,
        },
      });
      if (existing) {
        throw new ConflictException(
          `Result for student ${item.studentId} in this homework already exists`,
        );
      }

      resultsToSave.push(
        this.resultRepository.create({
          homeworkId: dto.homeworkId,
          studentId: item.studentId,
          classId: dto.classId ?? hw.classId ?? null,
          branchId: dto.branchId ?? hw.branchId ?? null,
          score: item.score,
          remark: item.remark ?? null,
        }),
      );
    }

    return this.resultRepository.save(resultsToSave);
  }

  // -------------------------------------------------------
  // FIND ALL
  // -------------------------------------------------------
  async findAll(): Promise<HomeworkResult[]> {
    return this.resultRepository.find({
      where: { isDeleted: false },
      relations: ['homework', 'student', 'class', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  // -------------------------------------------------------
  // FIND ONE
  // -------------------------------------------------------
  async findOne(id: string): Promise<HomeworkResult> {
    const result = await this.resultRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['homework', 'student', 'class', 'branch'],
    });

    if (!result) {
      throw new NotFoundException(`HomeworkResult with ID ${id} not found`);
    }

    return result;
  }

  // -------------------------------------------------------
  // FIND BY HOMEWORK — all student scores for one homework
  // -------------------------------------------------------
  async findByHomework(homeworkId: string): Promise<HomeworkResult[]> {
    await this.getHomework(homeworkId);

    return this.resultRepository.find({
      where: { homeworkId, isDeleted: false },
      relations: ['student', 'class', 'branch'],
      order: { score: 'DESC' },
    });
  }

  // -------------------------------------------------------
  // FIND BY STUDENT — all homework results for one student
  // -------------------------------------------------------
  async findByStudent(studentId: string): Promise<HomeworkResult[]> {
    return this.resultRepository.find({
      where: { studentId, isDeleted: false },
      relations: ['homework', 'class', 'branch'],
      order: { submittedAt: 'DESC' },
    });
  }

  // -------------------------------------------------------
  // FIND BY CLASS — all homework results for a class
  // -------------------------------------------------------
  async findByClass(classId: string): Promise<HomeworkResult[]> {
    return this.resultRepository.find({
      where: { classId, isDeleted: false },
      relations: ['homework', 'student', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  // -------------------------------------------------------
  // UPDATE — correct a score
  // -------------------------------------------------------
  async update(
    id: string,
    dto: UpdateHomeworkResultDto,
  ): Promise<HomeworkResult> {
    const result = await this.findOne(id);

    if (dto.score !== undefined) {
      const hw = await this.getHomework(dto.homeworkId ?? result.homeworkId);
      if (dto.score > hw.totalScore) {
        throw new BadRequestException(
          `Score ${dto.score} exceeds homework total score ${hw.totalScore}`,
        );
      }
    }

    Object.assign(result, dto);
    return this.resultRepository.save(result);
  }

  // -------------------------------------------------------
  // SOFT DELETE
  // -------------------------------------------------------
  async remove(id: string): Promise<{ message: string }> {
    const result = await this.findOne(id);
    result.isDeleted = true;
    await this.resultRepository.save(result);
    return { message: `HomeworkResult #${id} deleted successfully` };
  }
}
