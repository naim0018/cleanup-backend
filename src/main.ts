import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const server = express();
let isAppInitialized = false;

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
  );
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  await app.init();
  isAppInitialized = true;
}

if (!process.env.VERCEL) {
  bootstrap().then(() => {
    const port = process.env.PORT ?? 3000;
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  });
}

export default async function (req: any, res: any) {
  if (!isAppInitialized) {
    try {
      await bootstrap();
    } catch (error) {
      console.error('Failed to initialize NestJS application:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to initialize backend. Check Vercel logs and ensure MONGODB_URI is set.' });
      return;
    }
  }
  server(req, res);
}
