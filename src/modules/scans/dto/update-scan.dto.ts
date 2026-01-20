import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ScanStatus } from '../enums/scan-status.enum';

export class UpdateScanDto {
  @ApiPropertyOptional({
    description: 'Scan date and time (ISO 8601)',
    example: '2026-01-18 14:30:00',
  })
  @IsString()
  @IsOptional()
  dateTime: string;

  @ApiPropertyOptional({
    description: 'Scan detail',
    example: 'Initial assessment',
  })
  @IsString()
  @IsOptional()
  detail?: string;

  @ApiPropertyOptional({
    description: 'Whether the scan has been completed',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isScanned?: boolean;

  @ApiPropertyOptional({
    description: 'Scan status',
    enum: ScanStatus,
    example: ScanStatus.CONFIRMED,
  })
  @IsEnum(ScanStatus)
  @IsOptional()
  status?: ScanStatus;

  @ApiPropertyOptional({
    description: 'User who created the scan (by id)',
    example: { id: 1 },
    type: Object,
  })
  @IsObject()
  @IsOptional()
  createdBy?: { id: number };

  @ApiPropertyOptional({
    description: 'User assigned to execute the scan (by id)',
    example: { id: 2 },
    type: Object,
  })
  @IsObject()
  @IsOptional()
  assignedTo?: { id: number };

  @ApiPropertyOptional({
    description: 'Doctor who requested the scan (by id)',
    example: { id: 3 },
    type: Object,
  })
  @IsObject()
  @IsOptional()
  requestedByDoctor?: { id: number };
}
