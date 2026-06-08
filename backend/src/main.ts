import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    credentials: true,
    methods: '*',
    allowedHeaders: '*',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('OrgBrain API')
    .setDescription('Organisational knowledge, decisions, lessons and semantic retrieval')
    .setVersion('0.1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Supabase access token (human / browser auth)',
    })
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'OrgBrain API key for programmatic (SDK / MCP) access',
      },
      'api-key',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
  });

  const config = app.get(AppConfigService);
  const port = config.port;
  await app.listen(port, '0.0.0.0');
  Logger.log(`OrgBrain API listening on http://0.0.0.0:${port}`, 'Bootstrap');
  Logger.log(`Swagger UI available at http://0.0.0.0:${port}/docs`, 'Bootstrap');
}

void bootstrap();
