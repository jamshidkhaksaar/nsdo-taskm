import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find({ order: { group: 'ASC', name: 'ASC' } });
  }

  async findById(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({ where: { id } });
    if (!permission) {
      throw new NotFoundException(`Permission with ID "${id}" not found`);
    }
    return permission;
  }

  async findByName(name: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({ where: { name } });
    if (!permission) {
      throw new NotFoundException(`Permission with name "${name}" not found`);
    }
    return permission;
  }

  async findByNames(names: string[]): Promise<Permission[]> {
    return this.permissionRepository.find({ 
      where: { name: In(names) }
    });
  }

  // We might add seeding logic here or in a separate seeder later
} 