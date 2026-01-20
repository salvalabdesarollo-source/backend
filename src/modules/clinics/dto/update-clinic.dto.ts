import { ApiPropertyOptional } from '@nestjs/swagger';
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
  @IsNumber()
  @IsOptional()
  latitude?: number;
  
  @ApiPropertyOptional({
    description: 'Clinic longitude',
    example: -122.4194,
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}
