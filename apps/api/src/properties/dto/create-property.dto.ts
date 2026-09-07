import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePropertyDto {
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;

  @ApiProperty({ enum: ['SELL', 'RENT', 'LEASE', 'PG'] })
  @IsEnum(['SELL', 'RENT', 'LEASE', 'PG']) purpose: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SOLD', 'RENTED', 'REJECTED', 'ARCHIVED', 'SUSPENDED'] })
  @IsEnum(['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SOLD', 'RENTED', 'REJECTED', 'ARCHIVED', 'SUSPENDED'])
  @IsOptional()
  status?: string;

  @ApiProperty({ enum: ['APARTMENT','INDEPENDENT_HOUSE','VILLA','PLOT','COMMERCIAL_OFFICE','COMMERCIAL_SHOP','COMMERCIAL_WAREHOUSE','FARM_HOUSE','STUDIO'] })
  @IsEnum(['APARTMENT','INDEPENDENT_HOUSE','VILLA','PLOT','COMMERCIAL_OFFICE','COMMERCIAL_SHOP','COMMERCIAL_WAREHOUSE','FARM_HOUSE','STUDIO'])
  propertyType: string;

  // Location
  @ApiPropertyOptional() @IsString() @IsOptional() addressLine1?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() addressLine2?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() locality?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() city?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() state?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() pincode?: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) latitude?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) longitude?: number;

  // Details
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) bhk?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) bathrooms?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) balconies?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) totalFloors?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) floorNumber?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) builtUpArea?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) carpetArea?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) plotArea?: number;

  @ApiPropertyOptional({ enum: ['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED'] })
  @IsEnum(['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED']) @IsOptional() furnishing?: string;

  @ApiPropertyOptional() @IsDateString() @IsOptional() availableFrom?: string;

  // Price
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) expectedPrice?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) pricePerSqft?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) monthlyRent?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) maintenanceCharges?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) securityDeposit?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) brokerageCharge?: number;

  // Media
  @ApiPropertyOptional({ type: [String] })
  @IsArray() @IsString({ each: true }) @IsOptional()
  photos?: string[];

  @ApiPropertyOptional()
  @IsArray() @IsOptional()
  documents?: Array<{ url: string; documentType: string; fileName: string }>;
}
