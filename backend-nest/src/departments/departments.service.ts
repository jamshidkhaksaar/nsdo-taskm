import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentsRepository: Repository<Department>,
    private usersService: UsersService,
  ) {}

  async findAll(): Promise<Department[]> {
    try {
      return await this.departmentsRepository.find({
        relations: {
          members: true,
          head: true,
          tasks: true
        }
      });
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Department> {
    try {
      const department = await this.departmentsRepository.findOne({
        where: { id },
        relations: {
          members: true,
          head: true,
          tasks: true
        }
      });

      if (!department) {
        throw new NotFoundException(`Department with ID "${id}" not found`);
      }

      return department;
    } catch (error) {
      console.error(`Error fetching department ${id}:`, error);
      throw error;
    }
  }

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    try {
      const { name, description, headId } = createDepartmentDto;

      // Check if department with same name exists
      const existingDepartment = await this.departmentsRepository.findOne({
        where: { name },
      });

      if (existingDepartment) {
        throw new ConflictException(`Department with name "${name}" already exists`);
      }

      const department = this.departmentsRepository.create({
        name,
        description,
      });

      if (headId) {
        const head = await this.usersService.findById(headId);
        if (!head) {
          throw new NotFoundException(`User with ID "${headId}" not found`);
        }
        department.headId = headId;
        department.head = head;
      }

      return await this.departmentsRepository.save(department);
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
    try {
      const department = await this.findOne(id);

      if (updateDepartmentDto.name) {
        const existingDepartment = await this.departmentsRepository.findOne({
          where: { name: updateDepartmentDto.name },
        });

        if (existingDepartment && existingDepartment.id !== id) {
          throw new ConflictException(`Department with name "${updateDepartmentDto.name}" already exists`);
        }
      }

      if (updateDepartmentDto.headId) {
        const head = await this.usersService.findById(updateDepartmentDto.headId);
        if (!head) {
          throw new NotFoundException(`User with ID "${updateDepartmentDto.headId}" not found`);
        }
        department.headId = updateDepartmentDto.headId;
        department.head = head;
      }

      Object.assign(department, updateDepartmentDto);
      return await this.departmentsRepository.save(department);
    } catch (error) {
      console.error(`Error updating department ${id}:`, error);
      throw error;
    }
  }

  async addMember(id: string, userId: string): Promise<Department> {
    try {
      const department = await this.findOne(id);
      const user = await this.usersService.findById(userId);

      if (!user) {
        throw new NotFoundException(`User with ID "${userId}" not found`);
      }

      if (!department.members) {
        department.members = [];
      }

      if (!department.members.some(member => member.id === userId)) {
        department.members.push(user);
        await this.departmentsRepository.save(department);
      }

      return department;
    } catch (error) {
      console.error(`Error adding member ${userId} to department ${id}:`, error);
      throw error;
    }
  }

  async removeMember(id: string, userId: string): Promise<Department> {
    try {
      const department = await this.findOne(id);

      if (!department.members) {
        throw new NotFoundException(`No members found in department "${id}"`);
      }

      department.members = department.members.filter(member => member.id !== userId);
      return await this.departmentsRepository.save(department);
    } catch (error) {
      console.error(`Error removing member ${userId} from department ${id}:`, error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.departmentsRepository.delete(id);

      if (result.affected === 0) {
        throw new NotFoundException(`Department with ID "${id}" not found`);
      }
    } catch (error) {
      console.error(`Error removing department ${id}:`, error);
      throw error;
    }
  }

  async getDepartmentPerformance(id: string): Promise<any> {
    try {
      const department = await this.findOne(id);
      
      // Add your performance calculation logic here
      return {
        departmentId: department.id,
        name: department.name,
        totalMembers: department.members?.length || 0,
        totalTasks: department.tasks?.length || 0,
        // Add more metrics as needed
      };
    } catch (error) {
      console.error(`Error getting performance for department ${id}:`, error);
      throw error;
    }
  }
} 