import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ProgrammesService } from './programmes.service';
import { CreateProgrammeDto } from './dto/create-programme.dto';
import { UpdateProgrammeDto } from './dto/update-programme.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../generated/prisma/client';

@Controller('programmes')
@UseGuards(AuthGuard, RolesGuard)
export class ProgrammesController {
  constructor(private readonly programmesService: ProgrammesService) {}

  @Get()
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.INSTITUTION_OPERATOR)
  findAll(@CurrentUser() user: any) {
    return this.programmesService.findAll(user);
  }

  @Get(':id')
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.INSTITUTION_OPERATOR)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.programmesService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN)
  create(@Body() createProgrammeDto: CreateProgrammeDto, @CurrentUser() user: any) {
    return this.programmesService.create(createProgrammeDto, user);
  }

  @Patch(':id')
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN)
  update(@Param('id') id: string, @Body() updateProgrammeDto: UpdateProgrammeDto, @CurrentUser() user: any) {
    return this.programmesService.update(id, updateProgrammeDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.programmesService.remove(id, user);
  }
}
