import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { HttpExceptionFilter } from './shared/filters/http-exception.filter'

async function bootstrap() {
   const app = await NestFactory.create(AppModule, { rawBody: true })

   app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true
   })

   app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
   app.useGlobalFilters(new HttpExceptionFilter())
   await app.listen(process.env.PORT ?? 8080, '0.0.0.0')
}
bootstrap().catch((err) => console.error(err))
