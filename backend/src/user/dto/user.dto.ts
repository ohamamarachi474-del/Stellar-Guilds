import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  Matches,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const trimAndLowercase = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
}

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @Transform(trimAndLowercase)
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Unique username', example: 'stellarbuilder' })
  @Transform(trimString)
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username!: string;

  @ApiProperty({ description: 'User password', example: 'StrongPassword123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ description: 'User first name', example: 'Ada' })
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ description: 'User last name', example: 'Lovelace' })
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({
    description: 'Optional wallet address',
    example: '0x1111111111111111111111111111111111111111',
  })
  @Transform(trimString)
  @IsOptional()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'walletAddress must be a valid Ethereum address',
  })
  walletAddress?: string;
}

// Get user profile (public)
export class UserProfileDto {
  @ApiProperty({ description: 'User ID' })
  id!: string;

  @ApiProperty({ description: 'Username' })
  username!: string;

  @ApiProperty({ description: 'First name' })
  firstName!: string;

  @ApiProperty({ description: 'Last name' })
  lastName!: string;

  @ApiPropertyOptional({ description: 'User bio' })
  bio?: string;

  @ApiPropertyOptional({ description: 'User location' })
  location?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Profile bio' })
  profileBio?: string;

  @ApiPropertyOptional({ description: 'Profile URL' })
  profileUrl?: string;

  @ApiPropertyOptional({ description: 'Discord handle' })
  discordHandle?: string;

  @ApiPropertyOptional({ description: 'Twitter handle' })
  twitterHandle?: string;

  @ApiPropertyOptional({ description: 'GitHub handle' })
  githubHandle?: string;

  @ApiProperty({ description: 'Account creation date' })
  createdAt!: Date;

  @ApiProperty({ description: 'User role', enum: UserRole })
  role!: UserRole;
}

// Update user profile
export class UpdateUserDto {
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  location?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  profileBio?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsUrl(
    { require_protocol: true },
    { message: 'profileUrl must be a valid URL with protocol' },
  )
  @MaxLength(2048)
  profileUrl?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  discordHandle?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  twitterHandle?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  githubHandle?: string;
}

export class UpdateUserProfileDto extends UpdateUserDto {}

export class UpdateBackgroundDto {
  @ApiProperty({
    description: 'IPFS CID for background image',
    example: 'QmX4zF8k9vN2pR7bT3jL6mW1qY5cH8dE0fG9aB2xK4iM7n',
  })
  @IsString()
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'backgroundCid must be a valid IPFS CID format',
  })
  @MinLength(1)
  @MaxLength(200)
  backgroundCid!: string;
}

// Change password
export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;

  @IsString()
  @MinLength(8)
  confirmPassword!: string;
}

// Assign role to user
export class AssignRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}

// Search and filter users
export class SearchUserDto {
  @IsOptional()
  @IsString()
  query?: string; // Search by username, email, firstName, lastName

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  skip?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  take?: number;
}

// Paginated user response
export class PaginatedUsersDto {
  data!: UserProfileDto[];
  total!: number;
  skip!: number;
  take!: number;
}

// Avatar upload response
export class AvatarUploadResponseDto {
  avatarUrl!: string;
  message!: string;
}

// Role and Permission DTOs
export class PermissionDto {
  id!: string;
  name!: string;
  description?: string;
}

export class RoleDto {
  id!: string;
  name!: string;
  description?: string;
  permissions?: PermissionDto[];
}

// User details (including sensitive info, admin only)
export class UserDetailsDto extends UserProfileDto {
  email!: string;
  walletAddress?: string;
  isActive!: boolean;
  lastLoginAt?: Date;
  updatedAt!: Date;
}
