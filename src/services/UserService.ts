import bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source';
import { CreateAdminRequest } from '../dto/CreateAdminRequest';
import { CreateAdminResponse } from '../dto/CreateAdminResponse';
import { UpdateAdminRequest } from '../dto/UpdateAdminRequest';
import { Role } from '../entities/enums';
import { User } from '../entities/User';
import { CurrentUser } from '../types/express';
import { isBlank } from '../utils/string';

export class UserService {
  private userRepo() {
    return AppDataSource.getRepository(User);
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepo().findOne({ where: { email } });
    if (!user) {
      throw new Error(`User with email '${email}' not found`);
    }
    return user;
  }

  async createAdmin(request: CreateAdminRequest): Promise<CreateAdminResponse> {
    const userRepo = this.userRepo();

    const exists = await userRepo.exists({ where: { email: request.email } });
    if (exists) {
      throw new Error('Email already exists');
    }

    if (!isBlank(request.phoneNumber)) {
      const phoneExists = await userRepo.exists({ where: { phoneNumber: request.phoneNumber!.trim() } });
      if (phoneExists) {
        throw new Error('Phone number already used');
      }
    }

    const admin = userRepo.create({
      email: request.email,
      password: await bcrypt.hash(request.password, 10),
      firstName: request.firstName,
      lastName: request.lastName,
      phoneNumber: request.phoneNumber ?? null,
      role: Role.ADMIN,
      isActive: true
    });

    const saved = await userRepo.save(admin);
    return this.mapToResponse(saved);
  }

  async getAllAdmins(): Promise<CreateAdminResponse[]> {
    const admins = await this.userRepo().find({ where: { role: Role.ADMIN } });
    return admins.map((admin) => this.mapToResponse(admin));
  }

  async toggleAdminStatus(adminId: number): Promise<void> {
    const userRepo = this.userRepo();
    const admin = await userRepo.findOne({ where: { userId: adminId }, relations: ['team'] });

    if (!admin) {
      throw new Error('Admin not found');
    }

    if (admin.role !== Role.ADMIN) {
      throw new Error('User is not an admin');
    }

    admin.isActive = !admin.isActive;
    await userRepo.save(admin);
  }

  async archiveAdmin(adminId: number): Promise<void> {
    const userRepo = this.userRepo();
    const admin = await userRepo.findOne({ where: { userId: adminId }, relations: ['team'] });

    if (!admin) {
      throw new Error('Admin not found');
    }

    if (admin.role !== Role.ADMIN) {
      throw new Error('User is not an admin');
    }

    admin.isActive = false;
    await userRepo.save(admin);
  }

  async restoreAdmin(adminId: number): Promise<void> {
    const userRepo = this.userRepo();
    const admin = await userRepo.findOne({ where: { userId: adminId }, relations: ['team'] });

    if (!admin) {
      throw new Error('Admin not found');
    }

    if (admin.role !== Role.ADMIN) {
      throw new Error('User is not an admin');
    }

    admin.isActive = true;
    await userRepo.save(admin);
  }

  async updateAdmin(request: UpdateAdminRequest, currentUser: CurrentUser): Promise<CreateAdminResponse> {
    const userRepo = this.userRepo();
    const admin = await userRepo.findOne({ where: { userId: currentUser.userId }, relations: ['team'] });

    if (!admin) {
      throw new Error('User not found');
    }

    if (admin.role !== Role.ADMIN) {
      throw new Error('Only ADMIN can update profile');
    }

    if (!isBlank(request.firstName)) {
      admin.firstName = request.firstName!.trim();
    }

    if (!isBlank(request.lastName)) {
      admin.lastName = request.lastName!.trim();
    }

    if (!isBlank(request.email)) {
      const nextEmail = request.email!.trim();
      if (nextEmail !== admin.email) {
        const exists = await userRepo.exists({ where: { email: nextEmail } });
        if (exists) {
          throw new Error('Email already in use');
        }
      }
      admin.email = nextEmail;
    }

    if (!isBlank(request.phoneNumber)) {
      const nextPhone = request.phoneNumber!.trim();
      if (nextPhone !== admin.phoneNumber) {
        const phoneExists = await userRepo.exists({ where: { phoneNumber: nextPhone } });
        if (phoneExists) {
          throw new Error('Phone number already used');
        }
      }
      admin.phoneNumber = nextPhone;
    }

    const saved = await userRepo.save(admin);
    return this.mapToResponse(saved);
  }

  async updateAdminById(adminId: number, request: UpdateAdminRequest): Promise<CreateAdminResponse> {
    const userRepo = this.userRepo();
    const admin = await userRepo.findOne({ where: { userId: adminId }, relations: ['team'] });

    if (!admin) {
      throw new Error('User not found');
    }

    if (admin.role !== Role.ADMIN) {
      throw new Error('Only ADMIN can update profile');
    }

    if (!isBlank(request.firstName)) {
      admin.firstName = request.firstName!.trim();
    }

    if (!isBlank(request.lastName)) {
      admin.lastName = request.lastName!.trim();
    }

    if (!isBlank(request.email)) {
      const nextEmail = request.email!.trim();
      if (nextEmail !== admin.email) {
        const exists = await userRepo.exists({ where: { email: nextEmail } });
        if (exists) {
          throw new Error('Email already in use');
        }
      }
      admin.email = nextEmail;
    }

    if (!isBlank(request.phoneNumber)) {
      const nextPhone = request.phoneNumber!.trim();
      if (nextPhone !== admin.phoneNumber) {
        const phoneExists = await userRepo.exists({ where: { phoneNumber: nextPhone } });
        if (phoneExists) {
          throw new Error('Phone number already used');
        }
      }
      admin.phoneNumber = nextPhone;
    }

    const saved = await userRepo.save(admin);
    return this.mapToResponse(saved);
  }

  async getMyProfile(currentUser: CurrentUser): Promise<CreateAdminResponse> {
    const admin = await this.userRepo().findOne({ where: { userId: currentUser.userId }, relations: ['team'] });

    if (!admin) {
      throw new Error('User not found');
    }

    return this.mapToResponse(admin);
  }

  private mapToResponse(user: User): CreateAdminResponse {
    return {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber ?? null,
      role: user.role,
      active: user.isActive
    };
  }
}
