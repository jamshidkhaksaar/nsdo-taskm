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
      console.log(`Creating new department: ${JSON.stringify(createDepartmentDto)}`);
      const { name, description, head } = createDepartmentDto;

      // Check if department with same name exists
      const existingDepartment = await this.departmentsRepository.findOne({
        where: { name },
      });

      if (existingDepartment) {
        throw new ConflictException(`Department with name "${name}" already exists`);
      }

      // Create and save the basic department first
      const department = this.departmentsRepository.create({
        name,
        description,
      });

      // First save the department to get an ID
      const savedDepartment = await this.departmentsRepository.save(department);
      console.log(`Created department: ${savedDepartment.id}`);

      // If a head is specified, set it using direct SQL for reliability
      if (head) {
        try {
          const headUser = await this.usersService.findById(head);
          if (!headUser) {
            throw new NotFoundException(`User with ID "${head}" not found`);
          }
          
          console.log(`Found head user: ${headUser.username} (${headUser.id})`);
          
          // Direct SQL update of headId field
          await this.departmentsRepository.manager.query(
            `UPDATE department SET headId = ? WHERE id = ?`,
            [head, savedDepartment.id]
          );
          console.log(`Set headId with direct SQL`);
          
          // Add entry to department_heads junction table
          await this.departmentsRepository.manager.query(
            `INSERT INTO department_heads (department_id, head_id) VALUES (?, ?)`,
            [savedDepartment.id, head]
          );
          console.log(`Added entry to department_heads junction table`);
          
          // Update the local object for consistency
          savedDepartment.headId = head;
          savedDepartment.head = headUser;
          
          console.log(`Successfully set head for department ${savedDepartment.id} to user ${headUser.username} (${headUser.id})`);
        } catch (error) {
          console.error(`Error setting department head: ${error.message}`);
          // Don't throw here, we'll continue even if head setting fails
        }
      }

      // Fetch the complete department with relationships
      return await this.findOne(savedDepartment.id);
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
    try {
      console.log(`Updating department ${id} with data:`, updateDepartmentDto);
      
      const department = await this.findOne(id);
      console.log(`Found department ${id}: ${department.name}`);

      if (updateDepartmentDto.name) {
        const existingDepartment = await this.departmentsRepository.findOne({
          where: { name: updateDepartmentDto.name },
        });

        if (existingDepartment && existingDepartment.id !== id) {
          throw new ConflictException(`Department with name "${updateDepartmentDto.name}" already exists`);
        }
      }

      // Update basic properties first
      if (updateDepartmentDto.name) {
        department.name = updateDepartmentDto.name;
        console.log(`Updated name to '${updateDepartmentDto.name}'`);
      }
      
      if (updateDepartmentDto.description) {
        department.description = updateDepartmentDto.description;
        console.log(`Updated description`);
      }
      
      // Save basic changes
      let updatedDepartment = await this.departmentsRepository.save(department);
      console.log(`Saved basic department updates`);

      // Handle head assignment separately
      if (updateDepartmentDto.head) {
        console.log(`Handling head assignment: ${updateDepartmentDto.head}`);
        try {
          const headUser = await this.usersService.findById(updateDepartmentDto.head);
          if (!headUser) {
            throw new NotFoundException(`User with ID "${updateDepartmentDto.head}" not found`);
          }
          
          console.log(`Found head user: ${headUser.username} (${headUser.id})`);
          
          // First try direct SQL update for headId
          await this.departmentsRepository.manager.query(
            `UPDATE department SET headId = ? WHERE id = ?`,
            [updateDepartmentDto.head, id]
          );
          console.log(`Updated headId with direct SQL`);
          
          // Then update the head relationship in the department_heads table
          try {
            // Remove any existing department head relations
            await this.departmentsRepository.manager.query(
              `DELETE FROM department_heads WHERE department_id = ?`,
              [id]
            );
            
            // Add the new department head relation
            await this.departmentsRepository.manager.query(
              `INSERT INTO department_heads (department_id, head_id) VALUES (?, ?)`,
              [id, updateDepartmentDto.head]
            );
            console.log(`Updated department_heads table with direct SQL`);
          } catch (error) {
            console.error(`Error updating department_heads table: ${error.message}`);
            // Fallback to ORM approach
            updatedDepartment.headId = updateDepartmentDto.head;
            updatedDepartment.head = headUser;
            await this.departmentsRepository.save(updatedDepartment);
            console.log(`Updated head with ORM approach`);
          }
        } catch (error) {
          console.error(`Error assigning head: ${error.message}`);
          throw error;
        }
      }

      // Fetch the complete updated department with relationships
      console.log(`Fetching updated department`);
      return await this.findOne(id);
    } catch (error) {
      console.error(`Error updating department ${id}:`, error);
      throw error;
    }
  }

  async addMember(id: string, userId: string): Promise<Department> {
    try {
      console.log(`Adding member ${userId} to department ${id}`);
      
      // First get the department and user entities
      const department = await this.findOne(id);
      const user = await this.usersService.findById(userId);

      if (!user) {
        throw new NotFoundException(`User with ID "${userId}" not found`);
      }

      // Initialize members array if it doesn't exist
      if (!department.members) {
        department.members = [];
      }

      // Check if user is already a member
      if (!department.members.some(member => member.id === userId)) {
        console.log(`User ${user.username} (${userId}) not already a member, adding now`);
        
        // Use the query builder for direct database operation
        try {
          // First try with a direct query to avoid errors with the ORM
          await this.departmentsRepository.manager.query(
            `INSERT INTO department_members (department_id, user_id) VALUES (?, ?)`,
            [id, userId]
          );
          console.log(`Successfully added member ${userId} to department ${id} with direct query`);
        } catch (queryError) {
          console.error(`Error with direct query, trying ORM approach: ${queryError.message}`);
          
          // If direct query fails, try the ORM approach
          department.members.push(user);
          await this.departmentsRepository.save(department);
          console.log(`Successfully added member ${userId} to department ${id} with ORM`);
        }
      } else {
        console.log(`User ${userId} is already a member of department ${id}`);
      }

      // Return the updated department
      return await this.findOne(id);
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