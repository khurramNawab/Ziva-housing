import {
  IsString, IsOptional, IsEnum, IsNumber, IsArray, IsDateString,
  IsBoolean, Min, Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class PropertySearchDto {
  @ApiPropertyOptional() @IsString() @IsOptional() q?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() city?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() locality?: string;

  @ApiPropertyOptional({ enum: ['SELL', 'RENT', 'LEASE', 'PG'] })
  @IsEnum(['SELL', 'RENT', 'LEASE', 'PG']) @IsOptional() purpose?: string;

  @ApiPropertyOptional({ enum: ['APARTMENT', 'INDEPENDENT_HOUSE', 'VILLA', 'PLOT', 'COMMERCIAL_OFFICE', 'COMMERCIAL_SHOP', 'COMMERCIAL_WAREHOUSE', 'FARM_HOUSE', 'STUDIO'] })
  @IsOptional() propertyType?: string;

  @ApiPropertyOptional({ type: [Number], description: '1, 2, 3, 4, 5 BHK' })
  @IsOptional() @Transform(({ value }) => Array.isArray(value) ? value : [value])
  bhk?: number[];

  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) minPrice?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) maxPrice?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) minArea?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) maxArea?: number;

  @ApiPropertyOptional({ enum: ['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED'] })
  @IsOptional() furnishing?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  amenities?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  possession?: string;

  @ApiPropertyOptional()
  @IsOptional() @Transform(({ value }) => value === 'true')
  isZivaVerified?: boolean;

  @ApiPropertyOptional({ default: 1 }) @IsNumber() @IsOptional() @Type(() => Number) @Min(1) page?: number;
  @ApiPropertyOptional({ default: 20 }) @IsNumber() @IsOptional() @Type(() => Number) @Min(1) @Max(50) limit?: number;

  @ApiPropertyOptional({ enum: ['createdAt', 'expectedPrice', 'monthlyRent', 'builtUpArea'] })
  @IsOptional() sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional() sortOrder?: 'asc' | 'desc';
}
