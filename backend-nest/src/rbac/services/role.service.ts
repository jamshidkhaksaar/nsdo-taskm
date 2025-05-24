import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Role } from "../entities/role.entity";
import { Permission } from "../entities/permission.entity";
import { User } from "../../users/entities/user.entity"; // For checking permissions

// Define a simple DTO structure for clarity
interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds?: string[];
}

interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ["permissions"],
      order: { name: "ASC" },
    });
  }

  async findById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ["permissions"],
    });
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }
    return role;
  }

  async findByName(name: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { name },
      relations: ["permissions"],
    });
    if (!role) {
      throw new NotFoundException(`Role with name "${name}" not found`);
    }
    return role;
  }

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const { name, description, permissionIds } = createRoleDto;

    const existingRole = await this.roleRepository.findOne({ where: { name } });
    if (existingRole) {
      throw new ConflictException(`Role with name "${name}" already exists`);
    }

    const newRole = this.roleRepository.create({ name, description });

    if (permissionIds && permissionIds.length > 0) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(permissionIds) },
      });
      if (permissions.length !== permissionIds.length) {
        throw new BadRequestException("One or more permission IDs are invalid");
      }
      newRole.permissions = permissions;
    } else {
      newRole.permissions = [];
    }

    return this.roleRepository.save(newRole);
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findById(id); // Ensures role exists

    if (role.isSystemRole) {
      throw new ForbiddenException("System roles cannot be modified.");
    }

    const { name, description, permissionIds } = updateRoleDto;

    if (name && name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name },
      });
      if (existingRole) {
        throw new ConflictException(`Role with name "${name}" already exists`);
      }
      role.name = name;
    }

    if (description !== undefined) {
      role.description = description;
    }

    if (permissionIds !== undefined) {
      if (permissionIds.length > 0) {
        const permissions = await this.permissionRepository.find({
          where: { id: In(permissionIds) },
        });
        if (permissions.length !== permissionIds.length) {
          throw new BadRequestException(
            "One or more permission IDs are invalid",
          );
        }
        role.permissions = permissions;
      } else {
        // If an empty array is passed, remove all permissions
        role.permissions = [];
      }
    }

    return this.roleRepository.save(role);
  }

  async delete(id: string): Promise<void> {
    const role = await this.findById(id);

    if (role.isSystemRole) {
      throw new ForbiddenException("System roles cannot be deleted.");
    }

    // Consider implications: what happens to users with this role?
    // TypeORM onDelete: 'SET NULL' on User entity handles this if set up
    const result = await this.roleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Role with ID "${id}" not found during delete`,
      );
    }
  }

  // --- Permission Management ---

  async addPermissionToRole(
    roleId: string,
    permissionId: string,
  ): Promise<Role> {
    const role = await this.findById(roleId);
    if (role.isSystemRole) {
      throw new ForbiddenException(
        "Permissions cannot be modified for system roles.",
      );
    }
    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
    });
    if (!permission) {
      throw new NotFoundException(
        `Permission with ID "${permissionId}" not found`,
      );
    }

    // Check if permission already exists to avoid duplicates if necessary
    const hasPermission = role.permissions.some((p) => p.id === permissionId);
    if (!hasPermission) {
      role.permissions.push(permission);
      await this.roleRepository.save(role); // Need to save the role entity itself after modifying relation
    }
    return role;
  }

  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<Role> {
    const role = await this.findById(roleId);
    if (role.isSystemRole) {
      throw new ForbiddenException(
        "Permissions cannot be modified for system roles.",
      );
    }
    const permissionIndex = role.permissions.findIndex(
      (p) => p.id === permissionId,
    );

    if (permissionIndex === -1) {
      throw new NotFoundException(
        `Permission with ID "${permissionId}" not found in role "${role.name}"`,
      );
    }

    role.permissions.splice(permissionIndex, 1);
    await this.roleRepository.save(role); // Save the role entity
    return role;
  }

  // --- Permission Checking ---

  async hasPermission(user: User, permissionName: string): Promise<boolean> {
    if (!user || !user.role) {
      return false; // No user or no assigned role
    }

    // Fetch role with permissions if not already loaded (depends on eager loading)
    // This ensures we have the latest permissions, though eager loading on User might suffice
    const roleWithPermissions = await this.roleRepository.findOne({
      where: { id: user.role.id },
      relations: ["permissions"],
    });

    if (!roleWithPermissions || !roleWithPermissions.permissions) {
      return false; // Role not found or has no permissions array
    }

    return roleWithPermissions.permissions.some(
      (permission) => permission.name === permissionName,
    );
  }

  async hasAllPermissions(
    user: User,
    permissionNames: string[],
  ): Promise<boolean> {
    if (!user || !user.role) {
      return false;
    }
    if (!permissionNames || permissionNames.length === 0) {
      return true; // No permissions required
    }

    const roleWithPermissions = await this.roleRepository.findOne({
      where: { id: user.role.id },
      relations: ["permissions"],
    });

    if (!roleWithPermissions || !roleWithPermissions.permissions) {
      return false;
    }

    const userPermissions = new Set(
      roleWithPermissions.permissions.map((p) => p.name),
    );
    return permissionNames.every((requiredPermission) =>
      userPermissions.has(requiredPermission),
    );
  }

  async hasAnyPermission(
    user: User,
    permissionNames: string[],
  ): Promise<boolean> {
    if (!user || !user.role) {
      return false;
    }
    if (!permissionNames || permissionNames.length === 0) {
      return true; // Or false depending on desired behavior for empty required list
    }

    const roleWithPermissions = await this.roleRepository.findOne({
      where: { id: user.role.id },
      relations: ["permissions"],
    });

    if (!roleWithPermissions || !roleWithPermissions.permissions) {
      return false;
    }

    const userPermissions = new Set(
      roleWithPermissions.permissions.map((p) => p.name),
    );
    return permissionNames.some((requiredPermission) =>
      userPermissions.has(requiredPermission),
    );
  }
}
