import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RoleGuard } from './guards/role.guard';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { ApiKeyService } from './services/api-key.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../common/services/redis.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    PassportModule,
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: {
          expiresIn: 900, // 15 minutes in seconds (default)
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RoleGuard, TokenBlacklistService, ApiKeyService, ApiKeyGuard],
  exports: [AuthService, JwtStrategy, JwtAuthGuard, RoleGuard, PassportModule, ApiKeyService, ApiKeyGuard],
})
export class AuthModule {}
