import { Role } from '../entities/enums';

export interface CreateAdminResponse {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  role: Role;
  active: boolean;
}
