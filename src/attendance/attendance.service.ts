import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Attendance, AttendanceType, ScanMethod } from './attendance.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { Student } from '../students/student.entity';
import { Admin } from '../admins/admin.entity';
import { ScanQrDto } from './dto/scan-qr.dto';
import { GetStudentsByDateRangeDto } from './dto/get-students-by-date-range.dto';

@Injectable()
export class AttendancesService {
  private readonly pendingAbsentReason = 'No QR scan yet';
  private readonly pendingAbsentRemark = 'Default absent';
  private readonly autoAbsentReason = 'No QR scan before 08:30';
  private readonly autoAbsentRemark = 'Auto absent';

  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,

    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,

    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  private getLocalDate(date = new Date()): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Vientiane',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;

    return `${year}-${month}-${day}`;
  }

  private getLocalTime(date = new Date()): string {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Vientiane',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const hour = parts.find((p) => p.type === 'hour')?.value;
    const minute = parts.find((p) => p.type === 'minute')?.value;
    const second = parts.find((p) => p.type === 'second')?.value;

    return `${hour}:${minute}:${second}`;
  }

  private getLocalWeekday(date = new Date()): string {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Vientiane',
      weekday: 'short',
    }).format(date);
  }

  private toSeconds(time: string): number {
    const [hour, minute, second] = time.split(':').map(Number);
    return hour * 3600 + minute * 60 + second;
  }

  private isWeekday(date = new Date()): boolean {
    const weekday = this.getLocalWeekday(date);
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(weekday);
  }

  private isMorningCheckInWindow(time: string): boolean {
    const value = this.toSeconds(time);
    return (
      value >= this.toSeconds('07:00:00') && value <= this.toSeconds('08:30:00')
    );
  }

  private isAfternoonCheckOutWindow(time: string): boolean {
    const value = this.toSeconds(time);
    return (
      value >= this.toSeconds('16:00:00') && value <= this.toSeconds('17:30:00')
    );
  }

  private hasMorningDeadlinePassed(time: string): boolean {
    return this.toSeconds(time) >= this.toSeconds('08:30:00');
  }

  private getDefaultAbsentStatus(date = new Date()) {
    if (this.hasMorningDeadlinePassed(this.getLocalTime(date))) {
      return {
        type: AttendanceType.ABSENT,
        scan_method: ScanMethod.MANUAL,
        reason: this.autoAbsentReason,
        remark: this.autoAbsentRemark,
      };
    }

    return {
      type: AttendanceType.ABSENT,
      scan_method: ScanMethod.MANUAL,
      reason: this.pendingAbsentReason,
      remark: this.pendingAbsentRemark,
    };
  }

  private async seedDailyAbsentees(date = new Date()): Promise<{
    date: string;
    created: number;
  }> {
    const today = this.getLocalDate(date);
    const defaultAbsentStatus = this.getDefaultAbsentStatus(date);

    const allStudents = await this.studentRepository.find({
      where: { is_deleted: false },
      select: {
        id: true,
      },
    });

    if (!allStudents.length) {
      return {
        date: today,
        created: 0,
      };
    }

    const existingAttendances = await this.attendanceRepository.find({
      where: { attendance_date: today },
      select: {
        student_id: true,
      },
    });

    const existingStudentIds = new Set(
      existingAttendances.map((item) => item.student_id),
    );

    const absentRows = allStudents
      .filter((student) => !existingStudentIds.has(student.id))
      .map((student) => ({
        student_id: student.id,
        attendance_date: today,
        ...defaultAbsentStatus,
      }));

    if (!absentRows.length) {
      return {
        date: today,
        created: 0,
      };
    }

    await this.attendanceRepository
      .createQueryBuilder()
      .insert()
      .into(Attendance)
      .values(absentRows)
      .orIgnore()
      .execute();

    return {
      date: today,
      created: absentRows.length,
    };
  }

  private async finalizeDailyAbsentees(date = new Date()): Promise<{
    date: string;
    updated: number;
  }> {
    const today = this.getLocalDate(date);

    if (!this.hasMorningDeadlinePassed(this.getLocalTime(date))) {
      return {
        date: today,
        updated: 0,
      };
    }

    const todayAbsences = await this.attendanceRepository.find({
      where: {
        attendance_date: today,
        type: AttendanceType.ABSENT,
      },
    });

    const staleAbsences = todayAbsences.filter(
      (attendance) =>
        !attendance.check_in &&
        (attendance.scan_method !== ScanMethod.MANUAL ||
          attendance.reason !== this.autoAbsentReason ||
          attendance.remark !== this.autoAbsentRemark),
    );

    if (!staleAbsences.length) {
      return {
        date: today,
        updated: 0,
      };
    }

    staleAbsences.forEach((attendance) => {
      attendance.scan_method = ScanMethod.MANUAL;
      attendance.reason = this.autoAbsentReason;
      attendance.remark = this.autoAbsentRemark;
    });

    await this.attendanceRepository.save(staleAbsences);

    return {
      date: today,
      updated: staleAbsences.length,
    };
  }

  private async ensureDailyAbsenteesIfNeeded(): Promise<void> {
    const now = new Date();

    await this.seedDailyAbsentees(now);
    await this.finalizeDailyAbsentees(now);
  }

  private mapStudentStatus(student: any, attendance: any, today: string) {
    const defaultAbsentStatus = this.getDefaultAbsentStatus();

    return {
      student,
      attendance_id: attendance?.id ?? null,
      attendance_date: today,
      type: attendance?.type ?? defaultAbsentStatus.type,
      scan_method: attendance?.scan_method ?? defaultAbsentStatus.scan_method,
      check_in: attendance?.check_in ?? null,
      check_out: attendance?.check_out ?? null,
      reason: attendance?.reason ?? defaultAbsentStatus.reason,
      remark: attendance?.remark ?? defaultAbsentStatus.remark,
      marked_by_admin_id: attendance?.marked_by_admin_id ?? null,
    };
  }

  async create(createAttendanceDto: CreateAttendanceDto): Promise<Attendance> {
    const {
      student_id,
      marked_by_admin_id,
      attendance_date,
      type,
      scan_method,
      reason,
      remark,
      check_in,
      check_out,
    } = createAttendanceDto;

    const student = await this.studentRepository.findOne({
      where: { id: student_id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    let admin: Admin | null = null;

    if (marked_by_admin_id) {
      admin = await this.adminRepository.findOne({
        where: { id: marked_by_admin_id },
      });

      if (!admin) {
        throw new NotFoundException('Admin not found');
      }
    }

    const existing = await this.attendanceRepository.findOne({
      where: {
        student_id,
        attendance_date,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Attendance for this student and date already exists',
      );
    }

    const attendance = this.attendanceRepository.create({
      student,
      student_id,
      marked_by_admin: admin,
      marked_by_admin_id: admin?.id ?? null,
      attendance_date,
      type: type ?? AttendanceType.PRESENT,
      scan_method: scan_method ?? ScanMethod.QR,
      reason,
      remark,
      check_in,
      check_out,
    });

    return await this.attendanceRepository.save(attendance);
  }

  async scanQr(scanQrDto: ScanQrDto): Promise<Attendance> {
    const { teacher_id, student_id } = scanQrDto;

    const student = await this.studentRepository.findOne({
      where: { id: student_id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const admin = await this.adminRepository.findOne({
      where: { id: teacher_id },
    });

    if (!admin) {
      throw new NotFoundException('Teacher/Admin not found');
    }

    const now = new Date();
    const today = this.getLocalDate(now);
    const nowTime = this.getLocalTime(now);

    if (!this.isWeekday(now)) {
      throw new BadRequestException('QR scan is only allowed Monday to Friday');
    }

    await this.ensureDailyAbsenteesIfNeeded();

    const existing = await this.attendanceRepository.findOne({
      where: {
        student_id,
        attendance_date: today,
      },
      relations: {
        student: true,
        marked_by_admin: true,
      },
    });

    if (this.isMorningCheckInWindow(nowTime)) {
      if (!existing) {
        const attendance = this.attendanceRepository.create({
          student,
          student_id,
          marked_by_admin: admin,
          marked_by_admin_id: admin.id,
          attendance_date: today,
          type: AttendanceType.PRESENT,
          scan_method: ScanMethod.QR,
          check_in: nowTime,
          remark: 'Check-in by QR',
        });

        return await this.attendanceRepository.save(attendance);
      }

      if (existing.check_in) {
        throw new BadRequestException('Student already checked in today');
      }

      existing.type = AttendanceType.PRESENT;
      existing.scan_method = ScanMethod.QR;
      existing.marked_by_admin = admin;
      existing.marked_by_admin_id = admin.id;
      existing.check_in = nowTime;
      existing.reason = undefined;
      existing.remark = 'Check-in by QR';

      return await this.attendanceRepository.save(existing);
    }

    if (this.isAfternoonCheckOutWindow(nowTime)) {
      if (!existing) {
        throw new BadRequestException(
          'Student has no attendance record for today',
        );
      }

      if (!existing.check_in) {
        throw new BadRequestException(
          'Student has not checked in yet, cannot check out',
        );
      }

      if (existing.check_out) {
        throw new BadRequestException('Student already checked out today');
      }

      existing.type = AttendanceType.PRESENT;
      existing.scan_method = ScanMethod.QR;
      existing.marked_by_admin = admin;
      existing.marked_by_admin_id = admin.id;
      existing.check_out = nowTime;
      existing.reason = undefined;
      existing.remark = 'Check-out by QR';

      return await this.attendanceRepository.save(existing);
    }

    throw new BadRequestException(
      'Scan time is outside allowed windows: check-in 07:00-08:30, check-out 16:00-17:30',
    );
  }

  async markDailyAbsentees(): Promise<{
    message: string;
    date: string;
    created: number;
  }> {
    const now = new Date();
    const today = this.getLocalDate(now);

    const { created } = await this.seedDailyAbsentees(now);
    const { updated } = await this.finalizeDailyAbsentees(now);

    if (!this.hasMorningDeadlinePassed(this.getLocalTime(now))) {
      return {
        message:
          created > 0
            ? 'Daily attendance reset completed'
            : 'Daily attendance already initialized',
        date: today,
        created,
      };
    }

    if (!created && !updated) {
      return {
        message: 'All students already have attendance records',
        date: today,
        created: 0,
      };
    }

    return {
      message: 'Auto absent completed',
      date: today,
      created,
    };
  }

  @Cron('0 0 0 * * *', { timeZone: 'Asia/Vientiane' })
  async handleDailyAttendanceReset() {
    await this.seedDailyAbsentees();
  }

  @Cron('0 30 8 * * *', { timeZone: 'Asia/Vientiane' })
  async handleDailyAutoAbsent() {
    await this.markDailyAbsentees();
  }

  async runAutoAbsentNow(): Promise<{
    message: string;
    date: string;
    created: number;
  }> {
    return await this.markDailyAbsentees();
  }

  async findAll(): Promise<Attendance[]> {
    await this.ensureDailyAbsenteesIfNeeded();

    return await this.attendanceRepository.find({
      relations: {
        student: true,
        marked_by_admin: true,
      },
      order: {
        attendance_date: 'DESC',
        created_at: 'DESC',
      },
    });
  }

  async getTodayStudentStatuses() {
    await this.ensureDailyAbsenteesIfNeeded();

    const today = this.getLocalDate();

    const students = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect(
        'student.attendances',
        'attendance',
        'attendance.attendance_date = :today',
        { today },
      )
      .leftJoinAndSelect('attendance.marked_by_admin', 'marked_by_admin')
      .orderBy('student.id', 'ASC')
      .getMany();

    return students.map((student: any) => {
      const attendance = student.attendances?.[0];
      return this.mapStudentStatus(student, attendance, today);
    });
  }

  async getStudentsByClass(classId: string) {
    await this.ensureDailyAbsenteesIfNeeded();

    const today = this.getLocalDate();

    const students = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect(
        'student.attendances',
        'attendance',
        'attendance.attendance_date = :today',
        { today },
      )
      .leftJoinAndSelect('attendance.marked_by_admin', 'marked_by_admin')
      // เปลี่ยน student.class_id ถ้าฟิลด์จริงของคุณชื่ออื่น
      .where('student.class_id = :classId', { classId })
      .orderBy('student.id', 'ASC')
      .getMany();

    return students.map((student: any) => {
      const attendance = student.attendances?.[0];
      return this.mapStudentStatus(student, attendance, today);
    });
  }

  async findOne(id: string): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
      relations: {
        student: true,
        marked_by_admin: true,
      },
    });

    if (!attendance) {
      throw new NotFoundException('Attendance not found');
    }

    return attendance;
  }

  async update(
    id: string,
    updateAttendanceDto: UpdateAttendanceDto,
  ): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
    });

    if (!attendance) {
      throw new NotFoundException('Attendance not found');
    }

    if (updateAttendanceDto.student_id) {
      const student = await this.studentRepository.findOne({
        where: { id: updateAttendanceDto.student_id },
      });

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      attendance.student = student;
      attendance.student_id = student.id;
    }

    if (updateAttendanceDto.marked_by_admin_id !== undefined) {
      if (updateAttendanceDto.marked_by_admin_id === null) {
        attendance.marked_by_admin = null;
        attendance.marked_by_admin_id = null;
      } else {
        const admin = await this.adminRepository.findOne({
          where: { id: updateAttendanceDto.marked_by_admin_id },
        });

        if (!admin) {
          throw new NotFoundException('Admin not found');
        }

        attendance.marked_by_admin = admin;
        attendance.marked_by_admin_id = admin.id;
      }
    }

    if (updateAttendanceDto.student_id || updateAttendanceDto.attendance_date) {
      const nextStudentId =
        updateAttendanceDto.student_id ?? attendance.student_id;
      const nextDate =
        updateAttendanceDto.attendance_date ?? attendance.attendance_date;

      const duplicate = await this.attendanceRepository.findOne({
        where: {
          student_id: nextStudentId,
          attendance_date: nextDate,
        },
      });

      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException(
          'Attendance for this student and date already exists',
        );
      }
    }

    if (updateAttendanceDto.attendance_date !== undefined) {
      attendance.attendance_date = updateAttendanceDto.attendance_date;
    }

    if (updateAttendanceDto.type !== undefined) {
      attendance.type = updateAttendanceDto.type;
    }

    if (updateAttendanceDto.scan_method !== undefined) {
      attendance.scan_method = updateAttendanceDto.scan_method;
    }

    if (updateAttendanceDto.reason !== undefined) {
      attendance.reason = updateAttendanceDto.reason;
    }

    if (updateAttendanceDto.remark !== undefined) {
      attendance.remark = updateAttendanceDto.remark;
    }

    if (updateAttendanceDto.check_in !== undefined) {
      attendance.check_in = updateAttendanceDto.check_in;
    }

    if (updateAttendanceDto.check_out !== undefined) {
      attendance.check_out = updateAttendanceDto.check_out;
    }

    return await this.attendanceRepository.save(attendance);
  }

  async remove(id: string): Promise<{ message: string }> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
    });

    if (!attendance) {
      throw new NotFoundException('Attendance not found');
    }

    await this.attendanceRepository.remove(attendance);

    return {
      message: 'Attendance deleted successfully',
    };
  }

  async getAllStudentsByClass(classId: string) {
    await this.ensureDailyAbsenteesIfNeeded();

    const today = this.getLocalDate();
    const defaultAbsentStatus = this.getDefaultAbsentStatus();

    const students = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.class', 'class') // ใช้ 'class' ไม่ใช่ 'classId'
      .leftJoinAndSelect(
        'student.attendances',
        'attendance',
        'attendance.attendance_date = :today',
        { today },
      )
      .leftJoinAndSelect('attendance.marked_by_admin', 'marked_by_admin')
      .where('class.id = :classId', { classId }) // classId เป็น UUID string จาก controller
      .orderBy('student.student_id', 'ASC')
      .getMany();
    return {
      class_id: classId,
      attendance_date: today,
      total: students.length,
      students: students.map((student: any) => {
        const attendance = student.attendances?.[0];

        return {
          id: student.id,
          student_id: student.student_id,
          first_name: student.first_name,
          last_name: student.last_name,
          gender: student.gender,
          profile_image_path: student.profile_image_path,
          class: student.classId,
          attendance: {
            attendance_id: attendance?.id ?? null,
            type: attendance?.type ?? defaultAbsentStatus.type,
            scan_method:
              attendance?.scan_method ?? defaultAbsentStatus.scan_method,
            check_in: attendance?.check_in ?? null,
            check_out: attendance?.check_out ?? null,
            reason: attendance?.reason ?? defaultAbsentStatus.reason,
            remark: attendance?.remark ?? defaultAbsentStatus.remark,
            marked_by_admin_id: attendance?.marked_by_admin_id ?? null,
          },
        };
      }),
    };
  }

  private getDateStringsBetween(startDate: string, endDate: string): string[] {
    const dates: string[] = [];

    const start = new Date(`${startDate}T12:00:00.000Z`);
    const end = new Date(`${endDate}T12:00:00.000Z`);

    const current = new Date(start);

    while (current <= end) {
      const y = current.getUTCFullYear();
      const m = String(current.getUTCMonth() + 1).padStart(2, '0');
      const d = String(current.getUTCDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);

      current.setUTCDate(current.getUTCDate() + 1);
    }

    return dates;
  }

  private isWeekdayDate(dateString: string): boolean {
    const date = new Date(`${dateString}T12:00:00.000Z`);
    const day = date.getUTCDay(); // 0=Sun, 6=Sat
    return day >= 1 && day <= 5;
  }

  async getStudentsByDateRange(body: GetStudentsByDateRangeDto) {
    await this.ensureDailyAbsenteesIfNeeded();

    const { class_id, start_date, end_date } = body;

    if (start_date > end_date) {
      throw new BadRequestException(
        'start_date must be less than or equal to end_date',
      );
    }

    const allDates = this.getDateStringsBetween(start_date, end_date);
    const schoolDates = allDates.filter((date) => this.isWeekdayDate(date));

    const qb = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.class', 'class') // ← ใช้ class
      .leftJoinAndSelect(
        'student.attendances',
        'attendance',
        'attendance.attendance_date BETWEEN :startDate AND :endDate',
        {
          startDate: start_date,
          endDate: end_date,
        },
      )
      .leftJoinAndSelect('attendance.marked_by_admin', 'marked_by_admin')
      .orderBy('student.student_id', 'ASC')
      .addOrderBy('attendance.attendance_date', 'ASC');

    if (class_id) {
      qb.where('class.id = :classId', { classId: class_id });
    }
    const students = await qb.getMany();

    return {
      class_id: class_id ?? null,
      start_date,
      end_date,
      total_students: students.length,
      total_days: schoolDates.length,
      students: students.map((student) => {
        const attendanceMap = new Map<string, Attendance>(
          ((student.attendances ?? []) as Attendance[]).map(
            (item: Attendance) => [item.attendance_date, item],
          ),
        );

        const attendances = schoolDates.map((date) => {
          const attendance = attendanceMap.get(date);

          if (attendance) {
            return {
              attendance_id: attendance.id,
              attendance_date: attendance.attendance_date,
              type: attendance.type,
              scan_method: attendance.scan_method,
              check_in: attendance.check_in ?? null,
              check_out: attendance.check_out ?? null,
              reason: attendance.reason ?? null,
              remark: attendance.remark ?? null,
              marked_by_admin_id: attendance.marked_by_admin_id ?? null,
              is_virtual: false,
            };
          }

          return {
            attendance_id: null,
            attendance_date: date,
            type: AttendanceType.ABSENT,
            scan_method: null,
            check_in: null,
            check_out: null,
            reason: 'No QR scan',
            remark: 'Auto absent (virtual)',
            marked_by_admin_id: null,
            is_virtual: true,
          };
        });

        const present_count = attendances.filter(
          (item) => item.type === AttendanceType.PRESENT,
        ).length;

        const absent_count = attendances.filter(
          (item) => item.type === AttendanceType.ABSENT,
        ).length;

        return {
          id: student.id,
          student_id: student.student_id,
          first_name: student.first_name,
          last_name: student.last_name,
          gender: student.gender,
          profile_image_path: student.profile_image_path,
          class: student.enrollments?.[0]?.class ?? null,
          summary: {
            present_count,
            absent_count,
          },
          attendances,
        };
      }),
    };
  }
}
