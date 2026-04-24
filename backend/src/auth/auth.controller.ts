import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiKeyService } from './services/api-key.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  RegisterDto,
  LoginDto,
  WalletAuthDto,
  RefreshTokenDto,
  AuthResponseDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private apiKeyService: ApiKeyService,
  ) {}

  /**
   * Register a new user
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * Login with email and password
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * Authenticate using wallet signature (Web3)
   */
  @Post('wallet-auth')
  @HttpCode(HttpStatus.OK)
  async walletAuth(
    @Body() walletAuthDto: WalletAuthDto,
  ): Promise<AuthResponseDto> {
    return this.authService.walletAuth(walletAuthDto);
  }

  /**
   * Refresh access token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  /**
   * Logout user
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any, @Headers('authorization') authorization: string) {
    // Extract the token from the Authorization header
    const token = authorization?.startsWith('Bearer ') 
      ? authorization.substring(7) 
      : authorization;
    
    return this.authService.logout(req.user.userId, token);
  }

  /**
   * Get current authenticated user
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@Request() req: any) {
    return this.authService.getCurrentUser(req.user.userId);
  }

  /** Generate a new API key for the authenticated user */
  @Post('api-keys')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createApiKey(@Request() req: any, @Body('label') label?: string) {
    return this.apiKeyService.create(req.user.userId, label);
  }

  /** Revoke an API key owned by the authenticated user */
  @Delete('api-keys/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeApiKey(@Param('id') id: string, @Request() req: any) {
    return this.apiKeyService.revoke(id, req.user.userId);
  }
}
