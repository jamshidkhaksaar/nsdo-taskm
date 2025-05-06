import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Permission } from "../entities/permission.entity";
import { Role } from "../entities/role.entity";

// Define initial permissions based on implementation-plan.md
const INITIAL_PERMISSIONS = [
  // --- Tasks (Refined) ---
  { name: "task.create", description: "Create new tasks", group: "Tasks" },
  { name: "task.view.own", description: "View own created/assigned/delegated tasks", group: "Tasks" },
  { name: "task.view.department", description: "View tasks assigned to own department(s)", group: "Tasks" }, // Keep for potential future use
  { name: "task.view.all", description: "View all tasks (Admin/Leadership)", group: "Tasks" },
  { name: "task.view.recyclebin", description: "View deleted tasks in recycle bin (Admin/Leadership)", group: "Tasks" },
  { name: "task.view.counts.own", description: "View own task counts by status", group: "Tasks" },
  { name: "task.view.counts.department", description: "View task counts for a specific department", group: "Tasks" }, // Keep for potential future use
  { name: "task.view.counts.user", description: "View task counts for any user (Admin/Leadership)", group: "Tasks" },
  { name: "task.update.details.own", description: "Update details (title, desc, due date) of own created tasks", group: "Tasks" },
  { name: "task.update.details.all", description: "Update details (title, desc, due date) of any task", group: "Tasks" },
  { name: "task.update.status.own", description: "Update status of own created/assigned tasks", group: "Tasks" },
  { name: "task.update.status.all", description: "Update status of any task", group: "Tasks" },
  { name: "task.update.priority.own", description: "Update priority of own created/assigned tasks", group: "Tasks" },
  { name: "task.update.priority.all", description: "Update priority of any task", group: "Tasks" },
  { name: "task.delete.soft.own", description: "Move own created tasks to recycle bin", group: "Tasks" },
  { name: "task.delete.soft.all", description: "Move any task to recycle bin", group: "Tasks" },
  { name: "task.delete.permanent", description: "Permanently delete tasks (Admin only)", group: "Tasks" },
  { name: "task.restore", description: "Restore tasks from recycle bin (Admin/Leadership)", group: "Tasks" },
  { name: "task.delegate.own", description: "Delegate own created/assigned tasks", group: "Tasks" },
  { name: "task.delegate.all", description: "Delegate any task", group: "Tasks" },

  // --- Notes (Keep existing) ---
  { name: "note:add", description: "Add notes to tasks/items", group: "Notes" },
  { name: "note:view", description: "View notes", group: "Notes" },
  { name: "note:edit:own", description: "Edit own notes", group: "Notes" },
  { name: "note:delete:own", description: "Delete own notes", group: "Notes" },
  // Departments
  {
    name: "department:create",
    description: "Create new departments",
    group: "Departments",
  },
  {
    name: "department:view",
    description: "View departments",
    group: "Departments",
  },
  {
    name: "department:edit",
    description: "Edit departments",
    group: "Departments",
  },
  {
    name: "department:delete",
    description: "Delete departments",
    group: "Departments",
  },
  {
    name: "department:assign_users",
    description: "Assign users to departments",
    group: "Departments",
  },
  // Users
  { name: "user:create", description: "Create new users", group: "Users" },
  {
    name: "user:view:profile",
    description: "View user profiles",
    group: "Users",
  },
  { name: "user:view:list", description: "View list of users", group: "Users" },
  {
    name: "user:edit:own_profile",
    description: "Edit own user profile",
    group: "Users",
  },
  {
    name: "user:edit:any",
    description: "Edit any user profile",
    group: "Users",
  },
  { name: "user:delete", description: "Delete users", group: "Users" },
  {
    name: "user:assign_role",
    description: "Assign roles to users",
    group: "Users",
  },
  {
    name: "user:manage_2fa:own",
    description: "Manage own 2FA settings",
    group: "Users",
  },
  {
    name: "user:manage_2fa:any",
    description: "Manage any user's 2FA settings",
    group: "Users",
  },
  // Provinces
  {
    name: "province:create",
    description: "Create new provinces",
    group: "Provinces",
  },
  { name: "province:view", description: "View provinces", group: "Provinces" },
  { name: "province:edit", description: "Edit provinces", group: "Provinces" },
  {
    name: "province:delete",
    description: "Delete provinces",
    group: "Provinces",
  },
  // Settings
  {
    name: "settings:view:system",
    description: "View system settings",
    group: "Settings",
  },
  {
    name: "settings:edit:system",
    description: "Edit system settings",
    group: "Settings",
  },
  // Admin Panel Pages
  {
    name: "page:view:admin_dashboard",
    description: "View Admin Dashboard page",
    group: "Admin Pages",
  },
  {
    name: "page:view:user_management",
    description: "View User Management page",
    group: "Admin Pages",
  },
  {
    name: "page:view:department_management",
    description: "View Department Management page",
    group: "Admin Pages",
  },
  {
    name: "page:view:role_management",
    description: "View Role Management page",
    group: "Admin Pages",
  },
  {
    name: "page:view:activity_logs",
    description: "View Activity Logs page",
    group: "Admin Pages",
  }, // Placeholder
  {
    name: "page:view:backup_restore",
    description: "View Backup/Restore page",
    group: "Admin Pages",
  }, // Placeholder
  {
    name: "page:view:recycle_bin",
    description: "View Recycle Bin page",
    group: "Admin Pages",
  }, // Placeholder
  // RBAC Management itself
  { name: "role:create", description: "Create new roles", group: "RBAC" },
  { name: "role:edit", description: "Edit existing roles", group: "RBAC" },
  { name: "role:delete", description: "Delete roles", group: "RBAC" },
  {
    name: "permission:assign",
    description: "Assign permissions to roles",
    group: "RBAC",
  },
];

