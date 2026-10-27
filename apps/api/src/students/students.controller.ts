import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../generated/prisma/client';

@Controller('students')
@UseGuards(AuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.INSTITUTION_OPERATOR)
  findAll(@CurrentUser() user: any) {
    return this.studentsService.findAll(user);
  }

  @Get(':id')
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.INSTITUTION_OPERATOR)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.studentsService.findOne(id, user);
  }

  @Get(':id/enrolments')
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.INSTITUTION_OPERATOR)
  getEnrolments(@Param('id') id: string, @CurrentUser() user: any) {
    return this.studentsService.getEnrolments(id, user);
  }

  @Post()
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.INSTITUTION_OPERATOR)
  create(@Body() createStudentDto: CreateStudentDto, @CurrentUser() user: any) {
    return this.studentsService.create(createStudentDto, user);
  }

  @Patch(':id')
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.INSTITUTION_OPERATOR)
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto, @CurrentUser() user: any) {
    return this.studentsService.update(id, updateStudentDto, user);
  }
}
