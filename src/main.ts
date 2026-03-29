import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './common/logger.service';
import { LoggingInterceptor } from './common/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true, // capture early logs
  });

  const config = app.get(ConfigService);
  const logger = app.get(LoggerService);

  // Replace Nest default logger with custom Winston logger
  app.useLogger(logger);

  // Enable CORS — restrict to known origins
  const allowedOrigins = (config.get<string>('CORS_ORIGINS') || 'http://localhost:3000,http://localhost:3001').split(',').map(o => o.trim());
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  });

  // Set global API prefix from .env (e.g., /api or UUID)
  const prefix = config.get<string>('API_PREFIX') ?? '/api';
  app.setGlobalPrefix(prefix);
  // Serve static uploads at /uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Optional: log all requests/responses
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  const port = Number(config.get<string>('PORT') ?? 3000);

  await app.listen(port);
  logger.log(`Server running at http://localhost:${port}${prefix}`);
}

bootstrap();
