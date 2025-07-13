import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create permissions
  const permissions = await prisma.permission.createMany({
    data: [
      // User permissions
      { name: 'user:create', description: 'Create users', group: 'Users' },
      { name: 'user:read', description: 'Read users', group: 'Users' },
      { name: 'user:update', description: 'Update users', group: 'Users' },
      { name: 'user:delete', description: 'Delete users', group: 'Users' },
      
      // Task permissions
      { name: 'task:create', description: 'Create tasks', group: 'Tasks' },
      { name: 'task:read', description: 'Read tasks', group: 'Tasks' },
      { name: 'task:update', description: 'Update tasks', group: 'Tasks' },
      { name: 'task:delete', description: 'Delete tasks', group: 'Tasks' },
      { name: 'task:assign', description: 'Assign tasks', group: 'Tasks' },
      { name: 'task:delegate', description: 'Delegate tasks', group: 'Tasks' },
      
      // Department permissions
      { name: 'department:create', description: 'Create departments', group: 'Departments' },
      { name: 'department:read', description: 'Read departments', group: 'Departments' },
      { name: 'department:update', description: 'Update departments', group: 'Departments' },
      { name: 'department:delete', description: 'Delete departments', group: 'Departments' },
      
      // Admin permissions
      { name: 'admin:system', description: 'System administration', group: 'Admin' },
      { name: 'admin:settings', description: 'Manage settings', group: 'Admin' },
      { name: 'admin:backups', description: 'Manage backups', group: 'Admin' },
      { name: 'admin:analytics', description: 'View analytics', group: 'Admin' },
      
      // RBAC permissions
      { name: 'rbac:roles', description: 'Manage roles', group: 'RBAC' },
      { name: 'rbac:permissions', description: 'Manage permissions', group: 'RBAC' },
    ],
    skipDuplicates: true
  })

  console.log(`✅ Created ${permissions.count} permissions`)

  // Get created permissions for role assignment
  const allPermissions = await prisma.permission.findMany()
  
  // Create roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'Admin',
      description: 'System administrator with full access',
      isSystemRole: true,
      permissions: {
        connect: allPermissions.map(p => ({ id: p.id }))
      }
    }
  })

  const managerRole = await prisma.role.create({
    data: {
      name: 'Manager',
      description: 'Department manager with extended permissions',
      isSystemRole: true,
      permissions: {
        connect: allPermissions
          .filter(p => !p.name.startsWith('admin:') && !p.name.startsWith('rbac:'))
          .map(p => ({ id: p.id }))
      }
    }
  })

  const userRole = await prisma.role.create({
    data: {
      name: 'User',
      description: 'Regular user with basic permissions',
      isSystemRole: true,
      permissions: {
        connect: allPermissions
          .filter(p => p.name.includes(':read') || p.name === 'task:create' || p.name === 'task:update')
          .map(p => ({ id: p.id }))
      }
    }
  })

  console.log('✅ Created roles: Admin, Manager, User')

  // Create provinces
  const provinces = await prisma.province.createMany({
    data: [
      { name: 'Kabul', description: 'Capital province' },
      { name: 'Herat', description: 'Western province' },
      { name: 'Balkh', description: 'Northern province' },
      { name: 'Kandahar', description: 'Southern province' },
      { name: 'Nangarhar', description: 'Eastern province' },
    ],
    skipDuplicates: true
  })

  console.log(`✅ Created ${provinces.count} provinces`)

  // Get created provinces for department assignment
  const allProvinces = await prisma.province.findMany()

  // Create departments
  const departments = await prisma.department.createMany({
    data: [
      {
        name: 'Information Technology',
        description: 'IT support and development',
        provinceId: allProvinces[0].id
      },
      {
        name: 'Human Resources',
        description: 'Personnel management',
        provinceId: allProvinces[0].id
      },
      {
        name: 'Finance',
        description: 'Financial management',
        provinceId: allProvinces[1].id
      },
      {
        name: 'Operations',
        description: 'Operational management',
        provinceId: allProvinces[2].id
      },
    ],
    skipDuplicates: true
  })

  console.log(`✅ Created ${departments.count} departments`)

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@nsdo.org.af',
      password: hashedPassword,
      position: 'System Administrator',
      bio: 'System administrator account',
      isActive: true,
      roleId: adminRole.id,
      skills: ['System Administration', 'Database Management'],
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en'
      }
    }
  })

  console.log('✅ Created admin user (admin@nsdo.org.af / admin123)')

  // Create sample manager user
  const managerPassword = await bcrypt.hash('manager123', 12)
  
  const managerUser = await prisma.user.create({
    data: {
      username: 'manager',
      email: 'manager@nsdo.org.af',
      password: managerPassword,
      position: 'Department Manager',
      bio: 'IT Department Manager',
      isActive: true,
      roleId: managerRole.id,
      skills: ['Project Management', 'Team Leadership'],
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en'
      }
    }
  })

  console.log('✅ Created manager user (manager@nsdo.org.af / manager123)')

  // Create sample regular user
  const userPassword = await bcrypt.hash('user123', 12)
  
  const regularUser = await prisma.user.create({
    data: {
      username: 'user',
      email: 'user@nsdo.org.af',
      password: userPassword,
      position: 'Software Developer',
      bio: 'Frontend developer',
      isActive: true,
      roleId: userRole.id,
      skills: ['JavaScript', 'React', 'TypeScript'],
      preferences: {
        theme: 'dark',
        notifications: true,
        language: 'en'
      }
    }
  })

  console.log('✅ Created regular user (user@nsdo.org.af / user123)')

  // Create sample tasks
  const tasks = await prisma.task.createMany({
    data: [
      {
        title: 'Setup development environment',
        description: 'Configure development environment for new team members',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        type: 'DEPARTMENT',
        createdById: adminUser.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      {
        title: 'Code review for authentication module',
        description: 'Review and test the new authentication implementation',
        priority: 'MEDIUM',
        status: 'PENDING',
        type: 'USER',
        createdById: managerUser.id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      },
      {
        title: 'Update user documentation',
        description: 'Update end-user documentation with new features',
        priority: 'LOW',
        status: 'PENDING',
        type: 'PERSONAL',
        createdById: regularUser.id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
      },
    ],
    skipDuplicates: true
  })

  console.log(`✅ Created ${tasks.count} sample tasks`)

  // Create system settings
  await prisma.setting.createMany({
    data: [
      {
        key: 'SYSTEM_NAME',
        value: 'NSDO Task Management System',
        description: 'System name displayed in the interface'
      },
      {
        key: 'MAX_FILE_UPLOAD_SIZE',
        value: '10485760', // 10MB
        description: 'Maximum file upload size in bytes'
      },
      {
        key: 'SESSION_TIMEOUT',
        value: '3600', // 1 hour
        description: 'Session timeout in seconds'
      },
    ],
    skipDuplicates: true
  })

  console.log('✅ Created system settings')

  // Create security settings
  await prisma.securitySettings.create({
    data: {
      twoFactorEnabled: false,
      twoFactorDeviceRemembranceDays: 30,
      twoFactorMaxFailedAttempts: 5,
      passwordExpiryDays: 90,
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 30,
      passwordComplexityRequired: true,
      sessionTimeoutMinutes: 60,
    }
  })

  console.log('✅ Created security settings')

  // Create notification settings
  await prisma.notificationSettings.create({
    data: {
      emailNotificationsEnabled: true,
      smtpServer: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUsername: 'notifications@nsdo.org.af',
      smtpUseTls: true,
    }
  })

  console.log('✅ Created notification settings')

  // Create backup settings
  await prisma.backupSettings.create({
    data: {
      autoBackupEnabled: true,
      backupFrequencyHours: 24,
      backupRetentionDays: 30,
      backupLocation: '/backups',
    }
  })

  console.log('✅ Created backup settings')

  console.log('🎉 Database seeding completed successfully!')
  console.log('\n📝 Test Credentials:')
  console.log('Admin: admin@nsdo.org.af / admin123')
  console.log('Manager: manager@nsdo.org.af / manager123')
  console.log('User: user@nsdo.org.af / user123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })