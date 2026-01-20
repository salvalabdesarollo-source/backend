import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

export class CreateClinicDto {
  @ApiProperty({
    description: 'Clinic name',
    example: 'Downtown Clinic',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({
    description: 'Clinic address',
    example: '123 Main St, Springfield',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address: string;
  
  @ApiProperty({
    description: 'Clinic latitude',
    example: 37.7749,
  })
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({
    description: 'Clinic longitude',
    example: -122.4194,
  })
  @IsNumber()
  @IsNotEmpty()
  longitude: number;
}
