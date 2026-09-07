import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeadDto {
  @ApiProperty({ description: 'Property ID to enquire about' })
  @IsString()
  propertyId: string;

  @ApiPropertyOptional({ description: 'Optional initial message to owner' })
  @IsString()
  @IsOptional()
  message?: string;
}
