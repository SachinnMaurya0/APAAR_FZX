import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
// ASSUMPTION: these paths/names follow your handoff doc; adjust to match your auth/ folder.
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../generated/prisma/client';
import { VerifierService } from './verifier.service';

@Controller('verify')
@UseGuards(AuthGuard, RolesGuard)
export class VerifierController {
  constructor(private readonly verifier: VerifierService) {}

  // POST (not GET) so the APAAR ID and DOB don't end up in URLs or access logs.
  @Post('lookup')
  @HttpCode(200)
  @Roles(UserRole.VERIFIER)
  lookup(
    @CurrentUser() user: { id: string },
    @Body() body: { apaarId?: unknown; dateOfBirth?: unknown },
  ) {
    return this.verifier.lookup(user.id, body?.apaarId, body?.dateOfBirth);
  }
}
