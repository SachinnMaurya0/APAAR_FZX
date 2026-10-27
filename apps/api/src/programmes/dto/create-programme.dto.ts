export class CreateProgrammeDto {
  institutionId?: string;
  name: string;
  academicYear: number;
  shift?: number;
  approvedIntake: number;
  lateralIntake?: number;
}