import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrolmentDto } from './dto/create-enrolment.dto';
import { UpdateEnrolmentDto } from './dto/update-enrolment.dto';
import { EnrolmentStatus, UserRole } from '../generated/prisma/client';

@Injectable()
export class EnrolmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: any) {
    if (user.role === UserRole.AICTE_ADMIN) {
      return this.prisma.enrolment.findMany({
        include: {
          student: true,
          programme: { include: { institution: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!user.institutionId) {
      throw new ForbiddenException('User is not associated with an institution');
    }

    return this.prisma.enrolment.findMany({
      where: {
        programme: {
          institutionId: user.institutionId,
        },
      },
      include: {
        student: true,
        programme: { include: { institution: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: any) {
    const enrolment = await this.prisma.enrolment.findUnique({
      where: { id },
      include: {
        student: true,
        programme: { include: { institution: true } },
        previousEnrolment: true,
        nextEnrolment: true,
      },
    });

    if (!enrolment) {
      throw new NotFoundException('Enrolment not found');
    }

    if (user.role === UserRole.AICTE_ADMIN) {
      return enrolment;
    }

    if (!user.institutionId) {
      throw new ForbiddenException('User is not associated with an institution');
    }

    if (enrolment.programme.institutionId !== user.institutionId) {
      throw new ForbiddenException('Access denied to this enrolment');
    }

    return enrolment;
  }

  async create(createDto: CreateEnrolmentDto, user: any) {
    if (user.role !== UserRole.AICTE_ADMIN && user.role !== UserRole.INSTITUTION_ADMIN && user.role !== UserRole.INSTITUTION_OPERATOR) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const programme = await this.prisma.programme.findUnique({
      where: { id: createDto.programmeId },
      include: { institution: true },
    });

    if (!programme) {
      throw new NotFoundException('Programme not found');
    }

    if (user.role !== UserRole.AICTE_ADMIN) {
      if (!user.institutionId) {
        throw new ForbiddenException('User is not associated with an institution');
      }
      if (programme.institutionId !== user.institutionId) {
        throw new ForbiddenException('Cannot create enrolment for another institution');
      }
    }

    const student = await this.prisma.student.findUnique({
      where: { id: createDto.studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (createDto.endDate && createDto.startDate && new Date(createDto.endDate) < new Date(createDto.startDate)) {
      throw new BadRequestException('endDate cannot be before startDate');
    }

    try {
      return await this.prisma.enrolment.create({
        data: {
          studentId: createDto.studentId,
          programmeId: createDto.programmeId,
          status: createDto.status,
          seatType: createDto.seatType ?? 'REGULAR',
          isNri: createDto.isNri ?? false,
          isOci: createDto.isOci ?? false,
          isForeignNational: createDto.isForeignNational ?? false,
          startDate: new Date(createDto.startDate),
          endDate: createDto.endDate ? new Date(createDto.endDate) : null,
          previousEnrolmentId: createDto.previousEnrolmentId ?? null,
        },
        include: {
          student: true,
          programme: { include: { institution: true } },
        },
      });
    } catch (e: any) {
      // If overlap constraint is violated
      if (e.code === '23P01') {
        throw new BadRequestException('Enrolment overlaps with existing confirmed enrolment for this student');
      }
      throw e;
    }
  }

  async update(id: string, updateDto: UpdateEnrolmentDto, user: any) {
    if (user.role !== UserRole.AICTE_ADMIN && user.role !== UserRole.INSTITUTION_ADMIN && user.role !== UserRole.INSTITUTION_OPERATOR) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const enrolment = await this.prisma.enrolment.findUnique({
      where: { id },
      include: { programme: true },
    });

    if (!enrolment) {
      throw new NotFoundException('Enrolment not found');
    }

    if (user.role !== UserRole.AICTE_ADMIN) {
      if (!user.institutionId) {
        throw new ForbiddenException('User is not associated with an institution');
      }
      if (enrolment.programme.institutionId !== user.institutionId) {
        throw new ForbiddenException('Access denied to this enrolment');
      }
    }

    if (updateDto.endDate && updateDto.startDate && new Date(updateDto.endDate) < new Date(updateDto.startDate)) {
      throw new BadRequestException('endDate cannot be before startDate');
    } else if (updateDto.endDate && !updateDto.startDate && enrolment.startDate && new Date(updateDto.endDate) < enrolment.startDate) {
      throw new BadRequestException('endDate cannot be before startDate');
    }

    const data: any = {};
    if (updateDto.status !== undefined) data.status = updateDto.status;
    if (updateDto.seatType !== undefined) data.seatType = updateDto.seatType;
    if (updateDto.isNri !== undefined) data.isNri = updateDto.isNri;
    if (updateDto.isOci !== undefined) data.isOci = updateDto.isOci;
    if (updateDto.isForeignNational !== undefined) data.isForeignNational = updateDto.isForeignNational;
    if (updateDto.startDate !== undefined) data.startDate = new Date(updateDto.startDate);
    if (updateDto.endDate !== undefined) data.endDate = updateDto.endDate ? new Date(updateDto.endDate) : null;
    if (updateDto.previousEnrolmentId !== undefined) data.previousEnrolmentId = updateDto.previousEnrolmentId;

    try {
      return await this.prisma.enrolment.update({
        where: { id },
        data,
        include: {
          student: true,
          programme: { include: { institution: true } },
        },
      });
    } catch (e: any) {
      if (e.code === '23P01') {
        throw new BadRequestException('Enrolment overlaps with existing confirmed enrolment for this student');
      }
      throw e;
    }
  }
}
