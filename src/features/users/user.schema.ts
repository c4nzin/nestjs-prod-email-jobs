import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', timestamps: true, versionKey: false })
export class User {
  @Prop({ required: true, trim: true, minlength: 2, maxlength: 100 })
  name!: string;

  @Prop({
    required: true,
    unique: true,
    type: String,
    lowercase: true,
    trim: true,
    maxlength: 320,
  })
  email!: string;

  @Prop({ required: true, type: String, select: false })
  passwordHash!: string;
}

export const UserSchema = SchemaFactory.createForClass<User>(User);
