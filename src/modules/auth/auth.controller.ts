import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LogInDto } from './dto/login.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { GetJwt } from './decorators/jwt.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { Public } from './decorators/public.decorator';
import { seconds, SkipThrottle, Throttle } from '@nestjs/throttler';
import { UserService } from '../users/users.service';
import { UserDocument } from '../users/users.model';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('sign-up')
  @Throttle({ default: { limit: 1, ttl: seconds(60) } })
  async signUp(@Body() signUpDto: SignUpDto): Promise<string> {
    return this.authService.signUp(signUpDto);
  }

  @Public()
  @Post('sign-in')
  @Throttle({ default: { limit: 3, ttl: seconds(60) } })
  async signIn(
    @Body() logInDto: LogInDto,
  ): Promise<{ accessToken: string } | string> {
    return this.authService.signIn(logInDto);
  }

  @SkipThrottle()
  @Get('me')
  me(@GetJwt() jwt: JwtPayload): Promise<UserDocument> {
    return this.userService.findOneSafe({ _id: jwt.userID }, ['-__v']);
  }
}
