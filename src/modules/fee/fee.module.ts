import { Module } from '@nestjs/common';
import { FeeService } from './fee.service';
import { FeeController } from './fee.controller';
import {FeeCronService} from "./fee.cron.service";
@Module({
  controllers: [FeeController],
  providers: [FeeService, FeeCronService],
  exports: [FeeService]
})
export class FeeModule {}
