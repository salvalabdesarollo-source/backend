import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateClinicDto {
  @ApiPropertyOptional({
    description: 'Clinic name',
    example: 'Downtown Clinic',
  })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    description: 'Clinic address',
    example: '123 Main St, Springfield',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({
    description: 'Clinic latitude',
    example: 37.7749,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Clinic longitude',
    example: -122.4194,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  longitude?: number;
}
