import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Res
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private getCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction, 
      
    } as const; 
  }

  // ---------------- SIGN UP ----------------
  @Post('signup')
  async signup(@Body() dto: SignUpDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.authService.signup(dto);

    // Gắn refresh token vào cookie
    res.cookie('refreshToken', refreshToken, this.getCookieOptions());

    // Trả về user + access token
    return { user, accessToken };
  }

  // ---------------- SIGN IN ----------------
  @Post('signin')
  async signin(@Body() dto: SignInDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.authService.signin(dto);

   res.cookie('refreshToken', refreshToken, this.getCookieOptions());

    return { user, accessToken };
  }

  // ---------------- REFRESH TOKEN ----------------
  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  refresh(@Request() req) {
    return this.authService.refresh(req.user);
  }

  @Post('signout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken', { path: '/' });
    return { message: 'Logged out successfully' };
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('verify-reset-token')
  async verifyResetToken(@Body('token') token: string){
    return this.authService.verifyResetToken(token);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}
