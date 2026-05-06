import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { Parent } from '../parents/parent.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateEnrollmentDto } from '../enrollments/dto/create-enrollment.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    @InjectRepository(Parent)
    private readonly parentRepo: Repository<Parent>,

    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
  ) {}

  // ─── Step 1: Create Student ───────────────────────────────────────────
  async createStudent(dto: CreateStudentDto): Promise<Student> {
    const student = this.studentRepo.create({
      branch:     dto.branchId   ? { id: dto.branchId }   : null,
      province:   dto.provinceId ? { id: dto.provinceId } : null,
      district:   dto.districtId ? { id: dto.districtId } : null,

      student_id:         dto.student_id,
      village_id:         dto.village_id,
      profile_image_path: dto.profile_image_path,
      first_name:         dto.first_name,
      last_name:          dto.last_name,
      dob:                new Date(dto.dob),
      gender:             dto.gender,
      nationality:        dto.nationality,
      ethnicity:          dto.ethnicity,
      religion:           dto.religion,
      live_with:          dto.live_with,
      address:            dto.address,
      emergency_contacts: dto.emergency_contacts,

      saving_wallet: 0,
      is_active:     true,
      is_deleted:    false,
    });

    const saved = await this.studentRepo.save(student);

    // ─── Step 2: Link Parents if provided ────────────────────────────
    if (dto.parentIds && dto.parentIds.length > 0) {
      await this.linkParents(saved.id, dto.parentIds);
    }

    return this.findById(saved.id);
  }

  // ─── Step 2: Link Parents ─────────────────────────────────────────────
  async linkParents(studentId: string, parentIds: string[]): Promise<Student> {
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      relations: ['parents'],
    });

    if (!student) throw new NotFoundException('Student not found');

    const parents = await this.parentRepo.findByIds(parentIds);

    if (parents.length !== parentIds.length) {
      throw new NotFoundException('One or more parents not found');
    }

    student.parents = parents;
    return await this.studentRepo.save(student);
  }

  // ─── Step 3: Enroll Student ───────────────────────────────────────────
  async enrollStudent(dto: CreateEnrollmentDto): Promise<Enrollment> {
    const student = await this.studentRepo.findOne({
      where: { id: dto.studentId },
    });

    if (!student) throw new NotFoundException('Student not found');

    const existing = await this.enrollmentRepo.findOne({
      where: {
        studentId:      dto.studentId,
        academicYearId: dto.academicYearId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Student is already enrolled in this academic year',
      );
    }

    const enrollment = this.enrollmentRepo.create({
      student:      { id: dto.studentId },
      academicYear: { id: dto.academicYearId },
      class:        { id: dto.classId },
      branch:       { id: dto.branchId },
      is_active:    dto.is_active ?? true,
    });

    return await this.enrollmentRepo.save(enrollment);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────
  async findById(id: string): Promise<Student> {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: ['branch', 'province', 'district', 'parents', 'enrollments'],
    });

    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async findAll(): Promise<Student[]> {
    return this.studentRepo.find({
      where: { is_deleted: false },
      relations: ['branch', 'province', 'district', 'parents', 'enrollments'],
    });
  }

  // ─── Update Student ───────────────────────────────────────────────────
async updateStudent(id: string, dto: Partial<CreateStudentDto>): Promise<Student> {
  const student = await this.findById(id);

  Object.assign(student, {
    branch:   dto.branchId   ? { id: dto.branchId }   : student.branch,
    province: dto.provinceId ? { id: dto.provinceId } : student.province,
    district: dto.districtId ? { id: dto.districtId } : student.district,

    student_id:         dto.student_id         ?? student.student_id,
    village_id:         dto.village_id         ?? student.village_id,
    profile_image_path: dto.profile_image_path ?? student.profile_image_path,
    first_name:         dto.first_name         ?? student.first_name,
    last_name:          dto.last_name          ?? student.last_name,
    dob:                dto.dob ? new Date(dto.dob) : student.dob,
    gender:             dto.gender             ?? student.gender,
    nationality:        dto.nationality        ?? student.nationality,
    ethnicity:          dto.ethnicity          ?? student.ethnicity,
    religion:           dto.religion           ?? student.religion,
    live_with:          dto.live_with          ?? student.live_with,
    address:            dto.address            ?? student.address,
    emergency_contacts: dto.emergency_contacts ?? student.emergency_contacts,
  });

  const updated = await this.studentRepo.save(student);

  if (dto.parentIds && dto.parentIds.length > 0) {
    await this.linkParents(id, dto.parentIds);
  }

  return this.findById(updated.id);
}

// ─── Delete Student (soft delete) ────────────────────────────────────
async deleteStudent(id: string): Promise<{ message: string }> {
  const student = await this.findById(id);
  student.is_deleted = true;
  student.is_active  = false;
  await this.studentRepo.save(student);
  return { message: `Student ${id} deleted successfully` };
}
}