import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { UserRole } from '../generated/prisma/client';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: any) {
    if (user.role === UserRole.AICTE_ADMIN) {
      return this.prisma.student.findMany({
        include: { enrolments: { include: { programme: { include: { institution: true } } } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!user.institutionId) {
      throw new ForbiddenException('User is not associated with an institution');
    }

    // Find students that have enrolments in this institution
    const enrolments = await this.prisma.enrolment.findMany({
      where: {
        programme: {
          institutionId: user.institutionId,
        },
      },
      select: { studentId: true },
      distinct: ['studentId'],
    });

    const studentIds = enrolments.map((e) => e.studentId);

    if (studentIds.length === 0) {
      return [];
    }

    return this.prisma.student.findMany({
      where: { id: { in: studentIds } },
      include: { enrolments: { include: { programme: { include: { institution: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: any) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { enrolments: { include: { programme: { include: { institution: true } } } } },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (user.role === UserRole.AICTE_ADMIN) {
      return student;
    }

    if (!user.institutionId) {
      throw new ForbiddenException('User is not associated with an institution');
    }

    // Check if student has any enrolment in this institution
    const hasEnrolment = student.enrolments.some(
      (e) => e.programme.institutionId === user.institutionId,
    );

    if (!hasEnrolment) {
      throw new ForbiddenException('Access denied to this student');
    }

    return student;
  }

  async create(createDto: CreateStudentDto, user: any) {
    // Only allow certain roles to create
    if (user.role !== UserRole.AICTE_ADMIN && user.role !== UserRole.INSTITUTION_ADMIN && user.role !== UserRole.INSTITUTION_OPERATOR) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (createDto.apaarId) {
      const existing = await this.prisma.student.findUnique({
        where: { apaarId: createDto.apaarId },
      });
      if (existing) {
        throw new ConflictException('Student with this APAAR ID already exists');
      }
    }

    return this.prisma.student.create({
      data: {
        apaarId: createDto.apaarId ?? null,
        fullName: createDto.fullName,
        dateOfBirth: new Date(createDto.dateOfBirth),
      },
    });
  }

  async update(id: string, updateDto: UpdateStudentDto, user: any) {
    if (user.role !== UserRole.AICTE_ADMIN && user.role !== UserRole.INSTITUTION_ADMIN && user.role !== UserRole.INSTITUTION_OPERATOR) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { enrolments: { include: { programme: true } } },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (user.role !== UserRole.AICTE_ADMIN) {
      if (!user.institutionId) {
        throw new ForbiddenException('User is not associated with an institution');
      }
      const hasEnrolment = student.enrolments.some(
        (e) => e.programme.institutionId === user.institutionId,
      );
      if (!hasEnrolment) {
        throw new ForbiddenException('Access denied to this student');
      }
    }

    if (
      user.role !== UserRole.AICTE_ADMIN &&
      student.apaarId &&
      updateDto.apaarId !== undefined &&
      updateDto.apaarId !== student.apaarId
    ) {
      throw new ForbiddenException('Only AICTE can change an existing APAAR ID');
    }
    if (updateDto.apaarId && !/^\d{12}$/.test(updateDto.apaarId)) {
      throw new BadRequestException('APAAR ID must be 12 digits');
    }

    if (updateDto.apaarId) {
      const existing = await this.prisma.student.findUnique({
        where: { apaarId: updateDto.apaarId },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Student with this APAAR ID already exists');
      }
    }

    const data: any = {};
    if (updateDto.apaarId !== undefined) data.apaarId = updateDto.apaarId;
    if (updateDto.fullName !== undefined) data.fullName = updateDto.fullName;
    if (updateDto.dateOfBirth !== undefined) data.dateOfBirth = new Date(updateDto.dateOfBirth);

    return this.prisma.student.update({
      where: { id },
      data,
    });
  }

  async getEnrolments(id: string, user: any) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { enrolments: { include: { programme: { include: { institution: true } } } } },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (user.role === UserRole.AICTE_ADMIN) {
      return student.enrolments;
    }

    if (!user.institutionId) {
      throw new ForbiddenException('User is not associated with an institution');
    }

    const hasEnrolment = student.enrolments.some(
      (e) => e.programme.institutionId === user.institutionId,
    );

    if (!hasEnrolment) {
      throw new ForbiddenException('Access denied to this student');
    }

    return student.enrolments.filter((e) => e.programme.institutionId === user.institutionId);
  }
}
