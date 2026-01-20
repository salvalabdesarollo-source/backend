import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const PORT = process.env.PORT ?? 3050;
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'token'],
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('SalvaLab - Escaneo API')
    .setDescription('SalvaLab - Escaneo API')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'apiKey',
      name: 'token',
      scheme: 'http',
      in: 'header',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(PORT, '0.0.0.0');
  Logger.log(`Application is running on: ${PORT}`);
}
bootstrap();
