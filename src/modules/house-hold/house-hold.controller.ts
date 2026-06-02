import {Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req} from '@nestjs/common';
import { HouseHoldService } from './house-hold.service';
import {AuthGuard} from "@nestjs/passport";
import {CreateHouseHoldAndHeadDto} from "./dto/create-house-hold-and-head.dto";
import {CreateResidentDto} from "./dto/create-resident.dto";
import {CreateHouseHoldDto} from "./dto/create-house-hold.dto";
import {ResidentService} from "./resident.service";
import {UpdateHouseHoldDto} from "./dto/UpdateHouseHoldDto";

@Controller('house-hold')
export class HouseHoldController {
  constructor(private readonly houseHoldService: HouseHoldService,
              private readonly residentService: ResidentService
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Req() req,@Body() dto: CreateHouseHoldAndHeadDto) {
    return this.houseHoldService.createWithUserAndResident(req.user.id, dto);
  }

  @Post('addmember')
  @UseGuards(AuthGuard('jwt'))
  addHouseMember(@Req() req, @Body() dto: CreateResidentDto){
    return this.houseHoldService.addHouseMember(req.user.id, req.user.householdId, dto);
  }
  @Get()
  @UseGuards(AuthGuard('jwt'))
  getHouseHold(@Req() req){
    return this.houseHoldService.getHouseholdId(req.user.id)
  }
  @Get('member')
  @UseGuards(AuthGuard('jwt'))
  getResidentByHouseHoldId(@Req() req){
    return this.houseHoldService.getAllMember(req.user.householdId);
  }

  @Patch('member/:residentId')
  @UseGuards(AuthGuard('jwt'))
  updateHouseMember(
    @Req() req,
    @Param('residentId') residentId: string,
    @Body() dto: Partial<CreateResidentDto>
  ) {
    return this.houseHoldService.updateMember(req.user.id, Number(residentId), req.user.householdId, dto);
  }

  @Delete('member/:residentId')
  @UseGuards(AuthGuard('jwt'))
  deleteHouseMember(
    @Req() req,
    @Param('residentId') residentId: string,
    @Body('reason') reason: string,
    ) {
    return this.houseHoldService.deleteMember(
      req.user.id,
      Number(residentId),
      req.user.householdId,
      reason
    );
  }
  @Get('temp-resident/:nationalId')
  @UseGuards(AuthGuard('jwt'))
  async getResidentByNationalId(@Param('nationalId') nationalId: string){
    return this.residentService.findResidentByNationalId(nationalId)
  }
  @Patch('update')
  @UseGuards(AuthGuard('jwt'))
  updateHousehold(@Req() req, @Body() dto: UpdateHouseHoldDto){
    //console.log(dto)
    return this.houseHoldService.updateHousehold(req.user.id, req.user.householdId, dto);
  }
}
