import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Query,
  Patch,
  Delete,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GuildRoleGuard } from './guards/guild-role.guard';
import { GuildRoles } from './decorators/guild-roles.decorator';
import { GuildService } from './guild.service';
import { CreateGuildDto } from './dto/create-guild.dto';
import { UpdateGuildDto } from './dto/update-guild.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { ApproveInviteDto } from './dto/approve-invite.dto';
import { SearchGuildDto } from './dto/search-guild.dto';
import { GuildDetailsDto } from './dto/guild-details.dto';
import { validateImageFile } from '../common/utils/file-upload.validator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';

@Controller('guilds')
export class GuildController {
  constructor(private guildService: GuildService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateGuildDto, @Request() req: any) {
    return this.guildService.createGuild(dto, req.user.userId);
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<GuildDetailsDto> {
    return this.guildService.getGuild(id);
  }

  @Get('by-slug/:slug')
  async getBySlug(@Param('slug') slug: string): Promise<GuildDetailsDto> {
    return this.guildService.getBySlug(slug);
  }

  @Get()
  async search(@Query() query: SearchGuildDto) {
    return this.guildService.searchGuilds(
      query.q,
      query.page,
      query.size,
      query.sort,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseGuards(GuildRoleGuard)
  @GuildRoles('ADMIN', 'OWNER')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGuildDto,
    @Request() req: any,
  ) {
    return this.guildService.updateGuild(id, dto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @UseGuards(GuildRoleGuard)
  @GuildRoles('OWNER')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.guildService.deleteGuild(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/invite')
  @UseGuards(GuildRoleGuard)
  @GuildRoles('MODERATOR', 'ADMIN', 'OWNER')
  async invite(
    @Param('id') id: string,
    @Body() dto: InviteMemberDto,
    @Request() req: any,
  ) {
    return this.guildService.inviteMember(id, dto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/revoke')
  @UseGuards(GuildRoleGuard)
  @GuildRoles('MODERATOR', 'ADMIN', 'OWNER')
  async revoke(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    // body may contain token or userId
    if (body.token)
      return this.guildService.revokeInviteByToken(
        id,
        body.token,
        req.user.userId,
      );
    if (body.userId)
      return this.guildService.revokeInviteForUser(
        id,
        body.userId,
        req.user.userId,
      );
    return { error: 'token or userId required' };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/resend-invite')
  @UseGuards(GuildRoleGuard)
  @GuildRoles('MODERATOR', 'ADMIN', 'OWNER')
  async resendInvite(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    // body must contain userId
    const userId = body.userId;
    if (!userId) return { error: 'userId required' };

    const membership = await this.guildService[
      'prisma'
    ].guildMembership.findUnique({
      where: { userId_guildId: { userId, guildId: id } },
    });
    if (!membership) return { error: 'Invite not found' };
    if (membership.status !== 'PENDING')
      return { error: 'Not a pending invite' };

    // resend the invite token by email
    const token = membership.invitationToken;
    const user = await this.guildService['prisma'].user.findUnique({
      where: { id: userId },
    });
    const guild = await this.guildService['prisma'].guild.findUnique({
      where: { id },
    });
    if (user?.email && token) {
      await (this.guildService as any).mailer.sendInviteEmail(
        user.email,
        guild?.name || 'a guild',
        token,
        undefined,
      );
      return { success: true };
    }
    return { error: 'No email or token to resend' };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveInviteDto,
    @Request() req: any,
  ) {
    if (dto.token)
      return this.guildService.approveInviteByToken(
        id,
        dto.token,
        req.user.userId,
      );
    // If no token provided, try to approve the pending invite for the requester
    return this.guildService.approveInviteForUser(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  async join(@Param('id') id: string, @Request() req: any) {
    return this.guildService.joinGuild(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/leave')
  async leave(@Param('id') id: string, @Request() req: any) {
    return this.guildService.leaveGuild(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/assign-role/:userId')
  @UseGuards(GuildRoleGuard)
  @GuildRoles('ADMIN', 'OWNER')
  async assignRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.guildService.assignRole(id, userId, body.role, req.user.userId);
  }

  /**
   * Upload guild logo
   * Accepts multipart/form-data with a single "file" field.
   * File must be JPEG, PNG, or WebP format and less than 5MB.
   */
  @Post(':id/logo')
  @UseGuards(JwtAuthGuard, GuildRoleGuard)
  @GuildRoles('ADMIN', 'OWNER')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Logo image file (JPEG, PNG, or WebP, max 5MB)',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload guild logo' })
  @ApiParam({ name: 'id', description: 'Guild ID (UUID)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logo uploaded successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file size or type',
  })
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Request() req: any,
  ) {
    // Validate file before passing to service
    validateImageFile(file);

    const result = await this.guildService.updateGuildLogo(
      id,
      file,
      req.user.userId,
    );
    return {
      logoUrl: result.logoUrl,
      message: 'Guild logo updated successfully',
    };
  }

  /**
   * Upload guild banner
   * Accepts multipart/form-data with a single "file" field.
   * File must be JPEG, PNG, or WebP format and less than 5MB.
   */
  @Post(':id/banner')
  @UseGuards(JwtAuthGuard, GuildRoleGuard)
  @GuildRoles('ADMIN', 'OWNER')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Banner image file (JPEG, PNG, or WebP, max 5MB)',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload guild banner' })
  @ApiParam({ name: 'id', description: 'Guild ID (UUID)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Banner uploaded successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file size or type',
  })
  async uploadBanner(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Request() req: any,
  ) {
    // Validate file before passing to service
    validateImageFile(file);

    const result = await this.guildService.updateGuildBanner(
      id,
      file,
      req.user.userId,
    );
    return {
      bannerUrl: result.bannerUrl,
      message: 'Guild banner updated successfully',
    };
  }
}
