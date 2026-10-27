import { CaseType } from '../../generated/prisma/client';

export class CreateCaseDto {
  type: CaseType;
  studentId?: string | null;
  enrolmentId?: string | null;
  institutionId?: string | null;
  description: string;
}
