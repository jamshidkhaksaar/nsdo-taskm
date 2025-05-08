import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Permission } from "../entities/permission.entity";

// Temporary DTOs mirroring controller for service method signatures
// Ideally, these would be shared or imported if they were more complex
// or if validation rules from class-validator were used here.
interface CreatePermissionDto {
  name: string;
  description?: string;
  group?: string;
}

interface UpdatePermissionDto {
  name?: string;
  description?: string;
  group?: string;
}

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { group: "ASC", name: "ASC" },
    });
  }

  async findById(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException(`Permission with ID "${id}" not found`);
    }
    return permission;
  }

  async findByName(name: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { name },
    });
    if (!permission) {
      throw new NotFoundException(`Permission with name "${name}" not found`);
    }
    return permission;
  }

  async findByNames(names: string[]): Promise<Permission[]> {
    return this.permissionRepository.find({
      where: { name: In(names) },
    });
  }

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const { name, description, group } = createPermissionDto;

    // Check if permission with the same name already exists
    const existingPermission = await this.permissionRepository.findOne({ where: { name } });
    if (existingPermission) {
      throw new NotFoundException(`Permission with name "${name}" already exists`);
    }

    const newPermission = this.permissionRepository.create({
      name,
      description,
      group,
    });
    return this.permissionRepository.save(newPermission);
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findById(id); // findById already throws NotFoundException if not found

    // Check if a different permission with the new name already exists
    if (updatePermissionDto.name && updatePermissionDto.name !== permission.name) {
      const existingPermission = await this.permissionRepository.findOne({ where: { name: updatePermissionDto.name } });
      if (existingPermission) {
        throw new NotFoundException(
          `Cannot update permission: another permission with name "${updatePermissionDto.name}" already exists.`,
        );
      }
    }

    // Update fields. Only defined fields in DTO will be updated.
    Object.assign(permission, updatePermissionDto);
    
    return this.permissionRepository.save(permission);
  }

  async remove(id: string): Promise<void> {
    const permission = await this.findById(id); // Ensures permission exists
    // Consider implications: What if this permission is currently assigned to roles?
    // For now, we'll allow deletion. A more robust system might prevent deletion if in use,
    // or remove it from roles automatically (which can be complex).
    await this.permissionRepository.remove(permission);
  }

  // We might add seeding logic here or in a separate seeder later
}
