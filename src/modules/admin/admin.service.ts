import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { GetHouseholdsQueryDto } from './dto/get-households.dto';
import { InformationStatus, HouseHoldStatus, ResidenceStatus } from '@prisma/client';
@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService ){}
    async getAllHouseholds(query: GetHouseholdsQueryDto) {
      const { page = 1, limit = 5, search } = query;

      const skip = (page - 1) * limit;

      const where: Prisma.HouseHoldsWhereInput = {};

      if (search) {
        const searchAsNumber = Number(search);
        const isNumber = !isNaN(searchAsNumber);

        where.OR = [
          { apartmentNumber: { contains: search, mode: 'insensitive' } },
          {
            head: {
              fullname: { contains: search, mode: 'insensitive' }
            }
          },
        ];

        if (isNumber) {
          where.OR.push({ houseHoldCode: searchAsNumber });
        }
      }
    const [data, total] = await Promise.all([
      this.prisma.houseHolds.findMany({
        skip: skip,
        take: limit,
        where: where,
        include: {
          head: true,
          resident: true,
        },
        orderBy: { id: 'asc' },
      }),
      this.prisma.houseHolds.count({ where: where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getHouseholdDetail(id: number) {
    const household = await this.prisma.houseHolds.findUniqueOrThrow({
      where: { id },
      include: {
        // head: true,
        // account: { select: { id: true, email: true, role: true } },
        resident: true,
      },
    });
    return household;
  }


  async createAccounts(num: number){

  }

  async getDashboardStats() {
    const [
      totalHouseholds,
      occupiedHouseholds,
      totalResidents,
      pendingTempResidents,
      pendingTempAbsents,
    ] = await Promise.all([
      this.prisma.houseHolds.count({
        where: { status: { not: HouseHoldStatus.DELETE } }
      }),

      this.prisma.houseHolds.count({
        where: { status: HouseHoldStatus.ACTIVE }
      }),

      this.prisma.resident.count({
        where: {
          residentStatus: { in: [ResidenceStatus.NORMAL, ResidenceStatus.TEMP_RESIDENT] }
        }
      }),

      this.prisma.temporaryResident.count({
        where: { informationStatus: InformationStatus.PENDING }
      }),

      this.prisma.temporaryAbsence.count({
        where: { informationStatus: InformationStatus.PENDING }
      }),
    ]);

    return {
      totalHouseholds,
      occupiedHouseholds,
      totalResidents,
      pendingRequests: pendingTempResidents + pendingTempAbsents,
    };
  }
}
