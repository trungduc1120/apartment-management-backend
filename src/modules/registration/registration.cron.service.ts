import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {PrismaService} from "../../shared/prisma/prisma.service";
import {
  InformationStatus,
  ResidenceStatus
} from "@prisma/client";

@Injectable()
export class RegistrationCronService {
  private readonly logger = new Logger(RegistrationCronService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('30 22 * * *', {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleTempResidentAndTempAbsentJob() {
    this.logger.log('Run daily job at 22:30');
    return this.prisma.$transaction(async (tx) => {
      // 1. Lấy danh sách temporaryResident đã hết hạn
      const tempResidents = await tx.temporaryResident.findMany({
        where: {
          informationStatus: InformationStatus.APPROVED,
          endDate: {
            lt: new Date(),
          },
        },
        select: {
          id: true,
          residentId: true,
        },
      });

      if (tempResidents.length === 0) {
        return { updatedResidents: 0, updatedTempResidents: 0 };
      }

      // 2. Map residentId
      const residentIds = tempResidents.map(tr => tr.residentId);
      const recordIds   = tempResidents.map(tr => tr.id);

      // 3. Update temporaryResident -> ENDED
      const tempResult = await tx.temporaryResident.updateMany({
        where: {
          id: {
            in: recordIds,
          },
          informationStatus: InformationStatus.APPROVED,
        },
        data: {
          informationStatus: InformationStatus.ENDED,
        },
      });

      // 4. Update resident -> MOVE_OUT
      const residentResult = await tx.resident.updateMany({
        where: {
          id: {
            in: residentIds,
          },
        },
        data: {
          residentStatus: ResidenceStatus.MOVE_OUT,
        },
      });

      return {
        updatedTempResidents: tempResult.count,
        updatedResidents: residentResult.count,
      };
    });
  }

  @Cron('35 22 * * *', {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleTempAbsentJob() {
    this.logger.log('Run daily job at 22:35');
    return this.prisma.$transaction(async (tx) => {
      // 1. Lấy danh sách temporaryResident đã hết hạn
      const tempResidents = await tx.temporaryAbsence.findMany({
        where: {
          informationStatus: InformationStatus.APPROVED,
          endDate: {
            lt: new Date(),
          },
        },
        select: {
          id: true,
          residentId: true,
        },
      });

      if (tempResidents.length === 0) {
        return { updatedResidents: 0, updatedTempResidents: 0 };
      }

      // 2. Map residentId
      const residentIds = tempResidents.map(tr => tr.residentId);
      const recordIds   = tempResidents.map(tr => tr.id);

      // 3. Update temporaryResident -> ENDED
      const tempResult = await tx.temporaryAbsence.updateMany({
        where: {
          id: {
            in: recordIds,
          },
          informationStatus: InformationStatus.APPROVED,
        },
        data: {
          informationStatus: InformationStatus.ENDED,
        },
      });

      // 4. Update resident -> MOVE_OUT
      const residentResult = await tx.resident.updateMany({
        where: {
          id: {
            in: residentIds,
          },
        },
        data: {
          residentStatus: ResidenceStatus.NORMAL,
        },
      });

      return {
        updatedTempAbsents: tempResult.count,
        updatedResidents: residentResult.count,
      };
    });
  }
}