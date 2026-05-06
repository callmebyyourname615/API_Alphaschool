import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { ParticipationScore } from './participation-score.entity';
import { CreateParticipationScoreDto } from './dto/create-participation-score.dto';
import { UpdateParticipationScoreDto } from './dto/update-participation-score.dto';
import { ParticipationList } from '../participantion_list/participation_list.entity';
import { Student } from '../students/student.entity';

/* ================= RESULT TYPE ================= */
interface ScoreResult {
  studentId: string;
  studentName: string;
  participationId: string;
  participationName: string;
  score: number;
}

@Injectable()
export class ParticipationScoreService {
  constructor(
    @InjectRepository(ParticipationScore)
    private readonly repo: Repository<ParticipationScore>,

    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    @InjectRepository(ParticipationList)
    private readonly participationRepo: Repository<ParticipationList>,
  ) {}

  /* ================= HELPER ================= */
  private normalizeDate(date: Date | string): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /* ================= CREATE ================= */
  async create(dto: CreateParticipationScoreDto) {
    const entity = this.repo.create({
      branchId: dto.branchId,
      academicYearId: dto.academicYearId,
      classId: dto.classId,
      addedBy: dto.addedBy,
      date: dto.date ? this.normalizeDate(dto.date) : null,
      scores: dto.scores.map((s) => ({
        studentId: s.studentId,
        participationId: s.id,
        participationName: s.name,
        score: s.score,
      })),
    });

    return this.repo.save(entity);
  }

  /* ================= GET ALL ================= */
  async findAll() {
    return this.repo.find({
      order: { created_at: 'DESC' },
    });
  }

  /* ================= GET BY ID ================= */
  async findOne(id: string) {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('Participation score not found');
    }
    return record;
  }

  /* ================= UPDATE ================= */
  async update(id: string, dto: UpdateParticipationScoreDto) {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('Participation score not found');
    }

    if (dto.branchId) record.branchId = dto.branchId;
    if (dto.academicYearId) record.academicYearId = dto.academicYearId;
    if (dto.classId) record.classId = dto.classId;
    if (dto.addedBy) record.addedBy = dto.addedBy;
    if (dto.date) record.date = this.normalizeDate(dto.date);

    if (dto.scores) {
      record.scores = dto.scores.map((s) => ({
        studentId: s.studentId,
        participationId: s.id,
        participationName: s.name,
        score: s.score,
      }));
    }

    return this.repo.save(record);
  }

  /* ================= DELETE ================= */
  async remove(id: string) {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('Participation score not found');
    }
    await this.repo.remove(record);
    return { message: 'Deleted successfully' };
  }

  /* ================= BULK UPSERT ================= */
  async bulkUpsert(dto: CreateParticipationScoreDto) {
    const targetDate = dto.date ? this.normalizeDate(dto.date) : undefined;

    // หา record ที่มีอยู่แล้ว (class + branch + year + date)
    const existing = await this.repo.findOne({
      where: {
        classId: dto.classId,
        branchId: dto.branchId,
        academicYearId: dto.academicYearId,
        date: targetDate,
      },
    });

    // โหลด participation names จาก DB
    const participationMap: Record<string, string> = {};
    const participationIds = dto.scores.map((s) => s.participationId);
    const participations =
      await this.participationRepo.findByIds(participationIds);
    participations.forEach((p) => {
      participationMap[p.id] = p.name;
    });

    if (existing) {
      // update หรือเพิ่ม score ใหม่
      dto.scores.forEach((s) => {
        const idx = existing.scores.findIndex(
          (sc) =>
            sc.studentId === s.studentId &&
            sc.participationId === s.participationId,
        );

        const nameFromDB =
          participationMap[s.participationId] || 'Unknown Activity';

        if (idx >= 0) {
          // update existing
          existing.scores[idx].score = s.score;
          existing.scores[idx].participationId = s.participationId;
          existing.scores[idx].participationName = nameFromDB;
        } else {
          // เพิ่ม score ใหม่
          existing.scores.push({
            studentId: s.studentId,
            participationId: s.participationId,
            participationName: nameFromDB,
            score: s.score,
          });
        }
      });

      return this.repo.save(existing);
    }

    // ถ้าไม่มี record เดิม สร้างใหม่
    const entity = this.repo.create({
      branchId: dto.branchId,
      academicYearId: dto.academicYearId,
      classId: dto.classId,
      addedBy: dto.addedBy,
      date: targetDate,
      scores: dto.scores.map((s) => ({
        studentId: s.studentId,
        participationId: s.participationId,
        participationName:
          participationMap[s.participationId] || 'Unknown Activity',
        score: s.score,
      })),
    });

    return this.repo.save(entity);
  }

  /* ================= GET SCORES BY FILTER ================= */
  async getScoresByFilter(filter: {
    branchId: string;
    academicYearId: string;
    classId: string;
    date: Date;
  }): Promise<ScoreResult[]> {
    // ครอบทั้งวัน
    const startOfDay = new Date(filter.date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(filter.date);
    endOfDay.setHours(23, 59, 59, 999);

    const scoreRecord = await this.repo.findOne({
      where: {
        branchId: filter.branchId,
        academicYearId: filter.academicYearId,
        classId: filter.classId,
        date: Between(startOfDay, endOfDay), // ✅
      },
    });
    console.log('scoreRecord', scoreRecord);

    const students = await this.studentRepo.find({
      where: { enrollments: { class: { id: filter.classId } } },
      select: ['id', 'first_name', 'last_name'],
      order: { first_name: 'ASC', last_name: 'ASC' },
    });

    const activities = await this.participationRepo.find({
      select: ['id', 'name'],
    });

    const result: ScoreResult[] = [];

    for (const student of students) {
      for (const activity of activities) {
        const existing = scoreRecord?.scores?.find(
          (s) =>
            s.studentId === student.id && s.participationId === activity.id,
        );

        result.push({
          studentId: student.id,
          studentName:
            `${student.first_name || ''} ${student.last_name || ''}`.trim(),
          participationId: activity.id,
          participationName: activity.name || 'Unknown',
          score: existing?.score ?? 0,
        });
      }
    }

    return result;
  }
}
