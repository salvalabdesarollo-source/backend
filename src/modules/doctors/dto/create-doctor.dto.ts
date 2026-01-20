import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString, MaxLength } from 'class-validator';

export class CreateDoctorDto {
  @ApiProperty({
    description: 'Doctor name',
    example: 'Dr. John Smith',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({
    description: 'Doctor phone number',
    example: '+1 555 123 4567',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  phone: string;

  @ApiProperty({
    description: 'Clinic reference (by id)',
    example: { id: 1 },
    type: Object,
  })
  @IsObject()
  @IsNotEmpty()
  clinic: { id: number };
}