// Define initial Roles and their permissions
const INITIAL_ROLES = [
  {
    name: "Super Admin",
    description: "Has all permissions, system role.",
    isSystemRole: true,
    permissions: INITIAL_PERMISSIONS.map((p) => p.name), // Assign all permissions
  },
  {
    name: "admin", // Changed from 'Admin'
    description: "Administrator role with full access to the system.",
    isSystemRole: true,
    // Explicitly list all permissions for clarity, including new granular ones
    permissions: [
      // Tasks
      "task.create", "task.view.own", "task.view.department", "task.view.all", "task.view.recyclebin",
      "task.view.counts.own", "task.view.counts.department", "task.view.counts.user",
      "task.update.details.own", "task.update.details.all",
      "task.update.status.own", "task.update.status.all",
      "task.update.priority.own", "task.update.priority.all",
      "task.delete.soft.own", "task.delete.soft.all", "task.delete.permanent",
      "task.restore", "task.delegate.own", "task.delegate.all",
      // Notes
      "note:add", "note:view", "note:edit:own", "note:delete:own",
      // Departments
      "department:create", "department:view", "department:edit", "department:delete", "department:assign_users",
      // Users
      "user:create", "user:view:profile", "user:view:list", "user:edit:any", "user:delete", "user:assign_role",
      "user:manage_2fa:own", "user:manage_2fa:any",
      // Provinces
      "province:create", "province:view", "province:edit", "province:delete",
      // Settings
      "settings:view:system", "settings:edit:system",
      // Admin Pages
      "page:view:admin_dashboard", "page:view:user_management", "page:view:department_management",
      "page:view:role_management", "page:view:activity_logs", "page:view:backup_restore", "page:view:recycle_bin",
      // RBAC Management
      "role:create", "role:edit", "role:delete", "permission:assign",
    ],
  },
  {
    name: "leadership",
    description:
      "Leadership role with access to departmental management and reporting.",
    isSystemRole: true,
    permissions: [
      // Tasks (More granular)
      "task.create", "task.view.own", "task.view.department", "task.view.all", "task.view.recyclebin", // Can view all/recycle bin
      "task.view.counts.own", "task.view.counts.department", "task.view.counts.user", // Can view all counts
      "task.update.details.own", "task.update.details.all", // Can update any details
      "task.update.status.own", "task.update.status.all", // Can update any status
      "task.update.priority.own", "task.update.priority.all", // Can update any priority
      "task.delete.soft.own", "task.delete.soft.all", // Can soft delete any
      "task.restore", // Can restore
      "task.delegate.own", "task.delegate.all", // Can delegate any
      // Notes
      "note:add", "note:view", "note:edit:own", "note:delete:own",
      // Departments
      "department:create", "department:view", "department:edit", "department:assign_users", // Can manage deps, assign users
      // Users
      "user:view:profile", "user:view:list", // View users, REMOVED edit own profile
      "user:manage_2fa:own",
      // Provinces
      "province:view",
      // Admin pages
      "page:view:admin_dashboard", "page:view:department_management", // Relevant admin pages
    ],
  },
  {
    name: "user", // Changed from 'User'
    description: "Standard user role with basic access.",
    isSystemRole: true,
    permissions: [
      // Tasks (Own actions)
      "task.create",
      "task.view.own",
      "task.view.counts.own",
      "task.update.details.own",
      "task.update.status.own",
      "task.update.priority.own",
      "task.delete.soft.own",
      "task.delegate.own",
      // Notes
      "note:add", "note:view", "note:edit:own", "note:delete:own",
      // Users
      "user:view:profile", "user:edit:own_profile",
      "user:manage_2fa:own",
    ],
  },
  // Remove the duplicate 'Standard User' role for now to avoid confusion
  // {
  //   name: "Standard User",
  //   description: "Basic access for regular users.",
  //   isSystemRole: false,
  //   permissions: [
  //     "task:view:own",
  //     "task:edit:own",
  //     "task:create",
  //     "note:add",
  //     "note:view",
  //     "note:edit:own",
  //     "note:delete:own",
  //     "user:view:profile",
  //     "user:edit:own_profile",
  //     "user:manage_2fa:own",
  //   ],
  // },
];

