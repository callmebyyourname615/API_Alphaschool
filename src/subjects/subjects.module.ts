import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { Subject } from './subject.entity';
import { Branch } from '../branches/branch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subject, Branch])],
  controllers: [SubjectsController],
  providers: [SubjectsService],
})
export class SubjectsModule {}
