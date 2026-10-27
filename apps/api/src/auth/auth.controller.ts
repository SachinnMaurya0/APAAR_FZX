import { BadRequestException, Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

const SESSION_COOKIE_NAME = 'sessionId';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (typeof loginDto?.email !== 'string' || typeof loginDto?.password !== 'string') {
      throw new BadRequestException('email and password are required');
    }
    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
      req.headers['user-agent'],
      req.ip,
    );
    res.cookie(SESSION_COOKIE_NAME, result.sessionId, this.authService.getSessionCookieOptions());
    return { user: result.user, expiresAt: result.expiresAt };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId = req.cookies?.sessionId;
    await this.authService.logout(sessionId);
    res.cookie(SESSION_COOKIE_NAME, '', this.authService.getClearSessionCookieOptions());
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@CurrentUser() user: any) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      institutionId: user.institutionId,
      institution: user.institution,
      isActive: user.isActive,
    };
  }
}