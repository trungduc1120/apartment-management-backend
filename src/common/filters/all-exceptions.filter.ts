import {Catch, ExceptionFilter, ArgumentsHost, HttpException, HttpStatus,} from '@nestjs/common';
import { Response, Request } from 'express';
import { Prisma } from '@prisma/client';

@Catch() // bắt mọi exception
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // NestJS built-in exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') message = res;
      else if (typeof res === 'object' && (res as any).message)
        message = (res as any).message;
    }

    // Prisma known request errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Tài liệu mã lỗi Prisma:
      // https://www.prisma.io/docs/reference/api-reference/error-reference

      const code = exception.code;
      const meta = exception.meta;

      switch (code) {
        /**
         * Lỗi unique constraint (email duplicate, username duplicate...)
         */
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = `Duplicate value for field(s): ${(meta?.target as string[])?.join(', ')}`;
          break;

        /**
         * Record không tồn tại khi update/delete/findUnique...
         */
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          break;

        /**
         * Foreign key constraint: dữ liệu liên quan không tồn tại
         */
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid reference to another resource';
          break;

        /**
         * Unique xác định nhưng không tìm thấy bản ghi (liên quan thay đổi schema)
         */
        case 'P2016':
          status = HttpStatus.NOT_FOUND;
          message = 'Query interpretation error (possibly invalid ID)';
          break;

        /**
         * Column null trong khi schema yêu cầu not-null
         */
        case 'P2011':
          status = HttpStatus.BAD_REQUEST;
          message = `Null value provided for required field`;
          break;

        /**
         * Enum không hợp lệ
         */

        case 'P2020':
          status = HttpStatus.BAD_REQUEST;
          message = 'Value out of range for the field';
          break;

        /**
         * Vi phạm unique của composite key
         */
        case 'P2034':
          status = HttpStatus.CONFLICT;
          message = 'Composite key already exists';
          break;

        // Fallback cho các lỗi đã xác định nhưng chưa xử lý
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = exception.message ?? 'Database error';
          break;
      }
    }

    // Prisma unknown errors (chưa map)
    else if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Unknown database error';
    }

    // Lỗi JS thông thường
    else if (exception instanceof Error) {
      message = exception.message || message;
    }

    // Trả về JSON chuẩn
    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
