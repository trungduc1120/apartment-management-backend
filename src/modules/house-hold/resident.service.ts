import {BadRequestException, ConflictException, ForbiddenException, Injectable, UseGuards} from '@nestjs/common';
import {PrismaService} from "../../shared/prisma/prisma.service";
import {CreateResidentDto} from "./dto/create-resident.dto";
import {Actions, InformationStatus, RelationshipToHead, ResidenceStatus} from "@prisma/client";
import {AuthGuard} from "@nestjs/passport";

@Injectable()
export class ResidentService {
  constructor(private readonly prisma: PrismaService) {}

  async createResident(userId: number, dto: CreateResidentDto){
    return this.prisma.$transaction(async (tx) => {
      // convert string "YYYY-MM-DD" sang Date object
      const dob = new Date(dto.dateOfBirth);
      const record = await tx.resident.create({
        data: {
          ...dto,
          dateOfBirth: dob,
        },
      });
      await tx.residentChanges.create({
          data: {
            residentId: record.id,
            action: Actions.CREATE,
            submitUserId: userId,
            informationStatus: InformationStatus.PENDING,
            submitAt: new Date(),
          },
        });
      return record
    })
  }

  async assignHouseHold(id: number, houseHoldId: number){
    return this.prisma.resident.update({
      where: {id},
      data: {houseHoldId}
    })
  }

  async getResidentByHouseHoldId(houseHoldId: number){
    // Lấy tất cả resident có houseHoldId trùng với household.id
    return this.prisma.resident.findMany({
      where: {
        houseHoldId,
        residentStatus: {
          in: ["NORMAL", "TEMP_ABSENT"]
        }
      }
    });
  }
  async deleteResident(userId: number, id: number, householdId: number, reason: string){
    return this.prisma.$transaction(async (tx) => {
      const res = await tx.resident.findFirstOrThrow({
        where: { id },
      });

      if (res.houseHoldId !== householdId) {
        throw new ForbiddenException('You are not allow to delete this resident');
      }

      if (res.relationshipToHead === RelationshipToHead.HEAD) {
        throw new BadRequestException('The head of household cannot be deleted');
      }
      if(res.informationStatus == InformationStatus.PENDING){
        await tx.residentChanges.deleteMany({
          where: {residentId: id, informationStatus: InformationStatus.PENDING}
        })
        return tx.resident.delete({
          where: {id}
        })
      }
      // log thay đổi
      await tx.residentChanges.create({
        data: {
          residentId: id,
          action: Actions.DELETE,
          submitUserId: userId,
          updateReason: reason,
        },
      });

      // update trạng thái
      return tx.resident.update({
        where: { id },
        data: {
          informationStatus: InformationStatus.DELETING,
        },
      });
    });
  }
  async updateResident(userId: number, id: number, householdId: number,dto: Partial<CreateResidentDto>){
    return this.prisma.$transaction(async (tx) => {
      const res = await tx.resident.findFirst({
        where: {id}
      })
      if(!res || res.houseHoldId != householdId)
        throw new ForbiddenException('You are not allow to update this resident')

      if((res.relationshipToHead == RelationshipToHead.HEAD && dto.relationshipToHead != RelationshipToHead.HEAD) ||
        (res.relationshipToHead != RelationshipToHead.HEAD && dto.relationshipToHead == RelationshipToHead.HEAD))
        throw new ForbiddenException('You can not change this relationship')

      let updateData: Partial<CreateResidentDto> = { ...dto };
      if (dto.dateOfBirth) {
        (updateData as any).dateOfBirth = new Date(dto.dateOfBirth);
      }
      const { updateReason, ...data } = updateData
      const pending = await tx.residentChanges.findFirst({
        where: {
          residentId: id,
          informationStatus: InformationStatus.PENDING,
        },
      });

      if (pending) {
        // ✅ đã có pending → update
        await tx.residentChanges.update({
          where: { id: pending.id },
          data: {
            action: Actions.UPDATE,
            submitUserId: userId,
            submitAt: new Date(),
            updateReason: dto.updateReason,
          },
        });
      } else {
        // ✅ chưa có pending → create
        await tx.residentChanges.create({
          data: {
            residentId: id,
            action: Actions.UPDATE,
            submitUserId: userId,
            informationStatus: InformationStatus.PENDING,
            submitAt: new Date(),
            updateReason: dto.updateReason,
          },
        });
      }

      data.informationStatus = InformationStatus.PENDING
      return tx.resident.update({ where: { id }, data: data });
    })
  }

  async findResidentByNationalId(nationalId: string) {
    const record = await this.prisma.resident.findFirstOrThrow({
      where: {
        nationalId,
      },
    });

    if (record.residentStatus === ResidenceStatus.NORMAL) {
      throw new ConflictException(
        "This resident already has permanent residence registration."
      );
    }

    if (record.residentStatus === ResidenceStatus.TEMP_RESIDENT) {
      throw new ConflictException(
        "This resident is already registered as a temporary resident."
      );
    }

    if (record.residentStatus === ResidenceStatus.TEMP_ABSENT) {
      throw new ConflictException(
        "This resident is currently registered as temporarily absent."
      );
    }

    return record;
  }

  async getResidentInHouseholdByStatus(householdId: number, status: ResidenceStatus[]){
    return this.prisma.resident.findMany({
      where: {
        houseHoldId: householdId,
        residentStatus: {in: status}
      }
    })
  }
}
