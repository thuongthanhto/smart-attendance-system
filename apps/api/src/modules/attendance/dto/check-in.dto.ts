import {
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
} from 'class-validator';

export class CheckInDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsString()
  bssid?: string;

  @IsString()
  @MinLength(1)
  deviceId: string;

  /** Android: true if GPS comes from mock provider */
  @IsOptional()
  @IsBoolean()
  isFromMockProvider?: boolean;
}
