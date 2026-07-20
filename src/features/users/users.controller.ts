import { Body, Controller, Post } from '@nestjs/common';
import { UserRegisterDto } from './dtos/user-register.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  register(@Body() dto: UserRegisterDto) {
    return this.usersService.register(dto);
  }
}
