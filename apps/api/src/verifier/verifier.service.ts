import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // ASSUMPTION: adjust path/name if different

@Injectable()
export class VerifierService {
  private readonly logger = new Logger(VerifierService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Look up a student by APAAR ID AND date of birth (both must match). */
  async lookup(verifierUserId: string, apaarIdRaw: unknown, dobRaw: unknown) {
    if (typeof apaarIdRaw !== 'string' || typeof dobRaw !== 'string') {
      throw new BadRequestException('apaarId and dateOfBirth are required');
    }
    const apaarId = apaarIdRaw.replace(/\s+/g, '');
    if (!/^\d{12}$/.test(apaarId)) {
      throw new BadRequestException('APAAR ID must be 12 digits');
    }
    const dob = new Date(`${dobRaw}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dobRaw) || Number.isNaN(dob.getTime()) || dob.toISOString().slice(0, 10) !== dobRaw) {
      throw new BadRequestException('Date of birth must be a valid date in YYYY-MM-DD format');
    }

    const student = await this.prisma.student.findFirst({
      where: { apaarId, dateOfBirth: dob },
      include: {
        // ASSUMPTION: relation names `enrolments` and `programme.institution`
        enrolments: {
          include: { programme: { include: { institution: true } } },
          orderBy: { startDate: 'desc' },
        },
      },
    });

    // Minimal trace in the server log (not a real audit log): last 4 digits only.
    this.logger.log(`verifier=${verifierUserId} lookup ****${apaarId.slice(-4)} matched=${!!student}`);

    // Same message whether the ID or the DOB was wrong, so IDs can't be probed.
    if (!student) {
      throw new NotFoundException('No matching record. Check the APAAR ID and date of birth.');
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const enrolments = student.enrolments.map((e) => ({
      id: e.id,
      institution: { name: e.programme.institution.name, aicteCode: e.programme.institution.aicteCode },
      programme: { name: e.programme.name, academicYear: e.programme.academicYear },
      status: e.status,
      seatType: e.seatType,
      startDate: e.startDate,
      endDate: e.endDate,
      isCurrent:
        (e.status === 'ACTIVE' || e.status === 'ON_BREAK') &&
        e.startDate <= today &&
        (e.endDate === null || e.endDate > today),
    }));

    return {
      apaarId: student.apaarId,
      fullName: student.fullName,
      currentlyEnrolled: enrolments.some((e) => e.isCurrent),
      enrolments,
    };
  }
}
