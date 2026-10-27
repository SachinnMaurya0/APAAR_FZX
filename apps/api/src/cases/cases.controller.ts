import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { ResolveCaseDto } from './dto/resolve-case.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../generated/prisma/client';

@Controller('cases')
@UseGuards(AuthGuard, RolesGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.INSTITUTION_OPERATOR)
  findAll(@CurrentUser() user: any) {
    return this.casesService.findAll(user);
  }

  @Get(':id')
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.INSTITUTION_OPERATOR)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.casesService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.INSTITUTION_OPERATOR)
  create(@Body() createCaseDto: CreateCaseDto, @CurrentUser() user: any) {
    return this.casesService.create(createCaseDto, user);
  }

  @Patch(':id/resolve')
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN)
  resolve(@Param('id') id: string, @Body() resolveCaseDto: ResolveCaseDto, @CurrentUser() user: any) {
    return this.casesService.resolve(id, resolveCaseDto, user);
  }
}
