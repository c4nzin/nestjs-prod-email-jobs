import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
} from '@nestjs/common';
import { MongoServerError } from 'mongodb';

@Catch(MongoServerError)
export class MongoExceptionFilter implements ExceptionFilter {
  public catch(error: MongoServerError, host: ArgumentsHost) {
    if (error.code !== 11000) {
      throw error;
    }

    const field = Object.keys(error.keyPattern ?? {})[0] ?? 'resource';

    throw new ConflictException(
      `A ${field} with the same value already exists.`,
    );
  }
}
