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
    return this.departmentsRepository.find({
      relations: ['members', 'head', 'tasks'],
    });
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.departmentsRepository.findOne({
      where: { id },
      relations: ['members', 'head', 'tasks'],
    });

    if (!department) {
      throw new NotFoundException(`Department with ID "${id}" not found`);
    }

    return department;
  }

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
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
      headId,
    });

    if (headId) {
      const head = await this.usersService.findById(headId);
      department.head = head;
    }

    return this.departmentsRepository.save(department);
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
    const department = await this.findOne(id);

    // Apply updates
    if (updateDepartmentDto.name !== undefined) {
      department.name = updateDepartmentDto.name;
    }
    
    if (updateDepartmentDto.description !== undefined) {
      department.description = updateDepartmentDto.description;
    }
    
    if (updateDepartmentDto.headId !== undefined) {
      department.headId = updateDepartmentDto.headId;
      
      if (updateDepartmentDto.headId) {
        const head = await this.usersService.findById(updateDepartmentDto.headId);
        department.head = head;
      }
      // If headId is empty/null/undefined, we just update the headId field
      // but don't try to set the head relation to null
    }

    return this.departmentsRepository.save(department);
  }

  async remove(id: string): Promise<void> {
    const result = await this.departmentsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Department with ID "${id}" not found`);
    }
  }

  async addMember(departmentId: string, userId: string): Promise<Department> {
    const department = await this.findOne(departmentId);
    const user = await this.usersService.findById(userId);

    if (!department.members) {
      department.members = [];
    }

    department.members.push(user);
    return this.departmentsRepository.save(department);
  }

  async removeMember(departmentId: string, userId: string): Promise<Department> {
    const department = await this.findOne(departmentId);

    if (!department.members) {
      return department;
    }

    department.members = department.members.filter(member => member.id !== userId);
    return this.departmentsRepository.save(department);
  }

  async getDepartmentPerformance(id: string): Promise<any> {
    const department = await this.findOne(id);
    const totalTasks = department.tasks ? department.tasks.length : 0;
    const completedTasks = department.tasks 
      ? department.tasks.filter(task => task.status === 'DONE').length 
      : 0;
    
    return {
      totalTasks,
      completedTasks,
      performance: totalTasks ? (completedTasks / totalTasks) * 100 : 0,
    };
  }
} 