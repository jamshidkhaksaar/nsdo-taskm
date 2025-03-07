import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

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
      
      // If there's a headId but no head loaded, load it manually
      if (department.headId && (!department.head || !department.head.username)) {
        console.log(`Department ${id} has headId ${department.headId} but head not loaded or incomplete, loading manually`);
        try {
          const headUser = await this.usersService.findById(department.headId);
          if (headUser) {
            department.head = headUser;
            console.log(`Manually loaded head user: ${headUser.username} (${headUser.id})`);
          }
        } catch (error) {
          console.error(`Error loading head user: ${error.message}`);
        }
      }

      // If there are members, ensure they are properly loaded
      if (department.members && department.members.length > 0) {
        console.log(`Department ${id} has ${department.members.length} members`);
      } else if (department.headId) {
        // Check if we need to manually load members
        try {
          const members = await this.departmentsRepository.manager.query(
            `SELECT u.* FROM user u JOIN department_members dm ON u.id = dm.user_id WHERE dm.department_id = ?`,
            [id]
          );
          if (members && members.length > 0) {
            department.members = members;
            console.log(`Manually loaded ${members.length} members for department ${id}`);
          }
        } catch (error) {
          console.error(`Error manually loading members: ${error.message}`);
        }
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
          try {
            await this.departmentsRepository.manager.query(
              `UPDATE department SET headId = ? WHERE id = ?`,
              [head, savedDepartment.id]
            );
            console.log(`Set headId with direct SQL`);
          } catch (sqlError) {
            console.error(`Error setting headId with direct SQL: ${sqlError.message}`);
            // Fallback to ORM approach for headId update
            savedDepartment.headId = head;
            await this.departmentsRepository.save(savedDepartment);
            console.log(`Set headId with ORM approach after SQL error`);
          }
          
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
          
          // First try direct SQL update for headId - with safer SQL that works in MySQL
          try {
            await this.departmentsRepository.manager.query(
              `UPDATE department SET headId = ? WHERE id = ?`,
              [updateDepartmentDto.head, id]
            );
            console.log(`Updated headId with direct SQL`);
          } catch (sqlError) {
            console.error(`Error updating headId with direct SQL: ${sqlError.message}`);
            // Fallback to ORM approach for headId update
            updatedDepartment.headId = updateDepartmentDto.head;
            await this.departmentsRepository.save(updatedDepartment);
            console.log(`Updated headId with ORM approach after SQL error`);
          }
          
          // Then update the head relationship in the department_heads table
          try {
            // Remove any existing department head relations
            await this.departmentsRepository.manager.query(
              `DELETE FROM department_heads WHERE department_id = ?`,
              [id]
            );
            console.log(`Deleted existing department head relations`);
            
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
        
        // Try both approaches in sequence for maximum reliability
        try {
          // First try removing any existing relation to avoid duplicates
          await this.departmentsRepository.manager.query(
            `DELETE FROM department_members WHERE department_id = ? AND user_id = ?`,
            [id, userId]
          );
          
          // Then add with direct query
          await this.departmentsRepository.manager.query(
            `INSERT INTO department_members (department_id, user_id) VALUES (?, ?)`,
            [id, userId]
          );
          console.log(`Successfully added member ${userId} to department ${id} with direct query`);
        } catch (queryError) {
          console.error(`Error with direct query, trying ORM approach: ${queryError.message}`);
          
          // If direct query fails, try the ORM approach
          // First, make sure user isn't already in the array
          const existingIndex = department.members.findIndex(m => m.id === userId);
          if (existingIndex === -1) {
            department.members.push(user);
          }
          await this.departmentsRepository.save(department);
          console.log(`Successfully added member ${userId} to department ${id} with ORM`);
        }
      } else {
        console.log(`User ${userId} is already a member of department ${id}`);
      }

      // Return the updated department
      const updatedDepartment = await this.findOne(id);
      console.log(`Department now has ${updatedDepartment.members?.length || 0} members`);
      return updatedDepartment;
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

  // Helper method to get a user by ID (used by the controller)
  async getUserById(id: string): Promise<User | null> {
    try {
      return await this.usersService.findById(id);
    } catch (error) {
      console.error(`Error getting user by ID ${id}: ${error.message}`);
      return null;
    }
  }
} 