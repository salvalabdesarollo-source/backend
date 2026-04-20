import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scan } from './scan.entity';
import { ScansController } from './scans.controller';
import { ScansService } from './scans.service';
import { ScansGateway } from './scans.gateway';
import { User } from '../users/user.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Clinic } from '../clinics/clinic.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Scan, User, Doctor, Clinic])],
  controllers: [ScansController],
  providers: [ScansService, ScansGateway],
  exports: [ScansService],
})
export class ScansModule {}
