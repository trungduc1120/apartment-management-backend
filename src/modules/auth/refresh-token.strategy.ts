import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private prisma: PrismaService, private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
				(req) => req?.cookies?.refreshToken
			]),
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET')!,
    });
  }

  async validate(payload: { id: number }) {
    const user = await this.prisma.users.findUnique({ where: { id: payload.id } });
    if (!user) throw new Error('User not found');
    return { id: user.id, role: user.role };
  }
}