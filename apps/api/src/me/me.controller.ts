import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../generated/prisma/client';
import { MeService } from './me.service';

@Controller('me')
@UseGuards(AuthGuard, RolesGuard)
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get('record')
  @Roles(UserRole.STUDENT)
  getRecord(@CurrentUser() user: any) {
    return this.meService.getRecord(user);
  }
}