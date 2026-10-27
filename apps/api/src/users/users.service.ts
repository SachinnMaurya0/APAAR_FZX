import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../generated/prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { institution: true } });
  }

  async create(data: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    institutionId?: string | null;
    isActive?: boolean;
  }) {
    const passwordHash = await argon2.hash(data.password);
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        role: data.role,
        institutionId: data.institutionId ?? null,
        isActive: data.isActive ?? true,
      },
    });
  }

  async validatePassword(user: { passwordHash: string }, password: string) {
    return argon2.verify(user.passwordHash, password);
  }

  async updateLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}