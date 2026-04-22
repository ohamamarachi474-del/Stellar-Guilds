import {
  IsString,
  IsUrl,
  IsOptional,
  MaxLength,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for submitting a single work item (PR/commit) for a bounty
 */
export class WorkSubmissionDto {
  @IsNotEmpty({ message: 'PR URL is required' })
  @IsUrl(
    { require_protocol: true, require_tld: true },
    { message: 'Invalid PR/commit URL format' },
  )
  @MaxLength(2048, { message: 'PR URL must not exceed 2048 characters' })
  prUrl!: string;

  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  @MaxLength(5000, { message: 'Description must not exceed 5000 characters' })
  description!: string;
}

/**
 * DTO for submitting completed work for a bounty
 * Supports multiple PR submissions with descriptions and optional attachments
 */
export class SubmitBountyWorkDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkSubmissionDto)
  submissions!: WorkSubmissionDto[];

  @IsOptional()
  @IsArray()
  @IsUrl(
    { require_protocol: true, require_tld: true },
    { each: true, message: 'Each attachment URL must be a valid URL' },
  )
  @MaxLength(2048, {
    each: true,
    message: 'Each attachment URL must not exceed 2048 characters',
  })
  attachmentUrls?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'Additional comments must not exceed 1000 characters',
  })
  additionalComments?: string;
}
