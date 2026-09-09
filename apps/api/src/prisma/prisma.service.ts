import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isConnected = false;
  private retryTimer: NodeJS.Timeout | null = null;

  public isDbAvailable(): boolean {
    return this.isConnected;
  }

  async onModuleInit() {
    await this.tryConnect();
  }

  async tryConnect() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('✅ PostgreSQL Database connected successfully.');
      await this.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS unaccent;`).catch(() => {});
    } catch (err: any) {
      this.isConnected = false;
      this.logger.warn(
        `⚠️ Remote database server unreachable (db.xkseyvvubqschextorgk.supabase.co:5432). Serving in fast offline-resilient mode.`
      );
      
      // Background retry periodically without blocking requests
      if (!this.retryTimer) {
        this.retryTimer = setInterval(() => {
          this.$queryRaw`SELECT 1;`
            .then(() => {
              this.isConnected = true;
              this.logger.log('✅ PostgreSQL Database reconnected successfully.');
              if (this.retryTimer) {
                clearInterval(this.retryTimer);
                this.retryTimer = null;
              }
            })
            .catch(() => {
              this.isConnected = false;
            });
        }, 60000);
      }
    }
  }

  async onModuleDestroy() {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
    await this.$disconnect().catch(() => {});
  }
}

