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
import { SubjectsModule } from './subjects/subjects.module';
import { AdminsModule } from './admins/admins.module';
import { RolesModule } from './roles/roles.module';
import { AuthModule } from './auth/auth.module';
import { LaocationModule } from './location/laocation.module';
import { PermissionsModule } from './permission/permissions.module';
import { PermissionModuleModule } from './permission_modules/permission-module.module';
import { ParentModule } from './parents/parent.module';
import { TeachingsModule } from './teachings/teachings.module';
import { LessonsModule } from './lessons/lessons.module';
import { LessonInfosModule } from './lesson-infos/lesson-infos.module';
import { HomeworkModule } from './homeworks/homework.module';
import { TaskModule } from './task/task.module';
import { EventModule } from './event/event.module';
import { EventActivity } from './eventactivity/eventActivity.entity';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

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
        synchronize: true,
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
    SubjectsModule,
    RolesModule,
    AdminsModule,
    LaocationModule,
    PermissionsModule,
    PermissionModuleModule,
    ParentModule,
    TeachingsModule,
    LessonsModule,
    LessonInfosModule,
    HomeworkModule,
    TaskModule,
    EventModule,
    EventActivity,
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
    

  ],
  providers: [],
  
  controllers: [HealthController],
})
export class AppModule {}
