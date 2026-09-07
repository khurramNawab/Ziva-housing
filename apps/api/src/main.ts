import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Body parser limit for large media and documents
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // ─── Global Validation ─────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip non-decorated props
      forbidNonWhitelisted: true,
      transform: true,           // Auto-transform to DTO types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── CORS ──────────────────────────────────────────────────
  app.enableCors({
    origin: [
      process.env.APP_URL || 'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ─── API Prefix ────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Swagger (Dev only) ────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Ziva Housing API')
      .setDescription('Real Estate Marketplace API — Phase 1 MVP')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication & OTP')
      .addTag('users', 'User Management')
      .addTag('properties', 'Property Listings')
      .addTag('leads', 'Lead Management (Contact Protection)')
      .addTag('chat', 'In-App Messaging')
      .addTag('visits', 'Visit Scheduling')
      .addTag('payments', 'Payments & Commission')
      .addTag('notifications', 'Notifications')
      .addTag('admin', 'Admin Panel')
      .addTag('reviews', 'Reviews & Ratings')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    console.log('📚 Swagger docs: http://localhost:4000/api/docs');
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Ziva Housing API running on: http://localhost:${port}/api/v1`);
}

bootstrap();
