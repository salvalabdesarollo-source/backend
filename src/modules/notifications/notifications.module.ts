import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Scan } from '../scans/scan.entity';
import { NotificationsService } from './notifications.service';
import { ScanFollowUpReminderService } from './scan-follow-up-reminder.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Scan])],
  controllers: [NotificationsController],
  providers: [NotificationsService, ScanFollowUpReminderService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
