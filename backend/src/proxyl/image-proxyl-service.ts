// image-proxy.service.ts + controller
import { Injectable, BadRequestException } from '@nestjs/common';
import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import axios from 'axios';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

// ─── Validation ──────────────────────────────────────────────────────────────
@Injectable()
export class ImageProxyService {
  async validateLogoUrl(url: string): Promise<void> {
    let res: { status: number; headers: Record<string, string> };
    try {
      res = await axios.head(url, { timeout: 5000 });
    } catch {
      throw new BadRequestException(`Logo URL unreachable: ${url}`);
    }

    if (res.status !== 200)
      throw new BadRequestException(`Logo URL returned status ${res.status}`);

    const contentType = res.headers['content-type'] ?? '';
    const mime = contentType.split(';')[0].trim();

    if (!ALLOWED_MIME_TYPES.includes(mime))
      throw new BadRequestException(`Invalid content-type: ${mime}`);
  }
}
