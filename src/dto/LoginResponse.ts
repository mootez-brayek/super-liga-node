import { Role } from '../entities/enums';

export interface LoginResponse {
  email: string;
  accessToken: string;
  id: number;
  role: Role;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  username: string | null;
}
