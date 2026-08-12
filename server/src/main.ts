import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { HttpExceptionFilter } from './shared/filters/http-exception.filter'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
   const app = await NestFactory.create(AppModule, { rawBody: true })

   app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true
   })

   app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
   app.useGlobalFilters(new HttpExceptionFilter())

   const config = new DocumentBuilder()
      .setTitle('Rentify API')
      .setDescription('Rentify Platform API Documentation')
      .setVersion('1.0')
      .addBearerAuth(
         {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'Authorization',
            description: 'Enter JWT Bearer token',
            in: 'header'
         },
         'bearer'
      )
      .addApiKey(
         {
            type: 'apiKey',
            name: 'x-api-key',
            in: 'header',
            description: 'SePay Webhook API Key'
         },
         'sepay-api-key'
      )
      .build()

   const document = SwaggerModule.createDocument(app, config)
   SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
         persistAuthorization: true
      }
   })

   await app.listen(process.env.PORT ?? 8080, '0.0.0.0')
}
bootstrap().catch((err) => console.error(err))
