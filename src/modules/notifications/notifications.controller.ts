import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../core/guards/admin-auth.guard';
import { SendTestNotificationDto } from './dto/send-test-notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('test')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  async sendTestNotification(@Body() dto: SendTestNotificationDto) {
    return await this.notificationsService.sendTestNotification(dto);
  }
}
