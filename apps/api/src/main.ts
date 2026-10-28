import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // CSV imports send up to 1000 rows as JSON, which is larger than the 100kb default
  app.useBodyParser('json', { limit: '5mb' });
  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();