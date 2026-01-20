import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDoctorDto {
  @ApiPropertyOptional({
    description: 'Doctor name',
    example: 'Dr. John Smith',
  })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    description: 'Doctor phone number',
    example: '+1 555 123 4567',
  })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Clinic reference (by id)',
    example: { id: 1 },
    type: Object,
  })
  @IsObject()
  @IsOptional()
  clinic?: { id: number };
}
