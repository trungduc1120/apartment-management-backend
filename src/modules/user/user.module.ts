import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import {MailModule} from "../../common/mail/mail.module";

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [MailModule],
  exports: [UserService]
})
export class UserModule {}
