import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
  UseInterceptors, UploadedFile
} from '@nestjs/common';
import { FeeService } from './fee.service';
import { CreateFeeDto } from './dto/create-fee.dto';
import { CreateFeeAssignmentDto } from './dto/create-assignment.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorater';
import { RolesGuard } from 'src/common/guards/roles.guard';
import {Role} from "@prisma/client";
import {CreateAndAssignFeeDto} from "./dto/create-and-assign-fee.dto";
import {FileInterceptor} from "@nestjs/platform-express";

@Controller('fee')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FeeController {
  constructor(private readonly feeService: FeeService) {}

  @Roles ('ADMIN', Role.ACCOUNTANT)
  @Post('repeat')
  createFee(@Body() createFeeDto: CreateFeeDto) {
    return this.feeService.createFeeRepeat(createFeeDto);
  }

  //ok
  @Post('onetime-fee')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  createOneTimeFee(@Body() dto: CreateAndAssignFeeDto){
    return this.feeService.createOneTimeFee(dto)
  }

  @Get('repeat-fee')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  getRepeatFee(){
    return this.feeService.getRepeatFee()
  }

  @Delete('repeat-fee/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  deleteRepeatFee(@Param('id', ParseIntPipe) id: number){
    return this.feeService.deleteRepeatFee(id)
  }

  @Roles ('ADMIN', Role.ACCOUNTANT)
  @Post('assign')
  assign(@Body() dto: CreateFeeAssignmentDto) {
    return this.feeService.assignFee(dto);
  }

  //ok
  @Roles ('ADMIN', Role.ACCOUNTANT)
  @Get(':id/detail')
  detail(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isPaid') isPaid?: string, 
  ) {
    return this.feeService.getFeeDetail(id, { 
      page, 
      limit, 
      isPaid 
    });
  }


  @Roles ('ADMIN', Role.ACCOUNTANT)
  @Get(':id/:householdid/payment')
  householdPayment(
    @Param('id', ParseIntPipe) id: number,
    @Param('householdid', ParseIntPipe) householdid: number,
  ) {
    return this.feeService.getHouseholdPayment(id, householdid);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importFeeExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateAndAssignFeeDto
  ) {
    return this.feeService.createFeeFromExcel(file, dto);
  }

  @Get('household/:id')
  getHouseholdFees(@Param('id') id: string) {
    return this.feeService.getFeesOfHousehold(Number(id));
  }

  @Get('household/:id/paid')
  getPaid(@Param('id') id: string) {
    return this.feeService.getPaidFees(Number(id));
  }

  @Get('household/:id/unpaid')
  getUnpaid(@Param('id') id: string) {
    return this.feeService.getUnpaidFees(Number(id));
  }

  @Roles ('ADMIN', Role.ACCOUNTANT)
  @Get('all')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.feeService.findAll({
      page: page? Number(page) : 1,
      limit: limit ? Number(limit) : 5,
      search,
    });
  }


  @Roles ('ADMIN', Role.ACCOUNTANT)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
      return this.feeService.findOne(id);
  }

  @Roles ('ADMIN', Role.ACCOUNTANT)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateFeeDto>) {
    return this.feeService.updateFeeAssignment(Number(id), dto);
  }

  @Roles ('ADMIN', Role.ACCOUNTANT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feeService.remove(Number(id));
  }

  @Roles ('ADMIN', Role.ACCOUNTANT)
  @Post(':id/restart')
  restartFee(@Param('id', ParseIntPipe) id: number) {
    return this.feeService.restartFee(id);
  }
}
