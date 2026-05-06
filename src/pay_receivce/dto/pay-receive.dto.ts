import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsEnum,
  IsString,
  Min,
} from 'class-validator';
import { PayReceiveStatus } from '../pay-receive.entity';

export class CreatePayReceiveDto {
  @IsUUID()
  saving_id: string; // Saving record teacher is paying from

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdatePayReceiveDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdatePayReceiveStatusDto {
  @IsEnum(PayReceiveStatus)
  status: PayReceiveStatus;

  @IsOptional()
  @IsUUID()
  received_by?: string; // Admin UUID who confirms receipt
}