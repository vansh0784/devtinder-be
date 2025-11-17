import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, map } from 'rxjs';
import { sign, decode } from 'jsonwebtoken';
import { Request, Response } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    constructor(private readonly configService: ConfigService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<Request>();
        const response = httpContext.getResponse<Response>();

        return next.handle().pipe(
            map((data) => {
                if (request['expired']) {
                    const token = this.extractTokenFromHeader(request);
                    if (!token) return data;

                    const payload: any = decode(token);
                    if (!payload) return data;

                    const { email, user_id } = payload;
                    const secret_key =
                        this.configService.get<string>('JWT_SECRET_KEY');
                    if (!secret_key)
                        throw new Error('JWT_SECRET_KEY is missing');
                    response.cookie(
                        'access_token',
                        sign({ email, user_id }, secret_key),
                        { httpOnly: true, secure: true, maxAge: 120000 }, // match JWT
                    );
                }
                return data;
            }),
        );
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
