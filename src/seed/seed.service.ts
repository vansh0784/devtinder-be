import {
    Injectable,
    ConflictException,
    ForbiddenException,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { hash } from 'bcryptjs';
import { User } from '../common/entities/user.entity';
import { Post } from '../common/entities/posts.entity';
import { Connection, ConnectionStatus } from '../common/entities/connection.entity';
import { Message, MessageDocument } from '../common/entities/message.entity';
import { Notification } from '../common/entities/notification.entity';

const SEED_EMAIL_RE = /^seed[0-9]+@devtinder\.local$/;

function roomIdFor(aId: string, bId: string): string {
    return [aId, bId].sort().join('_');
}

const SEED_USER_SPECS = [
    {
        username: 'alex_mern',
        email: 'seed1@devtinder.local',
        age: 27,
        phone: '+1-415-555-0101',
        bio: 'Full‑stack engineer. React, NestJS, PostgreSQL.',
        experienceLevel: 'Senior',
        skills: ['TypeScript', 'React', 'Node.js', 'MongoDB'],
        github: 'https://github.com/alexmern',
        linkedin: 'https://linkedin.com/in/alexmern',
        portfolio: 'https://alexportfolio.dev',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
        location: 'San Francisco, CA',
    },
    {
        username: 'sam_rust',
        email: 'seed2@devtinder.local',
        age: 25,
        phone: '+1-206-555-0102',
        bio: 'Systems + web. Loving Rust and WASM lately.',
        experienceLevel: 'Mid',
        skills: ['Rust', 'Wasm', 'C++', 'Linux'],
        github: 'https://github.com/samrust',
        linkedin: 'https://linkedin.com/in/samrust',
        portfolio: '',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sam',
        location: 'Seattle, WA',
    },
    {
        username: 'jordan_ui',
        email: 'seed3@devtinder.local',
        age: 29,
        phone: '+1-512-555-0103',
        bio: 'Design systems & a11y. Figma ↔ code handoff nerd.',
        experienceLevel: 'Senior',
        skills: ['Design', 'CSS', 'React', 'Figma'],
        github: 'https://github.com/jordanui',
        linkedin: 'https://linkedin.com/in/jordanui',
        portfolio: 'https://jordanui.io',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jordan',
        location: 'Austin, TX',
    },
    {
        username: 'riley_ml',
        email: 'seed4@devtinder.local',
        age: 26,
        phone: '+1-617-555-0104',
        bio: 'ML engineer. PyTorch, data pipelines, MLOps.',
        experienceLevel: 'Mid',
        skills: ['Python', 'PyTorch', 'Kubernetes', 'SQL'],
        github: 'https://github.com/rileymL',
        linkedin: 'https://linkedin.com/in/rileym',
        portfolio: '',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=riley',
        location: 'Boston, MA',
    },
    {
        username: 'casey_go',
        email: 'seed5@devtinder.local',
        age: 31,
        phone: '+44-20-7946-0999',
        bio: 'Backend + cloud. Distributed services in Go.',
        experienceLevel: 'Lead',
        skills: ['Go', 'gRPC', 'Docker', 'AWS'],
        github: 'https://github.com/caseygo',
        linkedin: 'https://linkedin.com/in/caseygo',
        portfolio: 'https://caseygo.dev',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=casey',
        location: 'London, UK',
    },
    {
        username: 'morgan_py',
        email: 'seed6@devtinder.local',
        age: 24,
        phone: '+1-303-555-0106',
        bio: 'Django + FastAPI. APIs, Postgres, Celery.',
        experienceLevel: 'Junior',
        skills: ['Python', 'Django', 'FastAPI', 'Redis'],
        github: 'https://github.com/morganpy',
        linkedin: 'https://linkedin.com/in/morganpy',
        portfolio: '',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=morgan',
        location: 'Denver, CO',
    },
    {
        username: 'taylor_ios',
        email: 'seed7@devtinder.local',
        age: 28,
        phone: '+1-212-555-0107',
        bio: 'iOS · Swift · SwiftUI. Shipping apps since ‘19.',
        experienceLevel: 'Senior',
        skills: ['Swift', 'SwiftUI', 'Combine', 'Xcode'],
        github: 'https://github.com/taylorios',
        linkedin: 'https://linkedin.com/in/taylorios',
        portfolio: 'https://taylorapps.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=taylor',
        location: 'New York, NY',
    },
] as const;

const PLAIN_PASSWORD = 'SeedDev123!';

export type SeedResult = {
    statusCode: number;
    message: string;
    usersCreated: number;
    postsCreated: number;
    connectionsCreated: number;
    messagesCreated: number;
    notificationsCreated: number;
    seededLoginHint: string;
};

@Injectable()
export class SeedService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(User.name) private readonly userModel: Model<User>,
        @InjectModel(Post.name) private readonly postModel: Model<Post>,
        @InjectModel(Connection.name) private readonly connectionModel: Model<Connection>,
        @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
        @InjectModel(Notification.name) private readonly notificationModel: Model<Notification>,
    ) {}

    assertSecret(secret: string | undefined): void {
        const expected = this.configService.get<string>('SEED_SECRET')?.trim();
        if (!expected) {
            throw new ServiceUnavailableException(
                'SEED_SECRET is not set on the server. Add it to your environment to use the seed endpoint.',
            );
        }
        if (!secret || secret.trim() !== expected) {
            throw new ForbiddenException('Invalid or missing x-seed-secret header');
        }
    }

    async clearSeedCascade(): Promise<{ removedUsers: number }> {
        const seedUsers = await this.userModel.find({ email: { $regex: SEED_EMAIL_RE } }).select('_id').lean();
        const ids = seedUsers.map((u) => u._id as Types.ObjectId);
        if (ids.length === 0) return { removedUsers: 0 };

        const idStrings = ids.map((id) => id.toString());

        await this.postModel.deleteMany({ author: { $in: ids } });

        await this.connectionModel.deleteMany({
            $or: [{ userA: { $in: ids } }, { userB: { $in: ids } }],
        });

        await this.messageModel.deleteMany({
            $or: [{ senderId: { $in: idStrings } }, { receiverId: { $in: idStrings } }],
        });

        await this.notificationModel.deleteMany({
            $or: [{ receiverId: { $in: ids } }, { senderId: { $in: ids } }],
        });

        const res = await this.userModel.deleteMany({ _id: { $in: ids } });
        return { removedUsers: res.deletedCount ?? 0 };
    }

    async run(options: { wipe: boolean }): Promise<SeedResult> {
        if (options.wipe) {
            await this.clearSeedCascade();
        } else {
            const existing = await this.userModel.countDocuments({ email: { $regex: SEED_EMAIL_RE } });
            if (existing > 0) {
                throw new ConflictException(
                    'Seed data already exists. Send { "wipe": true } in the body or clear manually, then retry.',
                );
            }
        }

        const hashed = await hash(PLAIN_PASSWORD, 10);

        const createdDocs = await Promise.all(
            SEED_USER_SPECS.map((s) =>
                this.userModel.create({
                    username: s.username,
                    age: s.age,
                    email: s.email,
                    password: hashed,
                    phone: s.phone,
                    skills: [...s.skills],
                    bio: s.bio,
                    experienceLevel: s.experienceLevel,
                    github: s.github,
                    linkedin: s.linkedin,
                    portfolio: s.portfolio,
                    avatar: s.avatar,
                    location: s.location,
                    isActive: true,
                    isOnline: false,
                }),
            ),
        );

        const u = createdDocs.map((d) => ({
            doc: d,
            id: d._id as Types.ObjectId,
            idStr: (d._id as Types.ObjectId).toString(),
            username: d.username,
            avatar: d.avatar ?? '',
        }));

        let postsCreated = 0;

        const postPayload = (idx: number, text: string, code: string, tags: string[], opts?: Partial<Post>) => {
            const author = u[idx];
            return {
                author: author.id,
                authorName: author.username,
                authorUsername: author.username,
                authorAvatar: author.avatar,
                authorVerified: idx % 2 === 0,
                text,
                images: [] as string[],
                code,
                projectLink: `https://github.com/${author.username}`,
                tags,
                likes: [u[(idx + 1) % 7].id, u[(idx + 3) % 7].id] as Types.ObjectId[],
                comments: [
                    {
                        user: u[(idx + 2) % 7].id,
                        text: 'This is awesome — saved for later 🔥',
                        createdAt: new Date(),
                    },
                ] as Post['comments'],
                shares: 1 + idx,
                isPinned: false,
                visibility: 'public',
                ...(opts ?? {}),
            };
        };

        await this.postModel.create([
            postPayload(
                0,
                'Shipped a NestJS module with Mongo + JWT in a weekend. Loving the interceptor pattern.',
                `const app = await NestFactory.create(AppModule);\nawait app.listen(5011);`,
                ['nestjs', 'mongodb', 'api'],
            ),
            postPayload(
                1,
                'Rust FFI tips: minimize copies across the boundary.',
                `pub fn ping() -> &'static str { "pong" }`,
                ['rust', 'ffi'],
                { shares: 4 },
            ),
            postPayload(2, 'Accessible focus rings don’t need to be ugly.', `.focus-visible { outline: 2px solid var(--accent); }`, ['css', 'a11y']),
            postPayload(
                3,
                'Training loops: sanity‑check shapes before the overnight run 😅',
                `loss = criterion(logits, labels)\nloss.backward()`,
                ['pytorch', 'ml'],
            ),
            postPayload(
                4,
                'Go workers + context cancellation pattern we use in prod.',
                `ctx, cancel := context.WithTimeout(ctx, 5*time.Second)\ndefer cancel()`,
                ['go', 'concurrency'],
            ),
            postPayload(
                5,
                'FastAPI dependency injection cleans up route testing.',
                `def get_db():\n    try:\n        yield db\n    finally:\n        db.close()`,
                ['python', 'fastapi'],
            ),
            postPayload(
                6,
                'SwiftUI animations: matchedGeometryEffect for shared elements.',
                `withAnimation(.spring()) { toggle.toggle() }`,
                ['swift', 'swiftui'],
            ),
            postPayload(
                0,
                'Pair programming > heroics. Change my mind.',
                '',
                ['culture', 'teams'],
                {
                    likes: [u[1].id],
                    comments: [{ user: u[1].id, text: 'Facts.', createdAt: new Date() }],
                },
            ),
        ]);
        postsCreated = 8;

        const connectionsPayload: { userA: Types.ObjectId; userB: Types.ObjectId; status: ConnectionStatus }[] = [
            { userA: u[0].id, userB: u[1].id, status: ConnectionStatus.ACCEPTED },
            { userA: u[3].id, userB: u[5].id, status: ConnectionStatus.ACCEPTED },
            { userA: u[0].id, userB: u[2].id, status: ConnectionStatus.PENDING },
            { userA: u[1].id, userB: u[3].id, status: ConnectionStatus.PENDING },
            { userA: u[4].id, userB: u[6].id, status: ConnectionStatus.PENDING },
            { userA: u[2].id, userB: u[4].id, status: ConnectionStatus.REJECTED },
            { userA: u[5].id, userB: u[6].id, status: ConnectionStatus.REJECTED },
        ];

        await this.connectionModel.insertMany(connectionsPayload);
        const connectionsCreated = connectionsPayload.length;

        const r01 = roomIdFor(u[0].idStr, u[1].idStr);
        await this.messageModel.insertMany([
            {
                roomId: r01,
                senderId: u[0].idStr,
                receiverId: u[1].idStr,
                content: 'Hey! Want to collaborate on an open‑source lint rule?',
                read: true,
            },
            {
                roomId: r01,
                senderId: u[1].idStr,
                receiverId: u[0].idStr,
                content: 'Yes — I’m in. DM me repo link.',
                read: false,
            },
            {
                roomId: r01,
                senderId: u[0].idStr,
                receiverId: u[1].idStr,
                content: 'Sending invite now 🚀',
                read: false,
            },
            {
                roomId: roomIdFor(u[3].idStr, u[5].idStr),
                senderId: u[3].idStr,
                receiverId: u[5].idStr,
                content: 'Coffee chat this week?',
                read: false,
            },
        ]);
        const messagesCreated = 4;

        await this.notificationModel.insertMany([
            {
                receiverId: u[2].id,
                senderId: u[0].id,
                type: 'REQUEST',
                message: `${u[0].username} sent you a connection request`,
                read: false,
            },
            {
                receiverId: u[3].id,
                senderId: u[1].id,
                type: 'REQUEST',
                message: `${u[1].username} sent you a connection request`,
                read: false,
            },
            {
                receiverId: u[6].id,
                senderId: u[4].id,
                type: 'REQUEST',
                message: `${u[4].username} sent you a connection request`,
                read: false,
            },
            {
                receiverId: u[1].id,
                senderId: u[0].id,
                type: 'MESSAGE',
                roomId: r01,
                message: `${u[0].username}: Sending invite now 🚀`,
                read: false,
            },
        ]);
        const notificationsCreated = 4;

        return {
            statusCode: 200,
            message:
                options.wipe ?
                    'Seed data recreated (previous seed emails were wiped).'
                :   'Seed data created successfully.',

            usersCreated: SEED_USER_SPECS.length,
            postsCreated,
            connectionsCreated,
            messagesCreated,
            notificationsCreated,
            seededLoginHint: `Use emails seed1@devtinder.local … seed7@devtinder.local with password "${PLAIN_PASSWORD}"`,
        };
    }
}
