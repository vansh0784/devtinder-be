import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiTags } from '@nestjs/swagger';
import { SeedService } from './seed.service';
import { RunSeedDto } from './seed.dto';

@ApiTags('Seed (dev)')
@Controller('dev/seed')
export class SeedController {
    constructor(private readonly seedService: SeedService) {}

    @Post()
    @ApiHeader({
        name: 'x-seed-secret',
        required: true,
        description: 'Must match the SEED_SECRET env var on the server.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: { wipe: { type: 'boolean', default: false } },
        },
    })
    async runSeed(@Body() body: RunSeedDto, @Headers('x-seed-secret') secret?: string) {
        this.seedService.assertSecret(secret);
        return this.seedService.run({ wipe: Boolean(body?.wipe) });
    }
}
