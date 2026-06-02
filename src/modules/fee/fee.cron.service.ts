import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {PrismaService} from "../../shared/prisma/prisma.service";
import {Fee, FeeCalculationBase, FeeStatus, Frequency, HouseHoldStatus, Prisma, ResidenceStatus} from "@prisma/client";

@Injectable()
export class FeeCronService {
  private readonly logger = new Logger(FeeCronService.name);

  constructor(private prisma: PrismaService) {}

  async calculateAmount(fee: Fee, numCars, numMotorbike, numPeople): Promise<number> {
    if (!fee.rate) return 0;
    switch (fee.calculationBase) {
      case FeeCalculationBase.PER_HOUSEHOLD:
        return fee.rate

      case FeeCalculationBase.PER_PERSON:
        return fee.rate * numPeople

      case FeeCalculationBase.PER_CAR:
        return fee.rate * numCars

      case FeeCalculationBase.PER_MOTORBIKE:
        return fee.rate * numMotorbike
      default:
        return 0
    }
  }

  @Cron('0 0 * * *', {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleDailyJob() {
    this.logger.log('Run daily job at 00:00');

    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;

    // 1️⃣ Lấy các fee MONTHLY có anchorDay = hôm nay
    const monthlyFees = await this.prisma.repeatfee.findMany({
      where: {
        frequency: Frequency.MONTHLY,
        anchorDay: day,
        status: FeeStatus.ACTIVE
      }
    });

    if (monthlyFees.length === 0) {
      this.logger.log('No monthly fee to create today');
      return;
    }
    const fees = await Promise.all(
      monthlyFees.map((rf) =>
        this.prisma.fee.create({
          data: {
            name: `${rf.name}, tháng ${month}, ${today.getFullYear()}`,
            rate: rf.rate,
            isMandatory: rf.isMandatory,
            anchorDay: rf.anchorDay,
            calculationBase: rf.calculationBase,
            description: rf.description,
          },
        }),
      ),
    );


    const households = await this.prisma.houseHolds.findMany({
      where: {
        status: HouseHoldStatus.ACTIVE,
      },
      select: {
        id: true,
        numMotorbike: true,
        numCars: true,
        _count: {
          select: {
            resident: {
              where: {
                residentStatus: {
                  in: [
                    ResidenceStatus.NORMAL,
                    ResidenceStatus.TEMP_RESIDENT,
                  ],
                },
              },
            },
          },
        },
      },
    });

    if (households.length === 0) {
      this.logger.warn('No active households found');
      return;
    }

    // 3️⃣ Build feeAssignment
    const createData: Prisma.FeeAssignmentCreateManyInput[] = [];

    for (const fee of fees) {
      for (const household of households) {
        const amountDue = await this.calculateAmount(
          fee,
          household.numCars,
          household.numMotorbike,
          household._count.resident,
        );
        createData.push({
          householdId: household.id,
          feeId: fee.id,
          amountDue: amountDue,
          dueDate: today,
        });
      }
    }

    const result = await this.prisma.feeAssignment.createMany({
      data: createData,
      skipDuplicates: true,
    });

    this.logger.log(
      `Created ${result.count} fee assignments for ${monthlyFees.length} fees`,
    );
  }

  @Cron('0 0 * * *', {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleYearlyFee() {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;

    // 1️⃣ Lấy các fee MONTHLY có anchorDay = hôm nay
    const yearlyFees = await this.prisma.repeatfee.findMany({
      where: {
        frequency: Frequency.YEARLY,
        anchorDay: day,
        anchorMonth: month,
        status: FeeStatus.ACTIVE
      }
    });

    if (yearlyFees.length === 0) {
      this.logger.log('No monthly fee to create today');
      return;
    }
    const fees = await Promise.all(
      yearlyFees.map((rf) =>
        this.prisma.fee.create({
          data: {
            name: `${rf.name}, năm ${today.getFullYear()}`,
            rate: rf.rate,
            isMandatory: rf.isMandatory,
            anchorDay: rf.anchorDay,
            anchorMonth: rf.anchorMonth,
            calculationBase: rf.calculationBase,
            description: rf.description,
          },
        }),
      ),
    );


    const households = await this.prisma.houseHolds.findMany({
      where: {
        status: HouseHoldStatus.ACTIVE,
      },
      select: {
        id: true,
        numMotorbike: true,
        numCars: true,
        _count: {
          select: {
            resident: {
              where: {
                residentStatus: {
                  in: [
                    ResidenceStatus.NORMAL,
                    ResidenceStatus.TEMP_RESIDENT,
                  ],
                },
              },
            },
          },
        },
      },
    });

    if (households.length === 0) {
      this.logger.warn('No active households found');
      return;
    }

    // 3️⃣ Build feeAssignment
    const createData: Prisma.FeeAssignmentCreateManyInput[] = [];

    for (const fee of fees) {
      for (const household of households) {
        const amountDue = await this.calculateAmount(
          fee,
          household.numCars,
          household.numMotorbike,
          household._count.resident,
        );
        createData.push({
          householdId: household.id,
          feeId: fee.id,
          amountDue: amountDue,
          dueDate: today,
        });
      }
    }

    const result = await this.prisma.feeAssignment.createMany({
      data: createData,
      skipDuplicates: true,
    });

    this.logger.log(
      `Created ${result.count} fee assignments for ${yearlyFees.length} fees`,
    );
  }

}