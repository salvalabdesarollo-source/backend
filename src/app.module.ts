import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClinicsModule } from './modules/clinics/clinics.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { ScansModule } from './modules/scans/scans.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASS ?? 'postgres',
      database: process.env.DB_NAME ?? 'nestjs',
      autoLoadEntities: true,
      synchronize: true,
      logging: process.env.DB_LOGGING === 'true',
      ...(process.env.DB_SSL !== 'false' && {
        ssl: {
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
        },
      }),
      extra: {
        connectTimeout: 30000,
      },
    }),
    UsersModule,
    ClinicsModule,
    DoctorsModule,
    ScansModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
