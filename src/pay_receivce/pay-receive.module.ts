import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayReceive } from './pay-receive.entity';
import { PayReceiveController } from './pay-receive.controller';
import { PayReceiveService } from './pay-receive.service';

@Module({
  imports: [TypeOrmModule.forFeature([PayReceive])],
  controllers: [PayReceiveController],
  providers: [PayReceiveService],
  exports: [PayReceiveService],
})
export class PayReceiveModule {}