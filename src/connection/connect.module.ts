import { Module } from '@nestjs/common';
import { ConnectionController } from './connect.controller';
import { ConnectionService } from './connect.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
    Connection,
    ConnectionSchema,
} from 'src/common/entities/connection.entity';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Connection.name, schema: ConnectionSchema },
        ]),
    ],
    controllers: [ConnectionController],
    providers: [ConnectionService],
})
export class ConnectModule {}
