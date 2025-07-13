import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import type { User } from '@prisma/client'
import { JWTService, type JWTPayload } from './jwt'

export type { JWTPayload }

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12')
    return bcrypt.hash(password, rounds)
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  static generateToken(payload: JWTPayload): string {
    return JWTService.generateToken(payload)
  }

  static verifyToken(token: string): JWTPayload {
    return JWTService.verifyToken(token)
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    })
  }

  static async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    })
  }

  static async createUser(userData: {
    username: string
    email: string
    password: string
    roleId?: string
  }): Promise<User> {
    const hashedPassword = await this.hashPassword(userData.password)
    
    return prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword
      },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    })
  }

  static async validateCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.findUserByEmail(email)
    
    if (!user || !user.isActive) {
      return null
    }

    const isValidPassword = await this.comparePassword(password, user.password)
    
    return isValidPassword ? user : null
  }
}