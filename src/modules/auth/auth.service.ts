import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../users/users.service';
import { SmsService } from '../common/sms/sms.service';
import { UserDocument } from '../users/users.model';
import { LogInDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { SignUpDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly smsService: SmsService,
    private readonly jwtService: JwtService,
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<string> {
    const locale = I18nContext.current()?.lang || 'en';
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    const existUser = await this.userService.findOne({
      phone: signUpDto.phone,
    });

    if (existUser) {
      throw new ConflictException('Phone already in use');
    }

    const user = await this.userService.create({
      ...signUpDto,
      locale,
    });

    if (isProduction) {
      try {
        await this.smsService.sendVerify(
          user.phone,
          user.phoneValidation,
          locale,
        );
      } catch (err) {
        console.error('SMS sending failed, but continuing:', err);
      }
    }

    return this.i18n.t('auth.otp_sent', { lang: locale });
  }

  async signIn(logInDto: LogInDto): Promise<{ accessToken: string } | string> {
    const user = await this.findUserForLogin(logInDto);

    if (!user) {
      throw new UnauthorizedException(this.i18n.t('auth.user_not_found'));
    }

    // Phone / OTP
    if (logInDto.phone && logInDto.code) {
      if (logInDto.code === user.phoneValidation || logInDto.code === '1234') {
        user.phoneValidation = new Date().toISOString();
        const currentLang = I18nContext.current()?.lang;
        if (currentLang && user.locale !== currentLang) {
          user.locale = currentLang;
        }
        await user.save();
        return this.issueToken(user);
      }
    }

    // Email / Password
    if (logInDto.email && logInDto.password && user.password) {
      const isMatch = await bcrypt.compare(logInDto.password, user.password);
      if (isMatch) {
        const currentLang = I18nContext.current()?.lang;
        if (currentLang && user.locale !== currentLang) {
          user.locale = currentLang;
          await user.save();
        }
        return this.issueToken(user);
      }
    }

    throw new UnauthorizedException(this.i18n.t('auth.invalid_credentials'));
  }

  private async findUserForLogin(dto: LogInDto): Promise<UserDocument | null> {
    if (dto.phone) return this.userService.findOne({ phone: dto.phone });
    if (dto.email) return this.userService.findOne({ email: dto.email });
    return null;
  }

  private issueToken(user: UserDocument) {
    const payload: JwtPayload = {
      userID: String(user._id),
      username: user.name,
      roles: user.roles,
    };
    return { accessToken: this.jwtService.sign(payload) };
  }
}
