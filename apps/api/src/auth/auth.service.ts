import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

const SESSION_COOKIE_NAME = 'sessionId';
const SESSION_EXPIRY_DAYS = 7;

function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  return hasUppercase && hasNumber && hasSpecialChar;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async login(email: string, password: string, userAgent?: string, ipAddress?: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is disabled');
    }

    const valid = await this.usersService.validatePassword(user, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    await this.usersService.updateLastLogin(user.id);

    return {
      sessionId: session.id,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        institutionId: user.institutionId,
      },
      expiresAt: session.expiresAt,
    };
  }

  async logout(sessionId: string) {
    if (!sessionId) return;
    try {
      await this.prisma.session.delete({ where: { id: sessionId } });
    } catch (e) {
      // ignore if session already deleted
    }
  }

  validatePasswordStrength(password: string) {
    if (!isValidPassword(password)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character',
      );
    }
  }

  getSessionCookieOptions() {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);
    return {
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: process.env.NODE_ENV === 'production',
      expires: expiresAt,
      path: '/',
    };
  }

  getClearSessionCookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
      path: '/',
    };
  }
}