import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidV4 } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
    private readonly s3Client: S3Client;
    private readonly bucketName: string;

    constructor(private readonly configService: ConfigService) {
        this.bucketName =
            this.configService.get<string>('AWS_BUCKET_NAME') || '';
        this.s3Client = new S3Client({
            region: this.configService.get<string>('AWS_REGION'),
            credentials: {
                accessKeyId:
                    this.configService.get<string>('AWS_ACCESS_KEY_S3') || '',
                secretAccessKey:
                    this.configService.get<string>('AWS_SECRET_ACCESS_S3') ||
                    '',
            },
        });
    }

    async uploadFile(file: Express.Multer.File): Promise<string> {
        if (!file) throw new BadRequestException('No file provided');
        const fileKey = `${uuidV4()}-${file.originalname}`;

        const uploadParams = {
            Bucket: this.bucketName,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        try {
            await this.s3Client.send(new PutObjectCommand(uploadParams));
            return `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/${fileKey}`;
        } catch (err) {
            console.error('Error uploading to S3', err);
            throw new BadRequestException('File upload failed');
        }
    }

    async deleteFile(fileUrl: string): Promise<void> {
        if (!fileUrl) throw new BadRequestException('No file provided');

        const urlParts = fileUrl.split('/');
        const fileKey = urlParts[urlParts.length - 1];

        const deleteParams = {
            Bucket: this.bucketName,
            Key: fileKey,
        };
        try {
            await this.s3Client.send(new DeleteObjectCommand(deleteParams));
        } catch (err) {
            console.error('Error deleting to S3', err);
            throw new BadRequestException('File deletion failed');
        }
    }

    async getFileUrl(
        filekey: string,
        expireInSeconds: number = 3600,
    ): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: filekey,
        });
        return await getSignedUrl(this.s3Client, command, {
            expiresIn: expireInSeconds,
        });
    }
}
