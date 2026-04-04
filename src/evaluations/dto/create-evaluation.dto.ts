export class CreateEvaluationDto {
  studentId: string;          // นักเรียน
  adminId: string;            // ครู/ผู้สอน
  subjectEvaluationId?: string; // optional เชื่อมกับหัวข้อ evaluation
  score: number;              // คะแนน
}