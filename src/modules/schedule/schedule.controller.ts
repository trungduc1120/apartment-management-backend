import {Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards} from "@nestjs/common";
import {ScheduleService} from "./schedule.service";

@Controller('registration')
export class ScheduleController {
  constructor(private readonly registrationService: ScheduleService) {}

}
