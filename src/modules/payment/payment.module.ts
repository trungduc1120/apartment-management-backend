import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { UploadService } from 'src/modules/payment/upload.service';
@Module({
  providers: [PaymentService, PrismaService, UploadService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
