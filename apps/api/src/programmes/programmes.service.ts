import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgrammeDto } from './dto/create-programme.dto';
import { UpdateProgrammeDto } from './dto/update-programme.dto';
import { UserRole } from '../generated/prisma/client';

@Injectable()
export class ProgrammesService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: any) {
    if (user.role === UserRole.AICTE_ADMIN) {
      return this.prisma.programme.findMany({
        include: { institution: true },
        orderBy: [{ institutionId: 'asc' }, { academicYear: 'desc' }, { name: 'asc' }],
      });
    }

    if (!user.institutionId) {
      throw new ForbiddenException('User is not associated with an institution');
    }

    return this.prisma.programme.findMany({
      where: { institutionId: user.institutionId },
      include: { institution: true },
      orderBy: [{ academicYear: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string, user: any) {
    const programme = await this.prisma.programme.findUnique({
      where: { id },
      include: { institution: true },
    });

    if (!programme) {
      throw new NotFoundException('Programme not found');
    }

    if (user.role === UserRole.AICTE_ADMIN) {
      return programme;
    }

    if (!user.institutionId) {
      throw new ForbiddenException('User is not associated with an institution');
    }

    if (programme.institutionId !== user.institutionId) {
      throw new ForbiddenException('Access denied to this programme');
    }

    return programme;
  }

  async create(createDto: CreateProgrammeDto, user: any) {
    let institutionId: string;

    if (user.role === UserRole.AICTE_ADMIN) {
      if (!createDto.institutionId) {
        throw new ForbiddenException('institutionId is required for AICTE_ADMIN');
      }
      institutionId = createDto.institutionId;
    } else {
      if (!user.institutionId) {
        throw new ForbiddenException('User is not associated with an institution');
      }
      institutionId = user.institutionId;
    }

    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });
    if (!institution) {
      throw new NotFoundException('Institution not found');
    }

    return this.prisma.programme.create({
      data: {
        institutionId,
        name: createDto.name,
        academicYear: createDto.academicYear,
        shift: createDto.shift ?? 1,
        approvedIntake: createDto.approvedIntake,
        lateralIntake: createDto.lateralIntake ?? 0,
      },
      include: { institution: true },
    });
  }

  async update(id: string, updateDto: UpdateProgrammeDto, user: any) {
    const programme = await this.prisma.programme.findUnique({
      where: { id },
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

    return this.prisma.programme.update({
      where: { id },
      data: {
        name: updateDto.name,
        academicYear: updateDto.academicYear,
        shift: updateDto.shift,
        approvedIntake: updateDto.approvedIntake,
        lateralIntake: updateDto.lateralIntake,
      },
      include: { institution: true },
    });
  }

  async remove(id: string, user: any) {
    const programme = await this.prisma.programme.findUnique({
      where: { id },
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

    return this.prisma.programme.delete({
      where: { id },
    });
  }
}
