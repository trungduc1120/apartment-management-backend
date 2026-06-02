import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {ValidationPipe} from "@nestjs/common";
import {AllExceptionsFilter} from "./common/filters/all-exceptions.filter";
import {ResponseInterceptor} from "./common/interceptors/response.interceptor";
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.enableCors({
    origin: [
      process.env.LOCAL_FRONTEND,
      process.env.PUBLIC_FRONTEND,
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  });

  // kich hoat adapter
 app.useWebSocketAdapter(new IoAdapter(app));

  // cấu hình response
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Đọc cookie
  app.use(cookieParser());

  //bộ xử lí exception
  app.useGlobalFilters(new AllExceptionsFilter())

  // Bật global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,              // loại bỏ các field không có trong DTO
    forbidNonWhitelisted: true,   // lỗi nếu có field lạ
    transform: true,              // tự động chuyển đổi payload sang class
  }));

  // tạo tài liệu API
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('Backend API for Next.js app')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');

  console.log(`Server running on http://localhost:${process.env.PORT}`);
}
bootstrap();
