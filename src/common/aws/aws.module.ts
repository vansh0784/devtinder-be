import { Global, Module } from '@nestjs/common';
import { S3Service } from './s3Service';

@Global()
@Module({
    imports: [],
    providers: [S3Service],
    exports: [S3Service],
})
export class AWSModule {}
