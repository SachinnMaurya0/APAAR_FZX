import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { RecordsService } from './records.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../generated/prisma/client';

@Controller('records')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.INSTITUTION_ADMIN, UserRole.INSTITUTION_OPERATOR)
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  /** Add one student record (student + enrolment) typed in by hand. */
  @Post()
  createOne(@Body() body: any, @CurrentUser() user: any) {
    return this.recordsService.createOne(body, user);
  }

  /** Add many records from a parsed CSV. `dryRun: true` checks everything and saves nothing. */
  @Post('import')
  importRows(@Body() body: any, @CurrentUser() user: any) {
    return this.recordsService.importRows(body, user);
  }
}
