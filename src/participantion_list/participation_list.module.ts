import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipationListService } from './participation_list.service';
import { ParticipationListController } from './participation_list.controller';
import { ParticipationList } from './participation_list.entity';
import { Class } from '../classes/class.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([ParticipationList, Class]),                 // ← must have this import
  ],
  providers: [ParticipationListService],
  controllers: [ParticipationListController], // if exists
})
export class ParticipationListModule {}
