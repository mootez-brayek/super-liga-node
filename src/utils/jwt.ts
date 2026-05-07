import jwt from 'jsonwebtoken';
import { Role } from '../entities/enums';
import { CurrentUser } from '../types/express';

const EXPIRE_SECONDS = 2 * 24 * 60 * 60;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

export function generateAccessToken(user: CurrentUser): string {
  return jwt.sign(
    {
      phoneNumber: user.phoneNumber,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username
    },
    getSecret(),
    {
      algorithm: 'HS512',
      subject: `${user.userId},${user.email}`,
      expiresIn: EXPIRE_SECONDS
    }
  );
}

export function verifyAccessToken(token: string): CurrentUser | null {
  try {
    const payload = jwt.verify(token, getSecret(), { algorithms: ['HS512'] }) as jwt.JwtPayload;
    const subject = typeof payload.sub === 'string' ? payload.sub : '';
    const [userIdPart] = subject.split(',');
    const userId = Number(userIdPart);

    if (!Number.isFinite(userId)) {
      return null;
    }

    return {
      userId,
      email: typeof payload.email === 'string' ? payload.email : '',
      phoneNumber: typeof payload.phoneNumber === 'string' ? payload.phoneNumber : null,
      role: typeof payload.role === 'string' ? (payload.role as Role) : Role.ADMIN,
      firstName: typeof payload.firstName === 'string' ? payload.firstName : '',
      lastName: typeof payload.lastName === 'string' ? payload.lastName : '',
      username: typeof payload.username === 'string' ? payload.username : null
    };
  } catch {
    return null;
  }
}
