import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { UserRegisterDto } from './dtos/user-register.dto';
import { User } from './user.schema';
import { OutboxEvent } from '../outbox/outbox.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(OutboxEvent.name) private readonly outbox: Model<OutboxEvent>,
    private readonly config: ConfigService,
  ) {}

  async register(dto: UserRegisterDto) {
    const session = await this.users.db.startSession();
    try {
      let result!: { id: string; name: string; email: string; createdAt: Date };
      await session.withTransaction(async () => {
        const passwordHash = await bcrypt.hash(
          dto.password,
          Number(
            this.config.get('PASSWORD_HASH_ROUNDS') ??
              this.config.get('BCRYPT_SALT_ROUNDS') ??
              12,
          ),
        );
        const [user] = await this.users.create(
          [
            {
              name: dto.name.trim(),
              email: dto.email.trim().toLowerCase(),
              passwordHash,
            },
          ],
          { session },
        );
        const eventId = randomUUID();
        await this.outbox.create(
          [
            {
              eventId,
              type: 'user.registered',
              status: 'pending',
              payload: {
                schemaVersion: 1,
                eventId,
                userId: user.id,
                name: user.name,
                email: user.email,
                correlationId: randomUUID(),
                createdAt: new Date().toISOString(),
              },
            },
          ],
          { session },
        );
        result = {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.get('createdAt') as Date,
        };
      });
      return result;
    } catch (error: unknown) {
      if (isMongoDuplicateKey(error)) {
        throw new ConflictException('Bu e-posta adresi zaten kullanılıyor.');
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

function isMongoDuplicateKey(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  );
}
