import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './common/response.interceptor';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    app.enableCors({
        origin: [
            'http://localhost:5173',
            'https://devtinder-fe-sigma.vercel.app',
        ],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    app.useGlobalInterceptors(new ResponseInterceptor(configService));
    const config = new DocumentBuilder()
        .setTitle('DevTinder-API Docs')
        .setDescription(
            'DevTinder - application where developers can connect and code as well!!',
        )
        .setVersion('1.0.0')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    await app
        .listen(configService.get<string>('PORT') ?? 5011)
        .then(() => console.log(`Application will be running on port 3000`));
}
bootstrap();
