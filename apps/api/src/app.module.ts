import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProgrammesModule } from './programmes/programmes.module';
import { StudentsModule } from './students/students.module';
import { EnrolmentsModule } from './enrolments/enrolments.module';
import { CasesModule } from './cases/cases.module';
import { DashboardsModule } from './dashboards/dashboards.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MeModule } from './me/me.module';
import { RecordsModule } from './records/records.module';

@Module({
  imports: [PrismaModule, InstitutionsModule, UsersModule, AuthModule, ProgrammesModule, StudentsModule, EnrolmentsModule, CasesModule, DashboardsModule, MeModule, RecordsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}