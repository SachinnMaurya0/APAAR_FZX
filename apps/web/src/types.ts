export type Role =
  | 'AICTE_ADMIN'
  | 'INSTITUTION_ADMIN'
  | 'INSTITUTION_OPERATOR'
  | 'STUDENT'
  | 'VERIFIER';

export interface Institution {
  id: string;
  aicteCode: string;
  name: string;
  state: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  institutionId: string | null;
  institution?: Institution | null;
  isActive: boolean;
}

export interface Counts {
  regular: number;
  lateral: number;
  total: number;
}

export interface ProgrammeOverview {
  programmeId: string;
  programmeName: string;
  academicYear: number;
  shift: number;
  institution: Institution;
  approvedIntake: number;
  lateralIntake: number;
  asOf: string;
  confirmed: Counts;
  pending: Counts;
  supernumerary: number;
  overIntake: boolean;
}

export const roleHome: Record<Role, string> = {
  AICTE_ADMIN: '/aicte',
  INSTITUTION_ADMIN: '/institution',
  INSTITUTION_OPERATOR: '/institution',
  STUDENT: '/portal',
  VERIFIER: '/portal',
};

export const roleLabel: Record<Role, string> = {
  AICTE_ADMIN: 'AICTE Admin',
  INSTITUTION_ADMIN: 'Institution Admin',
  INSTITUTION_OPERATOR: 'Institution Operator',
  STUDENT: 'Student',
  VERIFIER: 'Verifier',
};

export interface StudentRecord {
  apaarId: string | null;
  fullName: string;
  dateOfBirth: string;
  enrolments: {
    status: string;
    seatType: string;
    startDate: string;
    endDate: string | null;
    programme: {
      name: string;
      academicYear: number;
      shift: number;
      institution: { name: string; aicteCode: string; state: string };
    };
  }[];
}

export type CaseStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'ESCALATED' | 'REJECTED';

export interface CaseItem {
  id: string;
  type: 'OVERLAP' | 'INTAKE_EXCEEDED' | 'MISSING_APAAR' | 'OTHER';
  status: CaseStatus;
  description: string;
  resolutionNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
  institution: Institution | null;
  enrolment: {
    student: { fullName: string; apaarId: string | null };
    programme: { name: string; academicYear: number; institution: Institution };
  } | null;
}

export interface Programme {
  id: string;
  name: string;
  academicYear: number;
  shift: number;
  approvedIntake: number;
  lateralIntake: number;
  institution: Institution;
}

export interface EnrolmentRow {
  id: string;
  status: string;
  seatType: string;
  isNri: boolean;
  isOci: boolean;
  isForeignNational: boolean;
  startDate: string;
  endDate: string | null;
  student: { id: string; apaarId: string | null; fullName: string; dateOfBirth: string };
  programme: Programme;
}

export const enrolmentStatuses = [
  'ADMITTED',
  'ACTIVE',
  'ON_BREAK',
  'TRANSFERRED_OUT',
  'WITHDRAWN',
  'CANCELLED',
  'COMPLETED',
] as const;

export const seatTypes = ['REGULAR', 'SUPERNUMERARY', 'LATERAL_ENTRY'] as const;
