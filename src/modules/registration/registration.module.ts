import { Module } from '@nestjs/common';
import {RegistrationController} from "./registration.controller";
import {RegistrationService} from "./registration.service";
import {RegistrationCronService} from "./registration.cron.service";

@Module({
  controllers: [RegistrationController],
  providers: [RegistrationService, RegistrationCronService],
  imports: [],
})
export class RegistrationModule {}
