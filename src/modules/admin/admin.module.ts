import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { AdminGateway } from 'src/websocket/admin.gateway';

@Module({
  imports: [
    ConfigModule, 
    JwtModule.register({}), 
  ],
  controllers: [AdminController],
  providers: [AdminService, PrismaService, AdminGateway],
  exports: [AdminGateway],
})
export class AdminModule {}