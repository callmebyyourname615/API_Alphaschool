import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';
import { Saving } from './savings.entity';
import { CreateSavingDto } from './dto/create-saving.dto';
import { UpdateSavingDto } from './dto/update-saving.dto';
import { Branch } from '../branches/branch.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';

@Injectable()
export class SavingService {
  constructor(
    @InjectRepository(Saving)
    private savingRepo: Repository<Saving>,

    @InjectRepository(Branch)
    private branchRepo: Repository<Branch>,

    @InjectRepository(AcademicYear)
    private academicYearRepo: Repository<AcademicYear>,

    @InjectRepository(Student)
    private studentRepo: Repository<Student>,

    @InjectRepository(Class)
    private classRepo: Repository<Class>,
  ) {}

  // Create
  async createSaving(dto: CreateSavingDto) {
    const saving = new Saving();

    saving.type = dto.type;
    saving.transaction_type = dto.transactionType;
    saving.status = dto.status;
    saving.amount = dto.amount;
    saving.opening_balance = dto.openingBalance || 0;
    saving.closing_balance = dto.closingBalance ?? dto.amount;

    saving.lock_time = dto.lockTime;
    saving.complete_time = dto.completeTime;
    saving.cancel_time = dto.cancelTime;

    saving.branch = await this.branchRepo.findOneByOrFail({ id: dto.branchId });
    saving.academic_year = await this.academicYearRepo.findOneByOrFail({
      id: dto.academicYearId,
    });
    saving.student = await this.studentRepo.findOneByOrFail({
      id: dto.studentId,
    });
    if (dto.classId)
      saving.class = await this.classRepo.findOneByOrFail({ id: dto.classId });

    return this.savingRepo.save(saving);
  }

  async updateSaving(id: string, dto: UpdateSavingDto) {
    const saving = await this.savingRepo.findOne({ where: { id } });
    if (!saving) throw new Error('Saving not found');

    Object.assign(saving, {
      type: dto.type,
      transaction_type: dto.transactionType,
      status: dto.status,
      amount: dto.amount,
      opening_balance: dto.openingBalance,
      closing_balance: dto.closingBalance,
      lock_time: dto.lockTime,
      complete_time: dto.completeTime,
      cancel_time: dto.cancelTime,
      is_active: dto.isActive,
      is_deleted: dto.isDeleted,
    });

    if (dto.branchId)
      saving.branch = await this.branchRepo.findOneByOrFail({
        id: dto.branchId,
      });
    if (dto.academicYearId)
      saving.academic_year = await this.academicYearRepo.findOneByOrFail({
        id: dto.academicYearId,
      });
    if (dto.studentId)
      saving.student = await this.studentRepo.findOneByOrFail({
        id: dto.studentId,
      });
    if (dto.classId)
      saving.class = await this.classRepo.findOneByOrFail({ id: dto.classId });

    return this.savingRepo.save(saving);
  }

  // Get all
  getAllSavings() {
    return this.savingRepo.find({
      relations: ['branch', 'academic_year', 'student', 'class'],
    });
  }

  // Get by ID
  getSavingById(id: string) {
    return this.savingRepo.findOne({
      where: { id },
      relations: ['branch', 'academic_year', 'student', 'class'],
    });
  }

  // Update

  // Delete
  async deleteSaving(id: string) {
    const saving = await this.savingRepo.findOne({ where: { id } });
    if (!saving) throw new Error('Saving not found');
    return this.savingRepo.remove(saving);
  }

  // Get all savings for a specific student
  getSavingsByStudentId(studentId: string) {
    return this.savingRepo.find({
      where: { student: { id: studentId } },
      relations: ['branch', 'academic_year', 'student', 'class'],
    });
  }
}
