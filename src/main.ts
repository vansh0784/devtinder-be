import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './common/response.interceptor';
import { startYjsWebSocketServer } from './collaboration/yjs-websocket.bootstrap';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );
    app.enableCors({
        origin: [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:5174',
            'https://devtinder-fe-sigma.vercel.app',
        ],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    app.useGlobalInterceptors(new ResponseInterceptor(configService));
    const config = new DocumentBuilder()
        .setTitle('DevTinder-API Docs')
        .setDescription('DevTinder - application where developers can connect and code as well!!')
        .setVersion('1.0.0')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    const port = Number(configService.get<string>('PORT') ?? 5011);
    await app.listen(port);
    const nestLogger = new Logger('Bootstrap');
    nestLogger.log(`HTTP + Socket.IO listening on ${port}`);

    const yjsHost = configService.get<string>('YJS_HOST') ?? '0.0.0.0';
    const yjsPort = Number(configService.get<string>('YJS_WS_PORT') ?? 1234);
    try {
        await startYjsWebSocketServer(yjsHost, yjsPort, nestLogger);
    } catch {
        nestLogger.warn(
            'Yjs CRDT WebSocket could not bind (port in use or env issue). HTTP API still runs; fix YJS_WS_PORT or free the port.',
        );
    }
}
bootstrap();
