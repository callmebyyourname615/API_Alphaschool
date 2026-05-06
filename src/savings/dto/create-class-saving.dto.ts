// dto/create-class-saving.dto.ts
import { SavingTransactionType } from '../savings.entity';

export class CreateClassSavingDto {
  created_by: string;
  class_id: string;
  branch_id: string;
  academic_year_id: string;
  transaction_type: SavingTransactionType;
  amount: number;
  note?: string;
}