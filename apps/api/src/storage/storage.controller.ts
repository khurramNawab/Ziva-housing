import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';

@ApiTags('storage')
@ApiBearerAuth()
@Controller('storage')
export class StorageController {
  constructor(
    private storageService: StorageService,
    private config: ConfigService,
  ) { }

  @Public()
  @Post('upload-direct')
  @ApiOperation({ summary: 'Upload file / base64 directly to cloud storage' })
  async uploadDirect(
    @Body() body: { file: string; folder?: string },
  ) {
    const folder = body.folder || 'ziva_uploads';
    const url = await this.storageService.uploadDirect(body.file, folder);
    return { url };
  }

  @Public()
  @Post('upload-url')
  @ApiOperation({ summary: 'Get pre-signed S3 upload URL' })
  async getUploadUrl(
    @CurrentUser('id') currentUserId: string,
    @Req() req: any,
    @Body() body: { folder: 'photos' | 'documents'; filename: string; contentType: string },
  ) {
    let userId = currentUserId;
    if (!userId && req?.headers?.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.substring(7);
        const payloadStr = token.split('.')[1];
        if (payloadStr) {
          const payload = JSON.parse(Buffer.from(payloadStr, 'base64').toString('utf8'));
          userId = payload.sub || payload.id;
        }
      } catch {
        // ignore
      }
    }
    userId = userId || 'public';

    const bucket =
      body.folder === 'documents'
        ? this.config.get('S3_BUCKET_DOCUMENTS', 'Ziva-documents')
        : this.config.get('S3_BUCKET_PROPERTIES', 'Ziva-properties');

    return this.storageService.getUploadUrl(
      bucket,
      `${body.folder}/${userId}`,
      body.filename,
      body.contentType,
    );
  }

  @Public()
  @Post('cloudinary-params')
  @ApiOperation({ summary: 'Get signed Cloudinary upload params' })
  async getCloudinaryUploadParams(
    @CurrentUser('id') currentUserId: string,
    @Req() req: any,
    @Body() body: { folder?: string },
  ) {
    let userId = currentUserId;
    if (!userId && req?.headers?.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.substring(7);
        const payloadStr = token.split('.')[1];
        if (payloadStr) {
          const payload = JSON.parse(Buffer.from(payloadStr, 'base64').toString('utf8'));
          userId = payload.sub || payload.id;
        }
      } catch {
        // ignore
      }
    }
    const targetFolder = body?.folder ? `ziva/${body.folder}` : `ziva/uploads/${userId || 'guest'}`;
    return this.storageService.getCloudinaryUploadParams(targetFolder);
  }
}
