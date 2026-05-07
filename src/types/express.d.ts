import { Role } from '../entities/enums';

export interface CurrentUser {
  userId: number;
  email: string;
  phoneNumber: string | null;
  role: Role;
  firstName: string;
  lastName: string;
  username: string | null;
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: CurrentUser;
    }
  }
}

export {};
