import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubjectEvaluation } from './subject-evaluation.entity';
import { SubjectEvaluationService } from './subject-evaluation.service';
import { SubjectEvaluationController } from './subject-evaluation.controller';
import { Subject } from '../subjects/subject.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SubjectEvaluation,Subject])],
  providers: [SubjectEvaluationService],
  controllers: [SubjectEvaluationController],
})
export class SubjectEvaluationModule {}