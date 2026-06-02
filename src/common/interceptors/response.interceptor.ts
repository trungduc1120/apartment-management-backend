import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((data) => {
        const finalData = (data && data.meta) 
            ? data 
            : (data?.data ?? (typeof data === 'object' ? data : { result: data }));

        return {
          success: true,
          statusCode: response.statusCode,
          message: data?.message || 'OK',
          data: finalData, 
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}