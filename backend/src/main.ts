import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Frontend (localhost:3000) and backend (localhost:8000) are different
  // origins, so browser fetches (click counter, filters, uploads done from
  // a client component) need CORS explicitly enabled.
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  });
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
