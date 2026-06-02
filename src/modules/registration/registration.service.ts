import {ConflictException, ForbiddenException, Injectable} from "@nestjs/common";
import {PrismaService} from "../../shared/prisma/prisma.service";
import {RegisTempResidentDto} from "./dto/regis-temp-resident.dto";
import {RegisTempAndUpdateDto} from "./dto/regis-temp-and-update.dto";
import {ResidentService} from "../house-hold/resident.service";
import {RegisTempAbsentDto} from "./dto/regis-temp-absent";
import {InformationStatus} from "@prisma/client";

@Injectable()
export class RegistrationService{
  constructor(
    private readonly prisma: PrismaService
  ) {}
  async createTempResidentFirstTime(dto: RegisTempResidentDto, userId: number, householdId: number) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Tạo resident trong transaction
      const resident = await tx.resident.create({
        data: {
          ...dto.resident,
          houseHoldId: householdId,
          residentStatus: "TEMP_RESIDENT"
        }
      });

      // 2. Tạo temporaryResident
      return tx.temporaryResident.create({
        data: {
          residentId: resident.id,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          reason: dto.reason,
          submittedUserId: userId,
          householdId: householdId,
        },
      });
    });
  }
  async createTempRegistration(dto: RegisTempAndUpdateDto, residentId: number,userId: number, householdId: number){
    return this.prisma.$transaction(async (tx)=>{
      const record = await tx.temporaryResident.findFirst({
        where: {
          residentId,
          informationStatus: "PENDING"
        }
      })
      if(record){
        throw new ConflictException("You already have a registration")
      }
      await tx.temporaryResident.updateMany({
        where: {
          residentId: residentId,
          informationStatus: "APPROVED"
        },
        data: {endDate: new Date()}
      })
      const resident = await tx.resident.update({
        where: {
          id: residentId,
        },
        data:{
          ...dto.resident,
          houseHoldId: householdId,
          residentStatus: "TEMP_RESIDENT"
        }
      })

      return tx.temporaryResident.create({
        data: {
          residentId: residentId,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          reason: dto.reason,
          submittedUserId: userId,
          householdId: householdId,
        }
      })
    })
  }

  async getAllTempResidentByHousehold(householdId: number){
    return this.prisma.temporaryResident.findMany({
      where:{
        householdId,
        informationStatus: {not: "ENDED"}
      },
      include:{
        resident: true,
      }
    })
  }

  async deleteTempResidentRegistration(regisId: number){
    return this.prisma.$transaction( async (tx) => {
      const record = await tx.temporaryResident.findFirstOrThrow({
        where: {id: regisId}
      })
      if(record.informationStatus != "PENDING"){
        throw new ForbiddenException("You aren't allow to delete approved registration")
      }
      await tx.resident.update({
        where: {
          id: record.residentId
        },
        data: {
          residentStatus: "MOVE_OUT"
        }
      })
      return tx.temporaryResident.delete({
        where: {id: regisId}
      })
    })
  }

  async updateTempResidentRegistration(
    dto: Partial<RegisTempAndUpdateDto>,
    registrationId: number,
    householdId: number
  ) {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.temporaryResident.findFirstOrThrow({
        where: {id: registrationId}
      })
      if(record.informationStatus != "PENDING"){
        throw new ForbiddenException("You aren't allow to delete approved registration")
      }

      // Tách resident khỏi dto
      const { resident, ...tempResidentData } = dto;

      // Nếu có dữ liệu resident → update bảng resident
      if (resident) {
        await tx.resident.update({
          where: { id: record.residentId, houseHoldId: householdId },
          data: resident,
        });
      }

      // Update bảng temporaryResident
      const updated = await tx.temporaryResident.update({
        where: { id: registrationId },
        data: tempResidentData,
      });

      return updated;
    });
  }
  async getTemAbsentByHouseholdId(householdId: number){
    return this.prisma.resident.findMany({
      where: {houseHoldId: householdId, residentStatus: "TEMP_ABSENT"},
      include: {
        TemporaryAbsence: {
          where: { informationStatus: { not: "ENDED" } },
        },
      }
    })
  }
  async createTempAbsentRegistration(dto: RegisTempAbsentDto, userId: number, householdId: number){
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.temporaryAbsence.findFirst({
        where: {
          residentId: dto.residentId,
          informationStatus: {in: ["PENDING"]}
        }
      })
      if(record){
        throw new ConflictException("You have already submitted a registration")
      }
      await tx.temporaryAbsence.updateMany({
        where: {
          residentId: dto.residentId,
          informationStatus: "APPROVED"
        },
        data: {endDate: new Date()}
      })
      await tx.resident.update({
        where: {id: dto.residentId, houseHoldId: householdId},
        data: {residentStatus: "TEMP_ABSENT"}
      })
      return tx.temporaryAbsence.create({
        data: {
          ...dto,
          submittedUserId: userId
        }
      })
    })
  }
  async deleteTempAbsentRegistraion(registrationId: number, userId: number){
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.temporaryAbsence.findFirstOrThrow({
        where: {id: registrationId}
      })
      if(record.submittedUserId != userId){
        throw new ForbiddenException("You are't allow to delete")
      }
      if(record.informationStatus == "APPROVED")
        throw new ForbiddenException("You can't delete approved registration")

      if(record.informationStatus == "PENDING"){
        await tx.resident.update({
          where: {id: record.residentId},
          data: {residentStatus: "NORMAL"}
        })
        return tx.temporaryAbsence.delete({
          where: {id: registrationId}
        })
      }else{
        throw new ForbiddenException("You are't allow to delete")
      }
    })
  }

  async updateTempAbsentRegistraion(
    dto: Partial<RegisTempAbsentDto>,
    registrationId: number,
    userId: number
  ){
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.temporaryAbsence.findFirstOrThrow({
        where: {id: registrationId}
      })

      if(record.submittedUserId != userId){
        throw new ForbiddenException("You are't allow to update")
      }

      if(record.informationStatus == "APPROVED")
        throw new ForbiddenException("You can't update approved registration")

      if(record.informationStatus == "PENDING"){
        return tx.temporaryAbsence.update({
          where: {id: registrationId},
          data: {...dto}
        })
      }else{
        throw new ForbiddenException("You are't allow to update")
      }
    })
  }

  async getDetailTempResident(registrationId: number){
    return this.prisma.temporaryResident.findFirstOrThrow({
      where: {id: registrationId},
      select:{
        id: true,
        householdId: true,
        startDate: true,
        endDate: true,
        submittedAt: true,
        reason: true,
        reviewedAdmin:{
          select: {
            username: true
          }
        },
        reviewedAt: true,
        resident: {
          select: {
            id: true,
            fullname: true,
            nationalId: true,
            phoneNumber: true,
            dateOfBirth: true,
            relationshipToHead: true,
            placeOfOrigin: true,
            workingAdress: true,
            occupation: true,
          }
        }
      },
    })
  }
  async paginateTempResident(options: {
    status: InformationStatus;
    page: number;
    limit: number;
    sortBy: string;
    order: 'asc' | 'desc';
    keyword?: string;
  }) {
    const { status, page, limit, sortBy, order, keyword } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      informationStatus: status,
    };

    if (keyword) {
      where.resident = {
        OR: [
          {
            fullname: {
              contains: keyword,
              mode: 'insensitive', // không phân biệt hoa thường
            },
          },
          {
            nationalId: {
              contains: keyword,
            },
          },
        ],
      };
    }


    // ---- Parse sortBy để Prisma hiểu ----
    let orderBy: any = {};

    if (sortBy.includes(".")) {
      // Sort theo quan hệ: resident.fullname
      const [relation, field] = sortBy.split(".");
      orderBy = {
        [relation]: {
          [field]: order,
        },
      };
    } else {
      // Sort theo field của bảng gốc
      orderBy = {
        [sortBy]: order,
      };
    }

    return this.prisma.$transaction(async (tx) => {
      const [data, total] = await Promise.all([
        tx.temporaryResident.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            submittedAt: true,
            householdId: true,
            resident: {
              select: {
                id: true,
                fullname: true,
                nationalId: true,
              },
            },
          },
          orderBy,
        }),

        tx.temporaryResident.count(),
      ]);

      return {
        data: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          items: data,
        },
      };
    });
  }

  async updateTempResidentStatus(
    regisId: number,
    status: { informationStatus: InformationStatus; rejectReason?: string },
    adminId: number
  ) {
    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {
        informationStatus: status.informationStatus,
      };

      if (status.rejectReason) {
        updateData.rejectReason = status.rejectReason;
      }

      const record = await tx.temporaryResident.update({
        where: { id: regisId },
        data: {
          ...updateData,
          reviewedAdminId: adminId,
          reviewedAt: new Date()
        },
      });

      await tx.resident.update({
        where: { id: record.residentId },
        data: { informationStatus: status.informationStatus },
      });

      return record;
    });
  }
  async paginateTempAbsence(options: {
    status: InformationStatus
    page: number;
    limit: number;
    sortBy: string; // vd: "submittedAt" hoặc "resident.fullname"
    order: 'asc' | 'desc';
    keyword?: string;
  }) {
    const {status, page, limit, sortBy, order, keyword } = options;
    const skip = (page - 1) * limit;

    let orderBy: any = {};
    if (sortBy.includes(".")) {
      const [relation, field] = sortBy.split(".");
      orderBy = {
        [relation]: {
          [field]: order,
        },
      };
    } else {
      orderBy = {
        [sortBy]: order,
      };
    }

    const where: any = {
      informationStatus: status,
    };

    if (keyword) {
      where.resident = {
        OR: [
          {
            fullname: {
              contains: keyword,
              mode: 'insensitive', // không phân biệt hoa thường
            },
          },
          {
            nationalId: {
              contains: keyword,
            },
          },
        ],
      };
    }

    return this.prisma.$transaction(async (tx) => {
      const [data, total] = await Promise.all([
        tx.temporaryAbsence.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            submittedAt: true,
            resident: {
              select: {
                id: true,
                fullname: true,
                nationalId: true,
                houseHoldId: true,
              },
            },
          },
          orderBy,
        }),

        tx.temporaryResident.count(),
      ]);

      return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        data,
      };
    });
  }
  async getDetailTempAbsence(registrationId: number){
    return this.prisma.temporaryAbsence.findFirstOrThrow({
      where: {id: registrationId},
      select:{
        id: true,
        startDate: true,
        endDate: true,
        submittedAt: true,
        reason: true,
        destination: true,
        reviewedAdmin:{
          select: {
            username: true
          }
        },
        reviewedAt: true,
        resident: {
          select: {
            id: true,
            fullname: true,
            nationalId: true,
            phoneNumber: true,
            dateOfBirth: true,
            relationshipToHead: true,
            placeOfOrigin: true,
            workingAdress: true,
            occupation: true,
            houseHoldId: true,
          }
        }
      },
    })
  }

  async updateTempAbsenceStatus(
    regisId: number,
    status: { informationStatus: InformationStatus; rejectReason?: string },
    adminId: number
  ) {
    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {
        informationStatus: status.informationStatus,
      };

      if (status.rejectReason) {
        updateData.rejectReason = status.rejectReason;
      }

      const record = await tx.temporaryAbsence.update({
        where: { id: regisId },
        data: {
          ...updateData,
          reviewedAdminId: adminId,
          reviewedAt: new Date()
        },
      });

      await tx.resident.update({
        where: { id: record.residentId },
        data: { informationStatus: status.informationStatus },
      });

      return record;
    });
  }

  async findTempAbsenceByNationalId(nationalId: string, status: InformationStatus){
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.resident.findFirstOrThrow({
        where: {nationalId}
      })
      return tx.temporaryAbsence.findMany({
        where: {
          residentId: record.id,
          informationStatus: status,
        }
      })
    })
  }
}