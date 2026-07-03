import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../users/user.entity';

export type PushNotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private enabled = false;

  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  onModuleInit() {
    if (getApps().length > 0) {
      this.enabled = true;
      return;
    }

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (!serviceAccountPath) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_PATH is not configured. Push notifications disabled.');
      return;
    }

    const resolvedPath = path.resolve(serviceAccountPath);
    if (!fs.existsSync(resolvedPath)) {
      this.logger.warn(`Firebase service account file not found at ${resolvedPath}`);
      return;
    }

    try {
      const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
      initializeApp({
        credential: cert(serviceAccount),
      });
      this.enabled = true;
      this.logger.log('Firebase Admin initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin', error);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async sendToUser(
    user: Pick<User, 'id' | 'FCM_token'>,
    payload: PushNotificationPayload,
  ): Promise<boolean> {
    if (!user.FCM_token) {
      this.logger.warn(`User ${user.id} has no FCM_token`);
      return false;
    }

    return this.sendToToken(user.id, user.FCM_token, payload);
  }

  async sendToToken(
    userId: number,
    token: string,
    payload: PushNotificationPayload,
  ): Promise<boolean> {
    if (!this.enabled) {
      this.logger.warn('Push notification skipped because Firebase is disabled');
      return false;
    }

    try {
      await getMessaging().send({
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        android: { priority: 'high' },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      });
      return true;
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        this.logger.warn(`Invalid FCM token for user ${userId}. Clearing token.`);
        await this.usersRepository.update(userId, { FCM_token: null });
        return false;
      }

      this.logger.error(`Failed to send push notification to user ${userId}`, error);
      return false;
    }
  }
}
