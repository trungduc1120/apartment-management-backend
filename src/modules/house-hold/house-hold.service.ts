import {ConflictException, ForbiddenException, Head, Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from "../../shared/prisma/prisma.service";
import {CreateHouseHoldAndHeadDto} from "./dto/create-house-hold-and-head.dto";
import {Actions, HouseHoldStatus, InformationStatus, RelationshipToHead} from "@prisma/client";
import {CreateResidentDto} from "./dto/create-resident.dto";
import {UserService} from "../user/user.service";
import {ResidentService} from "./resident.service";
import {CreateHouseHoldDto} from "./dto/create-house-hold.dto";
import { AdminGateway } from 'src/websocket/admin.gateway';
import {UpdateHouseHoldDto} from "./dto/UpdateHouseHoldDto";

@Injectable()
export class HouseHoldService {
  constructor(private readonly prisma: PrismaService,
              private readonly residentService: ResidentService,
              private readonly userService: UserService,
              private readonly adminGateway: AdminGateway
  ) {}

  async createWithUserAndResident(userId: number, dto: CreateHouseHoldAndHeadDto) {
    //flow: tạo resident -> household (với user và resident đã tạo)
    // liên kết resident với house hold
    dto.resident.relationshipToHead = RelationshipToHead.HEAD
    const resident = await this.residentService.createResident(userId, dto.resident);

    const household = await this.prisma.houseHolds.create({
      data: {
        houseHoldCode: dto.household.houseHoldCode,
        apartmentNumber: dto.household.apartmentNumber,
        buildingNumber: dto.household.buildingNumber,
        street: dto.household.street,
        ward: dto.household.ward,
        province: dto.household.province,
        status: HouseHoldStatus.ACTIVE,
        numCars: dto.household.numCars,
        numMotorbike: dto.household.numMotorbike,
        account: { connect: { id: userId } },  // connect user
        head: { connect: { id: resident.id } }, // connect resident chủ hộ
      },
    });
    await this.userService.updateHouseholdId(userId, household.id)
    await this.residentService.assignHouseHold(resident.id, household.id);
    resident.houseHoldId = household.id;
    await this.prisma.users.update({
      where: {id: userId},
      data: {
        state: "ACTIVE"
      }
    })
    const pending = await this.prisma.householdChanges.findFirst({
      where: {
        householdId: household.id,
        informationStatus: InformationStatus.PENDING,
      },
    });

    if (pending) {
      // ✅ đã có pending → update
      await this.prisma.householdChanges.update({
        where: { id: pending.id },
        data: {
          action: Actions.CREATE,
          submitUserId: userId,
          submitAt: new Date(),
        },
      });
    } else {
      // ✅ chưa có pending → create
      await this.prisma.householdChanges.create({
        data: {
          householdId: household.id,
          action: Actions.CREATE,
          submitUserId: userId,
          informationStatus: InformationStatus.PENDING,
          submitAt: new Date(),
        },
      });
    }

    await this.prisma.residentChanges.create({
      data: {
        residentId: resident.id,
        action: Actions.CREATE,
        submitUserId: userId,
      }
    })
    await this.adminGateway.notifyHouseholdUpdated({
      action: 'create',
      household,
      resident,
    });

    return { household, resident }
  }

  async addHouseMember(userId: number,householdId: number, dto: CreateResidentDto){
    const household = await this.prisma.houseHolds.findFirst({
      where: { id: householdId }
    })
    if(!household)
      throw new NotFoundException(`Household with id ${householdId} not found`)

    if(household.headID && dto.relationshipToHead == RelationshipToHead.HEAD)
      throw new ConflictException("This Household already has head")

    dto.houseHoldId = householdId;

    const newMember =
      await this.residentService.createResident(userId, dto);

    this.adminGateway.notifyHouseholdUpdated({
      action:'add_member',
      householdId,
      resident: newMember,
    })

    return newMember;
  }
  async getAllMember(householdId: number){
    return this.residentService.getResidentByHouseHoldId(householdId)
  }
  async deleteMember(userId: number, residentId: number, householdId: number, reason: string) {
    const deleted =
      await this.residentService.deleteResident(userId, residentId, householdId, reason);

    this.adminGateway.notifyHouseholdUpdated({
      action: 'delete_member',
      householdId,
      residentId,
    });

    return deleted;
  }
  async updateMember(userId: number, residentId: number, householdId: number, dto: Partial<CreateResidentDto>){
    const updated = await this.residentService.updateResident(userId, residentId, householdId, dto);
    this.adminGateway.notifyHouseholdUpdated({
      action: 'update_member',
      householdId,
      resident: updated,
    });

    return updated;
  }

  async getHouseholdId(userID:number){
    // return this.prisma.houseHolds.findFirstOrThrow({
    //   where: {userID}
    // })
    const household = await this.prisma.houseHolds.findFirstOrThrow({
      where: {userID}
    })
    const head = await this.prisma.resident.findFirstOrThrow({
      where: {id: (household).headID}
    })
    return {household, head}
  }

  async updateHousehold(userId: number, id: number, data: UpdateHouseHoldDto){
    //console.log(userId, id)
    const oldHousehold = await this.prisma.houseHolds.findFirstOrThrow({
      where:{id}
    })
    //data.headID = Number(data.headID)
     if (data.headID !== undefined && data.headID !== null) {
        data.headID = Number(data.headID);

    // nếu headID không hợp lệ => bỏ qua
        if (isNaN(data.headID)) {
          delete data.headID;
        }
    }
    //neu update chu ho
    if(data.headID != undefined && oldHousehold.headID != data.headID){
      // data.headID = +data.headID
      const resident = await this.prisma.resident.findFirstOrThrow({
        where: {id: data.headID}
      })

      if(resident.houseHoldId != id){
        throw new ForbiddenException("This residence is not in this household")
      }
      // resident hien tai thanh other
      await this.prisma.resident.update({
        where: {id: oldHousehold.headID},
        data: {relationshipToHead: RelationshipToHead.OTHER}
      })

      const newHead = await this.prisma.resident.update({
        where: {id: data.headID},
        data:{relationshipToHead: RelationshipToHead.HEAD}
      })
    }
    data.informationStatus = "PENDING"
    const { updateReason, ...householdData } = data; // tách ra
    const pending = await this.prisma.householdChanges.findFirst({
      where: {
        householdId: id,
        informationStatus: InformationStatus.PENDING,
      },
    });

    if (pending) {
      // ✅ đã có pending → update
      await this.prisma.householdChanges.update({
        where: { id: pending.id },
        data: {
          action: Actions.UPDATE,
          submitUserId: userId,
          submitAt: new Date(),
          updateReason
        },
      });
    } else {
      // ✅ chưa có pending → create
      await this.prisma.householdChanges.create({
        data: {
          householdId: id,
          action: Actions.UPDATE,
          submitUserId: userId,
          informationStatus: InformationStatus.PENDING,
          submitAt: new Date(),
          updateReason
        },
      });
    }

    const updateHousehold = await this.prisma.houseHolds.update({
      where: { id },
      data: householdData
    })

    this.adminGateway.notifyHouseholdUpdated({
      action:'update',
      household: updateHousehold,
    });
    return updateHousehold
  }
}
