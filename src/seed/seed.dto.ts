import { IsBoolean, IsOptional } from 'class-validator';

export class RunSeedDto {
    @IsBoolean()
    @IsOptional()
    wipe?: boolean;
}
