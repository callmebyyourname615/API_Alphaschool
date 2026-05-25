// ============================================================
// FILE 7: src/appointment/dto/respond-appointment.dto.ts
// ============================================================
import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  Matches,
} from 'class-validator';
import { ParticipantStatus } from '../appointment.enum';

export class RespondAppointmentDto {
  @IsEnum(ParticipantStatus)
  status: ParticipantStatus;

  @IsOptional()
  @IsString()
  response_note?: string;

  @IsOptional()
  @IsDateString()
  proposed_date?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'proposed_from_time must be HH:MM or HH:MM:SS' })
  proposed_from_time?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'proposed_to_time must be HH:MM or HH:MM:SS' })
  proposed_to_time?: string;
}