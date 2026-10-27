import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { EnrolmentsService } from './enrolments.service';
import { CreateEnrolmentDto } from './dto/create-enrolment.dto';
import { UpdateEnrolmentDto } from './dto/update-enrolment.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../generated/prisma/client';

@Controller('enrolments')
@UseGuards(AuthGuard, RolesGuard)
export class EnrolmentsController {
  constructor(private readonly enrolmentsService: EnrolmentsService) {}

  @Get()
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.INSTITUTION_OPERATOR)
  findAll(@CurrentUser() user: any) {
    return this.enrolmentsService.findAll(user);
  }

  @Get(':id')
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.INSTITUTION_OPERATOR)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.enrolmentsService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.INSTITUTION_OPERATOR)
  create(@Body() createEnrolmentDto: CreateEnrolmentDto, @CurrentUser() user: any) {
    return this.enrolmentsService.create(createEnrolmentDto, user);
  }

  @Patch(':id')
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.INSTITUTION_OPERATOR)
  update(@Param('id') id: string, @Body() updateEnrolmentDto: UpdateEnrolmentDto, @CurrentUser() user: any) {
    return this.enrolmentsService.update(id, updateEnrolmentDto, user);
  }
}
