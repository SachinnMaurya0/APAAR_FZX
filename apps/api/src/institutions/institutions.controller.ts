import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.institution.findMany({
      include: { programmes: true },
      orderBy: { aicteCode: 'asc' },
    });
  }
}