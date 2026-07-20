import { NestApplication } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export function buildSwagger(app: NestApplication) {
  const config = new DocumentBuilder()
    .addTag('Api')
    .setTitle('Background Job API')
    .setDescription('The Background Job API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('/api/docs/', app, document);
}
