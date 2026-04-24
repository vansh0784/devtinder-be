import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

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