@Injectable()
export class RbacSeederService implements OnModuleInit {
  private readonly logger = new Logger(RbacSeederService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    this.logger.log("Starting RBAC Seeding...");
    console.log("RBAC Seeder: Creating permissions and roles");
    await this.seedPermissions();
    await this.seedRoles();
    this.logger.log("RBAC Seeding Completed.");
    console.log("RBAC Seeder: Permissions and roles have been created.");
  }

  // Make these methods public so they can be called from the controller
  async seedPermissions() {
    this.logger.log("Seeding Permissions...");
    const existingPermissions = await this.permissionRepository.find();
    const existingPermissionNames = new Set(
      existingPermissions.map((p) => p.name),
    );

    const permissionsToCreate: Partial<Permission>[] = [];
    for (const pData of INITIAL_PERMISSIONS) {
      if (!existingPermissionNames.has(pData.name)) {
        permissionsToCreate.push(pData);
      }
    }

    if (permissionsToCreate.length > 0) {
      this.logger.log(
        `Creating ${permissionsToCreate.length} new permissions...`,
      );
      await this.permissionRepository.save(permissionsToCreate);
    } else {
      this.logger.log("All initial permissions already exist.");
    }
  }

  async seedRoles() {
    this.logger.log("Seeding Roles...");
    // Ensure all permissions are loaded for assignment
    const allPermissions = await this.permissionRepository.find();
    const permissionsMap = new Map(allPermissions.map((p) => [p.name, p]));

    for (const rData of INITIAL_ROLES) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: rData.name },
        relations: ["permissions"], // Load existing permissions too
      });

      const rolePermissions = rData.permissions
        .map((pName) => permissionsMap.get(pName))
        .filter((p): p is Permission => p !== undefined);

      if (!existingRole) {
        this.logger.log(`Creating role: ${rData.name}`);
        const newRole = this.roleRepository.create({
          name: rData.name,
          description: rData.description,
          isSystemRole: rData.isSystemRole,
          permissions: rolePermissions,
        });
        await this.roleRepository.save(newRole);
      } else {
        this.logger.log(
          `Role "${rData.name}" already exists. Checking permissions...`,
        );
        // Optionally update permissions if needed (be careful with system roles)
        // Example: Ensure system roles always have the defined permissions
        if (rData.isSystemRole) {
          const existingPermNames = new Set(
            existingRole.permissions.map((p) => p.name),
          );
          const requiredPermNames = new Set(rData.permissions);
          const needsUpdate =
            rData.permissions.some((p) => !existingPermNames.has(p)) ||
            existingRole.permissions.some(
              (p) => !requiredPermNames.has(p.name),
            );

          if (needsUpdate) {
            this.logger.log(
              `Updating permissions for system role: ${rData.name}`,
            );
            existingRole.permissions = rolePermissions;
            await this.roleRepository.save(existingRole);
          }
        }
        // For non-system roles, you might choose not to overwrite existing permissions automatically.
      }
    }
  }
}
