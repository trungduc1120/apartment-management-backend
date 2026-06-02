import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards, Query, Req, ParseEnumPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorater';
import {Role, State} from '@prisma/client';
import {ApproveHouseholdChangeDto} from "./ApproveHouseholdChange";
import {UpdateAccountDto} from "./dto/update-account";

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() data: CreateUserDto) {
    return this.userService.createUser(data);
  }

  @Patch(':id/update-role')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserRoleDto) {
    return this.userService.updateRole(id, dto);
  }

  @Post('/create-accounts')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  createAccounts(@Body('num', ParseIntPipe) num: number) {
    return this.userService.createAccounts(num);
  }

  @Get('/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  getUsers(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('search') search?: string,
    @Query('state', new ParseEnumPipe(State, { optional: true }))
    state?: State,
  ) {
    return this.userService.getUsers(page, limit, search, state);
  }


  @Get('/setting')
  @UseGuards(AuthGuard('jwt'))
  getSetting(@Req() req){
    return this.userService.getSetting(req.user.id)
  }

  @Patch('/setting/update')
  @UseGuards(AuthGuard('jwt'))
  updateAccount(
    @Req() req,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.userService.updateAccount(Number(req.user.id), dto);
  }
  @Delete('/delete-account')
  @UseGuards(AuthGuard('jwt'))
  deleteAccount(@Req() req){
    return this.userService.deleteAccount(req.user.id)
  }

  @Patch('role-update')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  setRole(
    @Body('userId') userId: number,
    @Body('role') role: Role
  ){
    return this.userService.setRole(userId, role)
  }

  @Get('/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  getDetails(@Param('id', ParseIntPipe) id: number  ) {
    return this.userService.userDetails(id);
  }

  @Delete('/delete')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  deleteMany(@Body('ids') ids: number[]) {
    return this.userService.deleteUsers(ids);
  }
  @Post('/reset-password/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  resetPassword(@Param('id', ParseIntPipe) id: number) {
    return this.userService.resetPassword(id);
  }
  @Post('/approve-household-change/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  approveHouseholdChange(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ApproveHouseholdChangeDto,
    @Req() req
  ) {
    return this.userService.approveHouseholdChange(
      req.user.id,
      id,
      body.state,
      body.reason
    );
  }

  @Get('/details-household-change/:householdId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  getDetailsHouseholdChange(@Param('householdId', ParseIntPipe) householdId: number){
    return this.userService.getDetailsHouseholdChange(householdId);
  }

  @Get('/details-resident-change/:residentId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  getDetailsResidentChange(@Param('residentId', ParseIntPipe) residentId: number){
    return this.userService.getDetailsResidentChanges(residentId);
  }

  @Post('/approve-resident-change/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  approveResidentChange(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ApproveHouseholdChangeDto,
    @Req() req
  ) {
    return this.userService.approveResidentChange(
      req.user.id,
      id,
      body.state,
      body.reason
    );
  }
}
