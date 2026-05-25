import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { HealthController } from './health/health.controller';
import { BranchModule } from './branches/branch.module';
import { LoggerModule } from './common/logger.module';
import { AcademicYearModule } from './academic_years/academic-year.module';
import { LevelsModule } from './levels/levels.module';
import { YearLevelsModule } from './year_levels/year-levels.module';
import { ClassesModule } from './classes/classes.module';
import { SubjectModule } from './subjects/subjects.module';
import { AdminsModule } from './admins/admins.module';
import { RolesModule } from './roles/roles.module';
import { AuthModule } from './auth/auth.module';
import { LaocationModule } from './location/laocation.module';
import { PermissionsModule } from './permission/permissions.module';
import { PermissionModuleModule } from './permission_modules/permission-module.module';
import { ParentModule } from './parents/parent.module';
import { TeachingModule } from './teachings/teachings.module';
import { TaskModule } from './task/task.module';
import { EventModule } from './event/event.module';
import { EventActivityModule } from './eventactivity/eventActivity.module';
import { FileModule } from './file/file.module';
import { ParticipationScoreModule } from './participantion_score/participation-score.module';
import { ParticipationListModule } from './participantion_list/participation_list.module';
import { AttendanceModule } from './attendance/attendance.module';
import { SavingsModule } from './savings/saving.module';
import { StudentModule } from './students/student.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AnnouncementsModule } from './announcements/announcements.module';
import { EvaluationModule } from './evaluations/evaluation.module';
import { AppointmentModule } from './appointment/appointment.module';
import { AppointmentPersonModule } from './appointment-person/appointment-person.module';
import { CommentsModule } from './comments/comments.module';
import { ExaminationModule } from './examination/examination.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SubjectTypeModule } from './subject_types/subject-type.module';
import { CurriculumModule } from './curriculums/curriculum.module';
import { SubjectEvaluationModule } from './subject_evaluations/subject-evaluation.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TeachLearningModule } from './teach_learning/teach-learning.module';
import { TeacherHomeworkModule } from './teacher-homework/teacher-homework.module';
import { LessonModule } from './lesson/lesson.module';
import { EnrollmentModule } from './enrollments/enrollment.module';
import { ExaminationResultModule } from './examination_results/examination-result.module';
import { TimetableModule } from './timetables/timetable.module';
import { PayReceiveModule } from './pay_receivce/pay-receive.module';
import { LeaveReasonModule } from './leave_reason/leave-reason.module';
import { AttendanceRuleModule } from './attendance/attendance-rule.module';
import { HomeworkResultModule } from './homework-result/homework-result.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ScheduleModule.forRoot(),
    
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT') ?? '5432'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
        connectTimeoutMS: 5000,
        extra: {
          connectionTimeoutMillis: 5000,
          query_timeout: 30000,
        },
      }),
    }),


    LoggerModule,
    HealthModule,
    AuthModule,
    BranchModule,
    AcademicYearModule,
    LevelsModule,
    YearLevelsModule,
    ClassesModule,
    SubjectModule,
    RolesModule,
    AdminsModule,
    LaocationModule,
    PermissionsModule,
    PermissionModuleModule,
    ParentModule,
    TeachingModule,
    TaskModule,
    EventModule,
    EventActivityModule,
    FileModule,
    ParticipationListModule,
    ParticipationScoreModule,
    SavingsModule,
    AttendanceModule,
    StudentModule,
    AnnouncementsModule,
    EvaluationModule,
    AppointmentModule,
    AppointmentPersonModule,
    CommentsModule,
    ExaminationModule,
    NotificationsModule,
    SubjectTypeModule,
    CurriculumModule,
    SubjectEvaluationModule,
    TeachLearningModule,
    TeacherHomeworkModule,
    LessonModule,
    EnrollmentModule,
    ExaminationResultModule,
    TimetableModule,
    PayReceiveModule,
    LeaveReasonModule,
    AttendanceRuleModule,
    HomeworkResultModule,
  ],
  providers: [],
  
  controllers: [HealthController],
})
export class AppModule {}
