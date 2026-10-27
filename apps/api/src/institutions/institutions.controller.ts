import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../generated/prisma/client';

@Controller('institutions')
@UseGuards(AuthGuard, RolesGuard)
export class InstitutionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(UserRole.AICTE_ADMIN)
  findAll() {
    return this.prisma.institution.findMany({
      include: { programmes: true },
      orderBy: { aicteCode: 'asc' },
    });
  }
}
