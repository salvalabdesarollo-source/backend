import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scan } from './scan.entity';
import { ScansController } from './scans.controller';
import { ScansService } from './scans.service';
import { ScansGateway } from './scans.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Scan])],
  controllers: [ScansController],
  providers: [ScansService, ScansGateway],
  exports: [ScansService],
})
export class ScansModule {}
