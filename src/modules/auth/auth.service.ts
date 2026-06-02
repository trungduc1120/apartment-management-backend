import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { SignUpDto } from './dto/sign-up.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SignInDto } from './dto/sign-in.dto';
import { ConfigService } from '@nestjs/config';
import {randomBytes} from "node:crypto";
import {MailService} from "../../common/mail/mail.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private mailService: MailService)
  {}

  async signup(dto: SignUpDto) {
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.users.create({
      data: { ...dto, password: hashed, role: Role.USER },
    });

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      this.configService.get<string>('JWT_SECRET')!,
      {
        expiresIn: '3d',
      },
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      this.configService.get<string>('JWT_REFRESH_SECRET')!,
      {
        expiresIn: '7d',
      }
    );

    return { user, accessToken, refreshToken };
  }

  async signin(dto: SignInDto) {
    const user = await this.prisma.users.findUniqueOrThrow({
      where: { email: dto.email },
    });

    const match: Boolean = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Wrong password');

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      this.configService.get<string>('JWT_SECRET')!,
      {
        expiresIn: '3d',
      },
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      this.configService.get<string>('JWT_REFRESH_SECRET')!,
      {
        expiresIn: '7d',
      }
    );

    return { user, accessToken, refreshToken };
  }

  async refresh(user2: {id: number; role: string}){
    const accessToken = jwt.sign(
      {id: user2.id, role: user2.role},
      this.configService.get<string>('JWT_SECRET')!,
      { expiresIn: '3d' }
    )

    const user = await this.prisma.users.findUniqueOrThrow({
      where: { id: user2.id },
    });

    return { user, accessToken };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.users.findUnique({ where: { email } });

    const message = { message: 'If this email exists, a reset link has been sent' };

    if (!user) return message; // email không tồn tại, không lộ thông tin

    // Tạo token reset
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 giờ

    await this.prisma.users.update({
      where: { email },
      data: { resetToken, resetTokenExpiry },
    });

    // link đến front end
    const resetLink = `http://localhost:3030/auth/reset-password?token=${resetToken}`;

    await this.mailService.sendMail(
      email,
      'Reset your password',
      `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`,
    );

    return message;
  }

  // verify token
  async verifyResetToken(token: string) {
  const user = await this.prisma.users.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gte: new Date() }, // còn hạn
    },
  });

  if (!user) throw new Error('Invalid or expired token');
  return { message: 'Valid token' };
}


  // Step 2: Reset Password
  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.users.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() }, // còn hạn
      },
    });

    if (!user) throw new Error('Invalid or expired token');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.users.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
    });

    return { message: 'Password reset successfully' };
  }

}
