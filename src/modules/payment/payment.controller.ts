import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Get,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseIntPipe,
  UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RejectPaymentDto } from './dto/reject-payment.dto';
import { UploadService } from 'src/modules/payment/upload.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorater';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('payments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly uploadService: UploadService,
  ) {}

  // Upload ảnh (resident) -> trả về { url, path }
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @Roles('USER')
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    return this.uploadService.uploadImage(file);
  }

  // 2) Create payment (resident)
  @Post()
  @Roles('USER')
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentService.createPayment(dto);
  }

  // 3) Admin approve
  @Patch(':id/approve')
  @Roles('ADMIN')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() body:{amount?: number}
  ) {
    return this.paymentService.approvePayment(id, body.amount);
  }

  // 4) Admin reject
  @Patch(':id/reject')
  @Roles('ADMIN')
  reject(@Param('id', ParseIntPipe) id: number, @Body() dto: RejectPaymentDto) {
    return this.paymentService.rejectPayment(id, dto.note);
  }
}
