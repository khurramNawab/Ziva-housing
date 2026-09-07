import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ PostgreSQL Database connected successfully.');
      // Set up PostgreSQL FTS trigger extension (execute at startup)
      await this.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS unaccent;`).catch(() => {});
    } catch (err: any) {
      this.logger.warn(
        `⚠️ Could not connect to remote database server (${err?.message || err}). Server starting in fallback/offline-resilient mode.`
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect().catch(() => {});
  }
}

