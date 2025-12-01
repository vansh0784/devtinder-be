import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from 'jsonwebtoken';

// @Injectable()
// export class JwtAuthGuard implements CanActivate {
//     constructor(private readonly configService: ConfigService) {}

//     canActivate(context: ExecutionContext): boolean {
//         const request = context.switchToHttp().getRequest<Request>();
//         const authHeader = request.headers['authorization'];

//         if (!authHeader || !authHeader.startsWith('Bearer ')) {
//             throw new UnauthorizedException(
//                 'Missing or invalid Authorization header',
//             );
//         }

//         const token = authHeader.split(' ')[1];
//         if (!token) throw new UnauthorizedException('No token found');

//         const jwtSecret = this.configService.get<string>('JWT_SECRET_KEY');
//         if (!jwtSecret) throw new Error('JWT_SECRET_KEY is not defined');

//         try {
//             const payload = verify(token, jwtSecret);
//             request['session'] = payload;
//             return true;
//         } catch (err: any) {
//             if (err.name === 'TokenExpiredError') {
//                 throw new UnauthorizedException('Token has expired');
//             }
//             throw new UnauthorizedException('Invalid or malformed token');
//         }
//     }
// }

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) {}

    // canActivate(context: ExecutionContext): boolean {
    //     const request = context.switchToHttp().getRequest<Request>();
    //     const authHeader = request.headers['authorization'];

    //     if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //         throw new UnauthorizedException(
    //             'Missing or invalid Authorization header',
    //         );
    //     }

    //     const token = authHeader.split(' ')[1];
    //     if (!token) throw new UnauthorizedException('No token found');

    //     const jwtSecret = this.configService.get<string>('JWT_SECRET_KEY');
    //     if (!jwtSecret) throw new Error('JWT_SECRET_KEY is not defined');

    //     try {
    //         const payload = verify(token, jwtSecret);
    //         request['user'] = payload; // ← CHANGED: 'session' → 'user'
    //         return true;
    //     } catch (err: any) {
    //         if (err.name === 'TokenExpiredError') {
    //             throw new UnauthorizedException('Token has expired');
    //         }
    //         throw new UnauthorizedException('Invalid or malformed token');
    //     }
    // }

    canActivate(context: ExecutionContext): boolean {
  const request = context.switchToHttp().getRequest<Request>();
  const authHeader = request.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedException('Missing or invalid Authorization header');
  }
  const token = authHeader.split(' ')[1];
  if (!token) throw new UnauthorizedException('No token found');

  const jwtSecret = this.configService.get<string>('JWT_SECRET_KEY');
  if (!jwtSecret) {
    throw new Error('JWT_SECRET_KEY is not defined');
  }

  try {
    const payload = verify(token, jwtSecret);
    request['user'] = payload;  // << This line fixed here
    return true;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Token has expired');
    }
    throw new UnauthorizedException('Invalid or malformed token');
  }
}

}
