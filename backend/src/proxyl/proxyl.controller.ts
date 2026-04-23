import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import axios from 'axios';
import { ImageProxyService } from './image-proxyl-service';
@Controller('proxy')
export class ImageProxyController {
  constructor(private readonly imageProxyService: ImageProxyService) {}

  @Get('image')
  async proxyImage(@Query('url') encodedUrl: string, @Res() res: Response) {
    const url = decodeURIComponent(encodedUrl);

    await this.imageProxyService.validateLogoUrl(url);

    const upstream = await axios.get(url, {
      responseType: 'stream',
      timeout: 10_000,
    });

    // Cast to string — axios types headers as a wide union but the value is always a string here
    const contentType =
      (upstream.headers['content-type'] as string) ?? 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    upstream.data.pipe(res);
  }
}
