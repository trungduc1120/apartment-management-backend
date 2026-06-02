import {Injectable, NotFoundException} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private prisma: PrismaService, private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), //phuong thuc lay token
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: { id: number; role: string }) {
    // payload là dữ liệu đã giải mã từ JWT
    // có thể kiểm tra user tồn tại trong DB
    const user = await this.prisma.users.findUnique({
      where: { id: payload.id },
    });
    if (!user) {
      throw new NotFoundException('Invalid token'); // sẽ bị catch bởi AuthGuard
    }

    return { id: user.id, role: user.role, householdId: user.householdId }; // gắn vào req.user
  }
}
