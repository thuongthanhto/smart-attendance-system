import { IsString, Matches, MaxLength, IsOptional } from 'class-validator';

export class CreateBranchWifiDto {
  @IsString()
  @Matches(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/, {
    message: 'BSSID phải đúng định dạng MAC (XX:XX:XX:XX:XX:XX)',
  })
  bssid: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}
