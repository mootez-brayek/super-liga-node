import bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source';
import { Role } from '../entities/enums';
import { User } from '../entities/User';

export async function bootstrapSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL;
  const username = process.env.SUPERADMIN_USERNAME;
  const password = process.env.SUPERADMIN_PASSWORD;
  const firstName = process.env.SUPERADMIN_FIRSTNAME;
  const lastName = process.env.SUPERADMIN_LASTNAME;

  const missing = [
    !email ? 'SUPERADMIN_EMAIL' : null,
    !username ? 'SUPERADMIN_USERNAME' : null,
    !password ? 'SUPERADMIN_PASSWORD' : null,
    !firstName ? 'SUPERADMIN_FIRSTNAME' : null,
    !lastName ? 'SUPERADMIN_LASTNAME' : null
  ].filter((value): value is string => Boolean(value));

  if (missing.length > 0) {
    throw new Error(`Missing required super admin environment variables: ${missing.join(', ')}`);
  }

  const userRepo = AppDataSource.getRepository(User);
  const existing = await userRepo.findOne({ where: { email } });
  if (existing) {
    return;
  }

  const superAdmin = userRepo.create({
    email,
    username,
    password: await bcrypt.hash(password, 10),
    firstName,
    lastName,
    role: Role.SuperAdmin,
    isActive: true
  });

  await userRepo.save(superAdmin);
}
