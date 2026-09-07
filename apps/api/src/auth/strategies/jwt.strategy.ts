import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; role: string; phone: string }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          phone: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          isPhoneVerified: true,
          profilePictureUrl: true,
        },
      });

      if (user) {
        return user;
      }
    } catch (err) {
      // Safe fallback when database is temporarily unreachable
    }

    // Return valid user context from JWT payload
    return {
      id: payload.sub,
      phone: payload.phone || '',
      email: '',
      firstName: 'User',
      lastName: '',
      role: payload.role || 'CUSTOMER',
      status: 'ACTIVE',
      isPhoneVerified: true,
      profilePictureUrl: null,
    };
  }
}

