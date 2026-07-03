import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scan } from '../scans/scan.entity';
import { ScanStatus } from '../scans/enums/scan-status.enum';
import { NotificationsService } from './notifications.service';

@Injectable()
export class ScanFollowUpReminderService {
  private readonly logger = new Logger(ScanFollowUpReminderService.name);

  constructor(
    @InjectRepository(Scan) private readonly scansRepository: Repository<Scan>,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('0 0,30 * * * *', {
    timeZone: 'America/Chihuahua',
  })
  async handleHalfHourReminder(): Promise<void> {
    const { slotStart, slotEnd } = this.getPreviousHalfHourWindow();

    this.logger.log(
      `Checking scans for follow-up reminder. Window: ${slotStart} -> ${slotEnd}`,
    );

    const scans = await this.scansRepository
      .createQueryBuilder('scan')
      .innerJoinAndSelect('scan.assignedTo', 'assignedTo')
      .leftJoinAndSelect('scan.requestedByDoctor', 'requestedByDoctor')
      .where('scan."isScanned" = false')
      .andWhere('scan.status = :status', { status: ScanStatus.CONFIRMED })
      .andWhere('scan."followUpReminderSent" = false')
      .andWhere('scan."assignedToId" IS NOT NULL')
      .andWhere('scan."dateTime" >= :slotStart', { slotStart })
      .andWhere('scan."dateTime" < :slotEnd', { slotEnd })
      .getMany();

    if (scans.length === 0) {
      this.logger.log('No scans found for follow-up reminder');
      return;
    }

    this.logger.log(`Found ${scans.length} scan(s) pending follow-up reminder`);

    for (const scan of scans) {
      if (!scan.assignedTo) {
        continue;
      }

      const doctorName = scan.requestedByDoctor?.name ?? 'el doctor';
      const sent = await this.notificationsService.sendToUser(scan.assignedTo, {
        title: 'Confirma el escaneo',
        body: `El escaneo programado a las ${this.formatDisplayTime(scan.dateTime)} con ${doctorName} sigue pendiente. Confírmalo en la app.`,
        data: {
          scanId: String(scan.id),
          action: 'scan_follow_up_reminder',
          dateTime: scan.dateTime,
        },
      });

      if (sent) {
        await this.scansRepository.update(scan.id, { followUpReminderSent: true });
        this.logger.log(`Follow-up reminder sent for scan ${scan.id}`);
        continue;
      }

      this.logger.warn(`Follow-up reminder not sent for scan ${scan.id}`);
    }
  }

  private getPreviousHalfHourWindow(): { slotStart: string; slotEnd: string } {
    const now = new Date();
    now.setSeconds(0, 0);
    now.setMilliseconds(0);

    const slotEnd = new Date(now);
    const slotStart = new Date(now.getTime() - 30 * 60 * 1000);

    return {
      slotStart: this.formatLocalDateTime(slotStart),
      slotEnd: this.formatLocalDateTime(slotEnd),
    };
  }

  private formatLocalDateTime(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  private formatDisplayTime(dateTime: string): string {
    const match = dateTime.match(/(\d{2}:\d{2})/);
    return match?.[1] ?? dateTime;
  }
}
