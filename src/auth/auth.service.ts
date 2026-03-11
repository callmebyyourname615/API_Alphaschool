import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Admin } from '../admins/admin.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private adminRepo: Repository<Admin>,

    //@InjectRepository(Parent)
    // private parentRepo: Repository<Parent>,
    private jwtService: JwtService,
  ) {}

async login(email: string, password: string) {
  const admin = await this.adminRepo.findOne({
    where: {
      email: email.trim().toLowerCase(),
      is_active: true,
      is_deleted: false,
    },
    relations: ['roles', 'branch'], // <-- include branch relation
  });

  if (!admin) {
    throw new UnauthorizedException('Invalid email or password');
  }

  if (!admin.password) {
    throw new UnauthorizedException('No password set for this account');
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid email or password');
  }

  const payload = {
    sub: admin.id,
    username: admin.username,
    email: admin.email,
    roles: (admin.roles || []).map(r => ({
      id: r.id,
      name: r.name,
      level: r.level,
    })),
    branch: admin.branch ? { id: admin.branch.id, name: admin.branch.name } : { id: '', name: 'Main Branch' }, // <-- add branch
    user_type: 'admin',
  };

  return {
    access_token: this.jwtService.sign(payload),
    user: payload,
  };
}

  /*  async loginParent(email: string, password: string) {
    const parent = await this.parentRepo.findOne({
      where: { email, is_active: true, is_deleted: false },
      relations: ['branch'],
    });

    if (!parent) throw new UnauthorizedException('Invalid email or password');

    // Validate branch status
    if (
      !parent.branch ||
      parent.branch.is_deleted ||
      !parent.branch.is_active
    ) {
      throw new UnauthorizedException('Parent branch is not valid or inactive');
    }

    const isMatch = await bcrypt.compare(password, parent.password);
    if (!isMatch) throw new UnauthorizedException('Invalid email or password');

    const payload = {
      id: parent.id,
      email: parent.email,
      first_name: parent.first_name,
      last_name: parent.last_name,
      branch: { id: parent.branch.id, name: parent.branch.name },
      phone: parent.phone,
      user_type: 'parent',
    };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '12h' }),
      parent: payload,
    };
  }*/

  async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }
}
