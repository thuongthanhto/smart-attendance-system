import { IsString, MinLength } from 'class-validator';

export class CheckOutDto {
  @IsString()
  @MinLength(1)
  deviceId: string;
}
