import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parent } from './parent.entity';
import { ParentService } from './parent.service';
import { ParentController } from './parent.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Parent])], // Parent depends on Branch
  providers: [ParentService],
  controllers: [ParentController],
  exports: [ParentService], // Export if used in other modules
})
export class ParentModule {}
