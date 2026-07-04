import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';

const server = express();
let initialized = false;

async function bootstrap() {
  if (initialized) return;

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
  ].filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  await app.init();
  initialized = true;
}

export default async function handler(
  req: express.Request,
  res: express.Response,
) {
  await bootstrap();
  server(req, res);
}
