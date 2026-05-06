// dto/create-students-saving-session.dto.ts
import { SavingTransactionType } from '../savings.entity';

export class StudentSavingEntryDto {
  student_id: string;
  amount: number;
  note?: string;
}

export class CreateStudentsSavingSessionDto {
  created_by: string;
  class_id: string;
  transaction_type: SavingTransactionType;
  shared_note?: string;  // fallback note if student has no individual note
  students: StudentSavingEntryDto[];
}