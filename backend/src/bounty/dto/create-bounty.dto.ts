import {
  IsString,
  IsOptional,
  IsNumber,
  IsDecimal,
  IsPositive,
  MaxLength,
  IsISO8601,
} from 'class-validator';
import { IsFutureDate } from '../decorators/future-date.decorator';

export class CreateBountyDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(5000)
  description!: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  rewardAmount?: number;

  @IsOptional()
  @IsString()
  rewardToken?: string;

  @IsOptional()
  @IsISO8601()
  @IsFutureDate({ message: 'Deadline must be a valid date in the future' })
  deadline?: string;

  @IsOptional()
  @IsString()
  guildId?: string;
}
