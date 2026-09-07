import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client;

  constructor(private config: ConfigService) {
    this.s3 = new S3Client({
      endpoint: config.get('S3_ENDPOINT', 'http://localhost:9000'),
      region: config.get('S3_REGION', 'ap-south-1'),
      credentials: {
        accessKeyId: config.get('S3_ACCESS_KEY', 'minioadmin'),
        secretAccessKey: config.get('S3_SECRET_KEY', 'minioadmin'),
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  // Generate a pre-signed upload URL (client uploads directly to S3)
  async getUploadUrl(
    bucket: string,
    folder: string,
    filename: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    const ext = path.extname(filename);
    const key = `${folder}/${crypto.randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });
    const endpoint = this.config.get('S3_ENDPOINT', 'http://localhost:9000');
    const fileUrl = `${endpoint}/${bucket}/${key}`;

    return { uploadUrl, fileUrl, key };
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch (err) {
      this.logger.error(`Failed to delete ${key}:`, err);
    }
  }

  // Generate signed Cloudinary upload params
  getCloudinaryUploadParams(folder: string = 'ziva_uploads') {
    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME', 'zivahousing');
    const apiKey = this.config.get('CLOUDINARY_API_KEY', '987894924194238');
    const apiSecret = this.config.get('CLOUDINARY_API_SECRET', 'FMf78FhYmo1x9uPZxyPU0B7Swcw');
    const timestamp = Math.floor(Date.now() / 1000);

    const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      apiKey,
      timestamp,
      signature,
      folder,
      cloudName,
    };
  }

  // Upload base64 or file data directly to Cloudinary
  async uploadDirect(
    fileData: string,
    folder: string = 'ziva_uploads',
  ): Promise<string> {
    try {
      const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME', 'zivahousing');
      const apiKey = this.config.get('CLOUDINARY_API_KEY', '987894924194238');
      const apiSecret = this.config.get('CLOUDINARY_API_SECRET', 'FMf78FhYmo1x9uPZxyPU0B7Swcw');
      const timestamp = Math.floor(Date.now() / 1000);

      const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

      const formData = new URLSearchParams();
      formData.append('file', fileData);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data && data.secure_url) {
        return data.secure_url;
      }
      if (data && data.url) {
        return data.url;
      }
      this.logger.warn('Cloudinary upload warning:', data);
      return fileData;
    } catch (err) {
      this.logger.error('Failed to upload directly to Cloudinary, falling back', err);
      return fileData;
    }
  }
}
