import { CaseStatus } from '../../generated/prisma/client';

export class ResolveCaseDto {
  status: CaseStatus;
  resolutionNotes?: string;
}
