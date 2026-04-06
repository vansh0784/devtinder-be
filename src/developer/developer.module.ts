import { Module } from '@nestjs/common';
import { DeveloperController } from './developer.controller';
import { DeveloperService } from './developer.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../common/entities/user.entity';
import { Connection, ConnectionSchema } from '../common/entities/connection.entity';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Connection.name, schema: ConnectionSchema },
        ]),
    ],

    providers: [DeveloperService],
    controllers: [DeveloperController],
})
export class DeveloperModule {}
