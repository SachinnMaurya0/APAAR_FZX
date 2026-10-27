import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { ResolveCaseDto } from './dto/resolve-case.dto';
import { CaseStatus, UserRole } from '../generated/prisma/client';

@Injectable()
export class CasesService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: any) {
    if (user.role === UserRole.AICTE_ADMIN) {
      return this.prisma.case.findMany({
        include: {
          enrolment: { include: { student: true, programme: { include: { institution: true } } } },
          institution: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!user.institutionId) {
      throw new ForbiddenException('User is not associated with an institution');
    }

    return this.prisma.case.findMany({
      where: { institutionId: user.institutionId },
      include: {
        enrolment: { include: { student: true, programme: { include: { institution: true } } } },
        institution: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: any) {
    const caseItem = await this.prisma.case.findUnique({
      where: { id },
      include: {
        enrolment: { include: { student: true, programme: { include: { institution: true } } } },
        institution: true,
      },
    });

    if (!caseItem) {
      throw new NotFoundException('Case not found');
    }

    if (user.role === UserRole.AICTE_ADMIN) {
      return caseItem;
    }

    if (!user.institutionId) {
      throw new ForbiddenException('User is not associated with an institution');
    }

    if (caseItem.institutionId && caseItem.institutionId !== user.institutionId) {
      throw new ForbiddenException('Access denied to this case');
    }

    return caseItem;
  }

  async create(createDto: CreateCaseDto, user: any) {
    if (user.role !== UserRole.AICTE_ADMIN && user.role !== UserRole.INSTITUTION_ADMIN && user.role !== UserRole.INSTITUTION_OPERATOR) {
      throw new ForbiddenException('Insufficient permissions');
    }

    let institutionId = createDto.institutionId;

    if (user.role !== UserRole.AICTE_ADMIN) {
      if (!user.institutionId) {
        throw new ForbiddenException('User is not associated with an institution');
      }
      institutionId = user.institutionId;
    }

    return this.prisma.case.create({
      data: {
        type: createDto.type,
        status: CaseStatus.OPEN,
        studentId: createDto.studentId ?? null,
        enrolmentId: createDto.enrolmentId ?? null,
        institutionId: institutionId ?? null,
        description: createDto.description,
      },
      include: {
        enrolment: { include: { student: true, programme: { include: { institution: true } } } },
        institution: true,
      },
    });
  }

  async resolve(id: string, resolveDto: ResolveCaseDto, user: any) {
    if (user.role !== UserRole.AICTE_ADMIN && user.role !== UserRole.INSTITUTION_ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const caseItem = await this.prisma.case.findUnique({
      where: { id },
    });

    if (!caseItem) {
      throw new NotFoundException('Case not found');
    }

    if (user.role !== UserRole.AICTE_ADMIN) {
      if (!user.institutionId) {
        throw new ForbiddenException('User is not associated with an institution');
      }
      if (caseItem.institutionId && caseItem.institutionId !== user.institutionId) {
        throw new ForbiddenException('Access denied to this case');
      }
    }

    return this.prisma.case.update({
      where: { id },
      data: {
        status: resolveDto.status,
        resolutionNotes: resolveDto.resolutionNotes,
        resolvedById: user.id,
        resolvedAt: new Date(),
      },
      include: {
        enrolment: { include: { student: true, programme: { include: { institution: true } } } },
        institution: true,
      },
    });
  }
}
