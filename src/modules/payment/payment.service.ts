import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UploadService } from './upload.service';
@Injectable()
export class PaymentService {
    constructor(
        private prisma: PrismaService,
        private uploadService: UploadService
    ){}

    // resident tao payment sau khi upload nhan imageUrl
    async createPayment(dto: CreatePaymentDto){
        const assignment = await this.prisma.feeAssignment.findUnique({
            where: {id: dto.feeAssignmentId},
            include:{Payment: true},
        });
        if (!assignment) throw new NotFoundException('FeeAssignment không tồn tại');

        const oldPayment = assignment.Payment;

        if (oldPayment && oldPayment.status === 'APPROVED') {
            throw new BadRequestException('Khoản này đã được duyệt, không thể nộp lại');
        }

        if(oldPayment && oldPayment.status === 'REJECTED'){
            if(oldPayment.imagePath && oldPayment.imagePath !== dto.imagePath){
                try {
                    await this.uploadService.deleteImage(oldPayment.imagePath);
                } catch(err) {
                    console.log(err);
                }
            }
            return this.prisma.payment.update({
                where:{id: oldPayment.id},
                data:{
                    amountPaid: dto.amountPaid,
                    imageUrl: dto.imageUrl,
                    imagePath: dto.imagePath,
                    status: 'PENDING',
                    note: null,
                }
            })
        }

        return this.prisma.payment.create({
            data: {
                feeAssignmentId: dto.feeAssignmentId,
                amountPaid: dto.amountPaid,
                imageUrl: dto.imageUrl,
                imagePath: dto.imagePath,
                status: 'PENDING',
            },
        });
    }
    async approvePayment (paymentId: number, amount?: number){
        const payment = await this.prisma.payment.findUnique({
            where: {id: paymentId},
            include: {FeeAssignment: true}
        })
        if(!payment) throw new NotFoundException('Payment không tồn tại');

        const finalAmount = amount !== undefined ? amount : (payment.amountPaid || 0);
        return this.prisma.$transaction([
            this.prisma.payment.update({
                where: { id: paymentId },
                data: { status: 'APPROVED' },
            }),
            this.prisma.feeAssignment.update({
                where: { id: payment.feeAssignmentId },
                data: { 
                    isPaid: true,
                    amountDue: finalAmount 
                },
            })
        ]);
    }

    // admin reject (write note)
    async rejectPayment(paymentId: number, note?: string) {
        const payment = await this.prisma.payment.findUnique({ where: { id: paymentId }});
        if (!payment) throw new NotFoundException('Payment không tồn tại');

        return this.prisma.payment.update({
            where: { id: paymentId },
            data: { status: 'REJECTED', note },
        });
    }
}
