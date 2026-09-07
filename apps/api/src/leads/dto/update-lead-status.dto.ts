import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLeadStatusDto {
  @ApiProperty({
    enum: ['NEW', 'CONTACTED', 'VISIT_SCHEDULED', 'NEGOTIATION', 'BOOKING', 'COMPLETED', 'LOST'],
  })
  @IsEnum(['NEW', 'CONTACTED', 'VISIT_SCHEDULED', 'NEGOTIATION', 'BOOKING', 'COMPLETED', 'LOST'])
  status: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}
