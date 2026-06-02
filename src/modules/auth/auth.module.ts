import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AccessTokenStrategy } from './access-token.strategy';
import { AuthService } from './auth.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuthController } from './auth.controller';
import { RefreshTokenStrategy } from './refresh-token.strategy';
import {MailModule} from "../../common/mail/mail.module";

@Module({
  imports: [PassportModule, MailModule],
  providers: [AuthService, AccessTokenStrategy, PrismaService, RefreshTokenStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
