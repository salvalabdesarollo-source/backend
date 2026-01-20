import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ScanStatus } from '../enums/scan-status.enum';

export class CreateScanDto {
  @ApiProperty({
    description: 'Scan date and time (ISO 8601)',
    example: '2026-01-18 14:30:00',
  })
  @IsNotEmpty()
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
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isScanned?: boolean;

  @ApiPropertyOptional({
    description: 'Scan status',
    enum: ScanStatus,
    example: ScanStatus.UNCONFIRMED,
    default: ScanStatus.UNCONFIRMED,
  })
  @IsEnum(ScanStatus)
  @IsOptional()
  status?: ScanStatus;

  @ApiProperty({
    description: 'User who created the scan (by id)',
    example: { id: 1 },
    type: Object,
  })
  @IsObject()
  @IsNotEmpty()
  createdBy: { id: number };

  @ApiPropertyOptional({
    description: 'User assigned to execute the scan (by id)',
    example: { id: 2 },
    type: Object,
  })
  @IsObject()
  @IsOptional()
  assignedTo?: { id: number } | null;

  @ApiProperty({
    description: 'Doctor who requested the scan (by id)',
    example: { id: 3 },
    type: Object,
  })
  @IsObject()
  @IsNotEmpty()
  requestedByDoctor: { id: number };
}
