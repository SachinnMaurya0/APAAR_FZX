import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrolmentStatus, SeatType, UserRole } from '../generated/prisma/client';

function isActiveOnDate(enrolment: any, asOf: Date): boolean {
  const start = new Date(enrolment.startDate);
  if (start > asOf) return false;
  if (enrolment.endDate) {
    const end = new Date(enrolment.endDate);
    if (end <= asOf) return false; // half-open: exclude end date
  }
  return true;
}

@Injectable()
export class DashboardsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(user: any, asOfStr?: string) {
    const asOf = asOfStr ? new Date(asOfStr) : new Date();

    let programmes: any[];
    if (user.role === UserRole.AICTE_ADMIN) {
      programmes = await this.prisma.programme.findMany({
        include: {
          institution: true,
          enrolments: true,
        },
        orderBy: [{ institutionId: 'asc' }, { academicYear: 'desc' }, { name: 'asc' }],
      });
    } else {
      if (!user.institutionId) {
        throw new ForbiddenException('User is not associated with an institution');
      }
      programmes = await this.prisma.programme.findMany({
        where: { institutionId: user.institutionId },
        include: {
          institution: true,
          enrolments: true,
        },
        orderBy: [{ academicYear: 'desc' }, { name: 'asc' }],
      });
    }

    const result = programmes.map((programme) => {
      const enrolments = programme.enrolments || [];

      let confirmedRegular = 0;
      let confirmedLateral = 0;
      let pendingRegular = 0;
      let pendingLateral = 0;
      let supernumerary = 0;

      for (const e of enrolments) {
        const status = e.status as EnrolmentStatus;
        const seatType = e.seatType as SeatType;

        if (seatType === SeatType.SUPERNUMERARY) {
          if ((status === EnrolmentStatus.ACTIVE || status === EnrolmentStatus.ON_BREAK) && isActiveOnDate(e, asOf)) {
            supernumerary++;
          }
          continue;
        }

        if (seatType === SeatType.LATERAL_ENTRY) {
          if ((status === EnrolmentStatus.ACTIVE || status === EnrolmentStatus.ON_BREAK) && isActiveOnDate(e, asOf)) {
            confirmedLateral++;
          } else if (status === EnrolmentStatus.ADMITTED || status === EnrolmentStatus.PENDING_REVIEW) {
            pendingLateral++;
          }
          continue;
        }

        // REGULAR
        if ((status === EnrolmentStatus.ACTIVE || status === EnrolmentStatus.ON_BREAK) && isActiveOnDate(e, asOf)) {
          confirmedRegular++;
        } else if (status === EnrolmentStatus.ADMITTED || status === EnrolmentStatus.PENDING_REVIEW) {
          pendingRegular++;
        }
      }

      const overIntake =
        confirmedRegular + pendingRegular > programme.approvedIntake ||
        confirmedLateral + pendingLateral > programme.lateralIntake;

      return {
        programmeId: programme.id,
        programmeName: programme.name,
        academicYear: programme.academicYear,
        shift: programme.shift,
        institution: programme.institution,
        approvedIntake: programme.approvedIntake,
        lateralIntake: programme.lateralIntake,
        asOf: asOf.toISOString().split('T')[0],
        confirmed: {
          regular: confirmedRegular,
          lateral: confirmedLateral,
          total: confirmedRegular + confirmedLateral,
        },
        pending: {
          regular: pendingRegular,
          lateral: pendingLateral,
          total: pendingRegular + pendingLateral,
        },
        supernumerary,
        overIntake,
      };
    });

    return result;
  }

  async getProgrammeDetail(programmeId: string, user: any, asOfStr?: string) {
    const asOf = asOfStr ? new Date(asOfStr) : new Date();

    const programme = await this.prisma.programme.findUnique({
      where: { id: programmeId },
      include: {
        institution: true,
        enrolments: { include: { student: true } },
      },
    });

    if (!programme) {
      throw new NotFoundException('Programme not found');
    }

    if (user.role !== UserRole.AICTE_ADMIN) {
      if (!user.institutionId) {
        throw new ForbiddenException('User is not associated with an institution');
      }
      if (programme.institutionId !== user.institutionId) {
        throw new ForbiddenException('Access denied to this programme');
      }
    }

    const enrolments = programme.enrolments || [];

    let confirmedRegular = 0;
    let confirmedLateral = 0;
    let pendingRegular = 0;
    let pendingLateral = 0;
    let supernumerary = 0;
    const confirmedList: any[] = [];
    const pendingList: any[] = [];

    for (const e of enrolments) {
      const status = e.status as EnrolmentStatus;
      const seatType = e.seatType as SeatType;

      if (seatType === SeatType.SUPERNUMERARY) {
        if ((status === EnrolmentStatus.ACTIVE || status === EnrolmentStatus.ON_BREAK) && isActiveOnDate(e, asOf)) {
          supernumerary++;
        }
        continue;
      }

      if (seatType === SeatType.LATERAL_ENTRY) {
        if ((status === EnrolmentStatus.ACTIVE || status === EnrolmentStatus.ON_BREAK) && isActiveOnDate(e, asOf)) {
          confirmedLateral++;
          confirmedList.push({ ...e, seatCategory: 'LATERAL' });
        } else if (status === EnrolmentStatus.ADMITTED || status === EnrolmentStatus.PENDING_REVIEW) {
          pendingLateral++;
          pendingList.push({ ...e, seatCategory: 'LATERAL' });
        }
        continue;
      }

      if ((status === EnrolmentStatus.ACTIVE || status === EnrolmentStatus.ON_BREAK) && isActiveOnDate(e, asOf)) {
        confirmedRegular++;
        confirmedList.push({ ...e, seatCategory: 'REGULAR' });
      } else if (status === EnrolmentStatus.ADMITTED || status === EnrolmentStatus.PENDING_REVIEW) {
        pendingRegular++;
        pendingList.push({ ...e, seatCategory: 'REGULAR' });
      }
    }

    const overIntake =
      confirmedRegular + pendingRegular > programme.approvedIntake ||
      confirmedLateral + pendingLateral > programme.lateralIntake;

    return {
      programme,
      asOf: asOf.toISOString().split('T')[0],
      counts: {
        confirmed: { regular: confirmedRegular, lateral: confirmedLateral, total: confirmedRegular + confirmedLateral },
        pending: { regular: pendingRegular, lateral: pendingLateral, total: pendingRegular + pendingLateral },
        supernumerary,
      },
      overIntake,
      confirmedList,
      pendingList,
    };
  }
}
