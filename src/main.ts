import { NestApplication, NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { buildSwagger } from './swagger';

import dotenv from 'dotenv';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { MongoExceptionFilter } from './core/filters/mongo-exception.filter';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestApplication>(AppModule);
  app.enableShutdownHooks();

  //build swagger
  buildSwagger(app);

  app.setGlobalPrefix('api'); // users -> /api/users

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      exposeDefaultValues: true,
    }),
  );

  app.useGlobalFilters(new MongoExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
