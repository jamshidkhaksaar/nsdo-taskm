import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { TaskStatus, TaskPriority, TaskType } from '@prisma/client'

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  priority: z.nativeEnum(TaskPriority).optional(),
  type: z.nativeEnum(TaskType).optional(),
  dueDate: z.string().datetime().optional(),
  assignedToUserIds: z.array(z.string()).optional(),
  assignedToDepartmentIds: z.array(z.string()).optional(),
  assignedToProvinceId: z.string().optional(),
  isPrivate: z.boolean().optional()
})

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') as TaskStatus
    const priority = searchParams.get('priority') as TaskPriority
    const type = searchParams.get('type') as TaskType

    const skip = (page - 1) * limit

    const where: any = {
      isDeleted: false,
      OR: [
        { createdById: userId },
        { assignedToUsers: { some: { id: userId } } },
        { 
          assignedToDepartments: { 
            some: { 
              members: { some: { id: userId } } 
            } 
          } 
        }
      ]
    }

    if (status) where.status = status
    if (priority) where.priority = priority
    if (type) where.type = type

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              email: true,
              avatarUrl: true
            }
          },
          assignedToUsers: {
            select: {
              id: true,
              username: true,
              email: true,
              avatarUrl: true
            }
          },
          assignedToDepartments: {
            select: {
              id: true,
              name: true
            }
          },
          assignedToProvince: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.task.count({ where })
    ])

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get tasks error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createTaskSchema.parse(body)

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority || TaskPriority.MEDIUM,
        type: data.type || TaskType.PERSONAL,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        isPrivate: data.isPrivate || false,
        createdById: userId,
        assignedToUsers: data.assignedToUserIds ? {
          connect: data.assignedToUserIds.map(id => ({ id }))
        } : undefined,
        assignedToDepartments: data.assignedToDepartmentIds ? {
          connect: data.assignedToDepartmentIds.map(id => ({ id }))
        } : undefined,
        assignedToProvinceId: data.assignedToProvinceId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true
          }
        },
        assignedToUsers: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true
          }
        },
        assignedToDepartments: {
          select: {
            id: true,
            name: true
          }
        },
        assignedToProvince: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // TODO: Send notifications to assigned users
    
    return NextResponse.json({ task }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create task error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}