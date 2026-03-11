import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeworkService } from './homework.service';
import { HomeworkController } from './homework.controller';
import { Homework } from './homework.entity';
import { Task } from '../task/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Homework, Task])],
  controllers: [HomeworkController],
  providers: [HomeworkService],
})
export class HomeworkModule {}
