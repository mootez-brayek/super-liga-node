import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { ApiResponse } from '../dto/ApiResponse';
import { AuthRequest } from '../dto/AuthRequest';
import { LoginResponse } from '../dto/LoginResponse';
import { UserService } from '../services/UserService';
import { generateAccessToken } from '../utils/jwt';
import { asyncHandler } from '../middleware/async-handler';

function validateLoginRequest(body: Partial<AuthRequest>): string | null {
  if (body.email == null) {
    return 'must not be null';
  }

  if (body.email.length < 5 || body.email.length > 50) {
    return 'size must be between 5 and 50';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return 'must be a well-formed email address';
  }

  if (body.password == null) {
    return 'must not be null';
  }

  if (body.password.length < 6 || body.password.length > 100) {
    return 'size must be between 6 and 100';
  }

  return null;
}

export function createAuthRouter(userService: UserService) {
  const router = Router();

  router.post(
    '/login',
    asyncHandler(async (req, res) => {
      const error = validateLoginRequest(req.body ?? {});
      if (error) {
        const response: ApiResponse<null> = { message: error, data: null };
        res.status(400).json(response);
        return;
      }

      try {
        const user = await userService.findByEmail(req.body.email);

        const passwordMatches = await bcrypt.compare(req.body.password, user.password);
        if (!passwordMatches || !user.isActive) {
          const response: ApiResponse<null> = { message: 'Invalid credentials', data: null };
          res.status(401).json(response);
          return;
        }

        const currentUser = {
          userId: user.userId,
          email: user.email,
          phoneNumber: user.phoneNumber ?? null,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username ?? null
        };

        const accessToken = generateAccessToken(currentUser);

        const data: LoginResponse = {
          email: user.email,
          accessToken,
          id: user.userId,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber ?? null,
          username: user.username ?? null
        };

        const response: ApiResponse<LoginResponse> = {
          message: 'Login successful',
          data
        };

        res.status(200).json(response);
      } catch {
        const response: ApiResponse<null> = { message: 'Invalid credentials', data: null };
        res.status(401).json(response);
      }
    })
  );

  return router;
}
