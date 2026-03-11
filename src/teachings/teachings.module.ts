// src/teachings/teachings.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeachingsService } from './teachings.service';
import { TeachingsController } from './teachings.controller';
import { Teaching } from './teaching.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Teaching])],
  controllers: [TeachingsController],
  providers: [TeachingsService],
  exports: [TeachingsService], // if needed in other modules
})
export class TeachingsModule {}