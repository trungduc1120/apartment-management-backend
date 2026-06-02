import {Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards} from "@nestjs/common";
import {RegistrationService} from "./registration.service";
import {AuthGuard} from "@nestjs/passport";
import {RegisTempResidentDto} from "./dto/regis-temp-resident.dto";
import {RegisTempAndUpdateDto} from "./dto/regis-temp-and-update.dto";
import {RegisTempAbsentDto} from "./dto/regis-temp-absent";
import {CarriageReturnLineFeed} from "ts-loader/dist/constants";
import {RolesGuard} from "../../common/guards/roles.guard";
import {InformationStatus, Role} from "@prisma/client";
import {Roles} from "../../common/decorators/roles.decorater";

@Controller('registration')
export class RegistrationController{
  constructor(private readonly registrationService: RegistrationService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('tem-resident')
  async getAllTempResidentByHousehold(@Req() req){
    return this.registrationService.getAllTempResidentByHousehold(req.householdId)
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('tem-resident-firsttime')
  async createTempResident(@Req() req, @Body() dto: RegisTempResidentDto){
    return this.registrationService.createTempResidentFirstTime(dto, req.user.id, req.user.householdId)
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('tem-resident/:residentId')
  async createTempRegistration(@Req() req, @Param('residentId') residentId,@Body() dto: RegisTempAndUpdateDto){
    return this.registrationService.createTempRegistration(dto, Number(residentId), req.user.id, req.user.householdId)
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('tem-resident/:registrationId')
  async deleteTempRegistration(@Req() req, @Param('registrationId') registrationId: string){
    return this.registrationService.deleteTempResidentRegistration(Number(registrationId))
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('tem-resident/:registraionId')
  async updateTempResidentRegistration(
    @Req() req,
    @Param('registraionId') registraionId: string,
    @Body() dto: Partial<RegisTempAndUpdateDto>
  ){
    return this.registrationService.updateTempResidentRegistration(
      dto, Number(registraionId),
      req.user.householdId
    )
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('tem-absent')
  async getTemAbsentByHouseholdId(@Req() req){
    return this.registrationService.getTemAbsentByHouseholdId(req.user.householdId)
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('tem-absent')
  async createTempAbsentRegistraion(
    @Req() req,
    @Body() dto: RegisTempAbsentDto
  ){
    return this.registrationService.createTempAbsentRegistration(dto, req.user.id, req.user.householdId)
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('tem-absent/:registrationId')
  async deleteTempAbsentRegistraion(
    @Req() req,
    @Param('registrationId') registrationId: string
  ){
    return this.registrationService
      .deleteTempAbsentRegistraion(Number(registrationId), req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('tem-absent/:registrationId')
  async updateTempAbsentRegistraion(
    @Req() req,
    @Param('registrationId') registrationId: string,
    @Body() dto: Partial<RegisTempAbsentDto>
  ){
    return this.registrationService
      .updateTempAbsentRegistraion(dto, Number(registrationId), req.user.id);
  }

  @Get('admin/tem-resident')
  async getTempResidents(
    @Query('status') status: InformationStatus,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('sortBy') sortBy: string,
    @Query('order') order: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.registrationService.paginateTempResident({
      status,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sortBy: sortBy || 'submittedAt',
      order: order === 'asc' ? 'asc' : 'desc',
      keyword,
    });
  }


  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Get('admin/tem-resident/:registrationId')
  async getDetailTempResident(@Param('registrationId') registrationId: string){
    return this.registrationService
      .getDetailTempResident(Number(registrationId))
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Post('/admin/tem-resident/approve/:registrationId')
  async updateTempResidentStatus(
    @Param('registrationId') registrationId: string,
    @Body() dto: { informationStatus: InformationStatus; rejectReason?: string },
    @Req() req
  ){
    return this.registrationService.updateTempResidentStatus(Number(registrationId), dto, req.user.id)
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Get('admin/tem-absent')
  async getTempAbsence(
    @Query('status') status: InformationStatus,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('sortBy') sortBy: string,
    @Query('order') order: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.registrationService.paginateTempAbsence({
      status,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sortBy: sortBy || 'submittedAt',
      order: order === 'asc' ? 'asc' : 'desc',
      keyword,
    });
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Get('admin/tem-absent/:registrationId')
  async getDetailTempAbsence(@Param('registrationId') registrationId: string){
    return this.registrationService
      .getDetailTempAbsence(Number(registrationId))
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Post('/admin/tem-absent/approve/:registrationId')
  async updateTempAbsenceStatus(
    @Param('registrationId') registrationId: string,
    @Body() dto: { informationStatus: InformationStatus; rejectReason?: string },
    @Req() req
  ){
    return this.registrationService.updateTempAbsenceStatus(Number(registrationId), dto, req.user.id)
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Post('/admin/tem-absent/approve/:nationalId')
  async findTempAbsenceByNationalId(
    @Query('status') status: InformationStatus,
    @Param('nationalId') nationalId: string
  ){
    return this.registrationService.findTempAbsenceByNationalId(nationalId, status)
  }
}
