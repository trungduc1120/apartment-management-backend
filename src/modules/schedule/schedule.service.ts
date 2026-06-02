import {ConflictException, ForbiddenException, Injectable} from "@nestjs/common";
import {PrismaService} from "../../shared/prisma/prisma.service";


@Injectable()
export class ScheduleService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

}