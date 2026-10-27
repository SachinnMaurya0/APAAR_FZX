import { EnrolmentStatus, SeatType } from '../../generated/prisma/client';

export class UpdateEnrolmentDto {
  status?: EnrolmentStatus;
  seatType?: SeatType;
  isNri?: boolean;
  isOci?: boolean;
  isForeignNational?: boolean;
  startDate?: string;
  endDate?: string | null;
  previousEnrolmentId?: string | null;
}
