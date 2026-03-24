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

  // Enable CORS globally
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: '*',
  });

  // Set global API prefix from .env (e.g., /api or UUID)
  const prefix = config.get<string>('API_PREFIX') ?? '/api';
  app.setGlobalPrefix(prefix);
  // Serve static uploads at /uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  const uploadsPath = join(__dirname, '..', 'uploads');
  console.log('Uploads path:', uploadsPath);
  console.log('Uploads exists:', require('fs').existsSync(uploadsPath));
  // Optional: log all requests/responses
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  const port = Number(config.get<string>('PORT') ?? 3000);

  await app.listen(port);
  logger.log(`Server running at http://localhost:${port}${prefix}`);
}

bootstrap();
