import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MeService {
  constructor(private prisma: PrismaService) {}

  async getRecord(user: any) {
    // Re-read the link from the database so we never trust anything the client sent
    const account = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { studentId: true },
    });
    if (!account?.studentId) {
      throw new NotFoundException('No student record is linked to this account');
    }

    const student = await this.prisma.student.findUnique({
      where: { id: account.studentId },
      select: {
        apaarId: true,
        fullName: true,
        dateOfBirth: true,
        enrolments: {
          orderBy: { startDate: 'desc' },
          select: {
            status: true,
            seatType: true,
            startDate: true,
            endDate: true,
            programme: {
              select: {
                name: true,
                academicYear: true,
                shift: true,
                institution: { select: { name: true, aicteCode: true, state: true } },
              },
            },
          },
        },
      },
    });
    if (!student) {
      throw new NotFoundException('Student record not found');
    }
    return student;
  }
}