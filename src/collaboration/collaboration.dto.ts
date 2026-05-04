import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class CreateCollabRoomDto {
    @ApiPropertyOptional({
        description: 'Initial editor text used to seed the OT shadow document (CRDT still syncs via Yjs).',
        maxLength: 512_000,
    })
    @IsOptional()
    @IsString()
    @MaxLength(512_000)
    initialDocument?: string;
}

export class InviteCollaborationDto {
    @ApiProperty({
        description: 'Collaboration session id from POST /collaboration/rooms (UUID)',
    })
    @IsString()
    @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
        message: 'roomId must be a UUID',
    })
    roomId: string;

    @ApiProperty({
        description: 'Mongo ObjectId of a matched developer (must be ACCEPTED connection)',
    })
    @IsMongoId()
    receiverId: string;
}
