import {MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import { PrismaModule } from './shared/prisma/prisma.module';
import {UserModule} from "./modules/user/user.module";
import {LoggerMiddleware} from "./common/middleware/logger.middleware";
import {AuthModule} from "./modules/auth/auth.module";
import { ConfigModule } from '@nestjs/config';
import {HouseHoldModule} from "./modules/house-hold/house-hold.module";
import { AdminModule } from './modules/admin/admin.module';
import { FeeModule } from './modules/fee/fee.module';
import { PaymentModule } from './modules/payment/payment.module';
import {RegistrationModule} from "./modules/registration/registration.module";
import {ScheduleModule} from "@nestjs/schedule";

@Module({
  imports: [PrismaModule, UserModule, AuthModule,
    ConfigModule.forRoot({ isGlobal: true, }),
    HouseHoldModule,
    AdminModule,
    FeeModule,
    PaymentModule,
    RegistrationModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
