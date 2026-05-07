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

  if (!email || !username || !password || !firstName || !lastName) {
    throw new Error('Super admin environment variables are not fully configured');
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
