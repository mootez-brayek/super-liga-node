export interface CreateAdminRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
}
