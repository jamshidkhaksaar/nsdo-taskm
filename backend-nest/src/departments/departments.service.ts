import { Injectable, NotFoundException, ConflictException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { ProvinceService } from '../provinces/province.service';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentsRepository: Repository<Department>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private provinceService: ProvinceService,
  ) {}

  async findAll(): Promise<Department[]> {
    try {
      return await this.departmentsRepository.find({
        relations: {
          members: true,
          head: true,
          assignedTasks: true
        }
      });
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Department> {
    try {
      // Use a more explicit query to ensure all relations are loaded correctly
      const department = await this.departmentsRepository
        .createQueryBuilder('department')
        .leftJoinAndSelect('department.members', 'members')
        .leftJoinAndSelect('department.head', 'head')
        .leftJoinAndSelect('department.assignedTasks', 'assignedTasks')
        .where('department.id = :id', { id })
        .getOne();

      if (!department) {
        throw new NotFoundException(`Department with ID "${id}" not found`);
      }
      
      // If there's a headId but no head loaded, load it explicitly
      if (department.headId && (!department.head || !department.head.username)) {
        try {
          console.log(`Loading head for department ${id} with headId ${department.headId}`);
          const headUser = await this.usersService.findById(department.headId);
          if (headUser) {
            department.head = headUser;
            console.log(`Successfully loaded head user: ${headUser.username}`);
          }
        } catch (error) {
          console.error(`Error loading head user: ${error.message}`);
          // Don't throw here, just log the error and continue
        }
      }

      // Ensure members array exists
      if (!department.members) {
        department.members = [];
      }

      // If members array is empty, try to load them directly
      if (department.members.length === 0) {
        try {
          // Use TypeORM's query builder for loading members instead of raw SQL
          const memberResults = await this.usersService.findUsersByDepartment(id);
          
          if (memberResults && memberResults.length > 0) {
            console.log(`Loaded ${memberResults.length} members for department ${id}`);
            department.members = memberResults;
          }
        } catch (error) {
          console.error(`Error loading members: ${error.message}`);
          department.members = [];
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
      console.log('Creating department with DTO:', JSON.stringify(createDepartmentDto, null, 2));
      
      // Create new department entity
      const department = new Department();
      department.name = createDepartmentDto.name;
      
      if (createDepartmentDto.description) {
        department.description = createDepartmentDto.description;
      }
      
      // START: Handle provinceId during creation
      if (createDepartmentDto.provinceId) {
        try {
          // Validate province exists
          await this.provinceService.findOne(createDepartmentDto.provinceId);
          department.provinceId = createDepartmentDto.provinceId;
          console.log(`Assigning department to province: ${department.provinceId}`);
        } catch (error) {
          // Handle case where province validation fails (e.g., province not found)
          console.error(`Error validating province ${createDepartmentDto.provinceId} during department creation: ${error.message}`);
          // Depending on requirements, you might throw a BadRequestException here
          // throw new BadRequestException(`Province with ID "${createDepartmentDto.provinceId}" not found.`);
          // For now, let's just log the error and proceed without assigning the province
          department.provinceId = null;
        }
      } else {
          department.provinceId = null; // Ensure it's null if not provided
      }
      // END: Handle provinceId during creation

      // Save department to get an ID
      const savedDepartment = await this.departmentsRepository.save(department);
      console.log(`Created department with ID: ${savedDepartment.id}`);
      
      // If head is provided, set the department head
      if (createDepartmentDto.head) {
        try {
          console.log(`Setting head for department ${savedDepartment.id} to user with ID: ${createDepartmentDto.head}`);
          const headUser = await this.usersService.findById(createDepartmentDto.head);
          
          if (headUser) {
            savedDepartment.headId = headUser.id;
            savedDepartment.head = headUser;
            
            // Save the department with the head
            await this.departmentsRepository.save(savedDepartment);
            console.log(`Set head for department ${savedDepartment.id} to user: ${headUser.username}`);
            
            // Add head as a member of the department if not already
            const isDepartmentMember = await this.isDepartmentMember(savedDepartment.id, headUser.id);
            if (!isDepartmentMember) {
              console.log(`Adding head ${headUser.username} as member of department ${savedDepartment.id}`);
              await this.addMember(savedDepartment.id, headUser.id);
            }
          } else {
            console.warn(`Head user with ID ${createDepartmentDto.head} not found, cannot set as department head`);
          }
        } catch (error) {
          console.error(`Error setting department head: ${error.message}`);
        }
      }
      
      // Reload department with all relations
      return this.findOne(savedDepartment.id);
    } catch (error) {
      console.error('Error creating department:', error);
      
      if (error.code === '23505') {
        throw new ConflictException(`Department with name '${createDepartmentDto.name}' already exists`);
      }
      
      throw error;
    }
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
    try {
      console.log(`Updating department ${id} with DTO:`, JSON.stringify(updateDepartmentDto, null, 2));
      
      // Use QueryDeepPartialEntity for the update payload
      const updatePayload: QueryDeepPartialEntity<Department> = {};
      
      if (updateDepartmentDto.name !== undefined) {
          updatePayload.name = updateDepartmentDto.name;
      }
      
      if (updateDepartmentDto.description !== undefined) {
          updatePayload.description = updateDepartmentDto.description;
      }
      
      if (updateDepartmentDto.provinceId !== undefined) {
          // Handle null case for unassigning province
          if (updateDepartmentDto.provinceId === null || updateDepartmentDto.provinceId === '') {
               updatePayload.provinceId = null; // Should now be type-correct
          } else {
              // Validate province exists
              await this.provinceService.findOne(updateDepartmentDto.provinceId); // Throws if not found
              
              updatePayload.provinceId = updateDepartmentDto.provinceId;
          }
      }
      
      // Get the existing department
      const department = await this.findOne(id);
      
      // Update simple properties
      if (updateDepartmentDto.name !== undefined) {
        department.name = updateDepartmentDto.name;
      }
      
      if (updateDepartmentDto.description !== undefined) {
        department.description = updateDepartmentDto.description;
      }
      
      // Save the updated basic properties
      await this.departmentsRepository.save(department);
      
      // If head is included in the update, handle it separately
      if (updateDepartmentDto.head !== undefined) {
        const newHeadId = updateDepartmentDto.head;
        
        // If head is null or empty string, remove the head
        if (!newHeadId) {
          console.log(`Removing head from department ${id}`);
          department.headId = null as unknown as string;
          department.head = null as unknown as User;
          await this.departmentsRepository.save(department);
        } else {
          // Otherwise, set the new head
          try {
            console.log(`Setting head for department ${id} to user with ID: ${newHeadId}`);
            const headUser = await this.usersService.findById(newHeadId);
            
            if (headUser) {
              department.headId = headUser.id;
              department.head = headUser;
              
              // Save the department with the head
              await this.departmentsRepository.save(department);
              console.log(`Set head for department ${id} to user: ${headUser.username}`);
              
              // Add head as a member of the department if not already
              const isDepartmentMember = await this.isDepartmentMember(id, headUser.id);
              if (!isDepartmentMember) {
                console.log(`Adding head ${headUser.username} as member of department ${id}`);
                await this.addMember(id, headUser.id);
              }
            } else {
              console.warn(`Head user with ID ${newHeadId} not found, cannot set as department head`);
            }
          } catch (error) {
            console.error(`Error setting department head: ${error.message}`);
          }
        }
      }
      
      // Reload department with all relations
      return this.findOne(id);
    } catch (error) {
      console.error(`Error updating department ${id}:`, error);
      
      if (error.code === '23505') {
        throw new ConflictException(`Department with name '${updateDepartmentDto.name}' already exists`);
      }
      
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
        totalTasks: department.assignedTasks?.length || 0,
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

  // Helper method to get member count directly from junction table
  async getMemberCount(departmentId: string): Promise<number> {
    try {
      const department = await this.findOne(departmentId);
      if (department.members) {
        return department.members.length;
      }
      return 0;
    } catch (error) {
      console.error(`Error getting member count for department ${departmentId}: ${error.message}`);
      return 0;
    }
  }

  // Helper method to check if a user is already a member of a department
  private async isDepartmentMember(departmentId: string, userId: string): Promise<boolean> {
    try {
      const count = await this.departmentsRepository.manager.query(
        `SELECT COUNT(*) as count FROM department_members WHERE department_id = ? AND user_id = ?`,
        [departmentId, userId]
      );
      
      return parseInt(count[0]?.count || '0', 10) > 0;
    } catch (error) {
      console.error(`Error checking if user ${userId} is member of department ${departmentId}: ${error.message}`);
      return false;
    }
  }

  // START: Add missing methods for Province-Department assignment
  async assignDepartmentsToProvince(provinceId: string, departmentIds: string[]) {
    try {
      console.log(`Assigning departments [${departmentIds.join(', ')}] to province ${provinceId}`);
      // Validate province exists
      await this.provinceService.findOne(provinceId);

      // Validate all departments exist
      const departments = await this.departmentsRepository.findBy({ id: In(departmentIds) });
      if (departments.length !== departmentIds.length) {
        const foundIds = departments.map(d => d.id);
        const notFoundIds = departmentIds.filter(id => !foundIds.includes(id));
        throw new NotFoundException(`Departments with IDs [${notFoundIds.join(', ')}] not found.`);
      }

      // Update provinceId for each department
      await this.departmentsRepository.update(
        { id: In(departmentIds) },
        { provinceId: provinceId }
      );
      console.log(`Successfully updated provinceId for departments.`);

      // Return the updated province entity with its departments
      return this.provinceService.findOne(provinceId);
    } catch (error) {
      console.error(`Error assigning departments to province ${provinceId}:`, error);
      throw error;
    }
  }

  async removeDepartmentFromProvince(provinceId: string, departmentId: string): Promise<void> {
    try {
      console.log(`Removing department ${departmentId} from province ${provinceId}`);
      // Validate province and department exist
      await this.provinceService.findOne(provinceId); // Ensure province exists
      const department = await this.findOne(departmentId); // Ensure department exists

      // Check if the department is actually assigned to this province
      if (department.provinceId !== provinceId) {
        // Optionally throw an error or just log and return
        console.warn(`Department ${departmentId} is not assigned to province ${provinceId}. Current province: ${department.provinceId}`);
        // throw new BadRequestException(`Department ${departmentId} is not assigned to province ${provinceId}.`);
        return; // Or handle as appropriate
      }

      // Set provinceId to null for the department
      await this.departmentsRepository.update(departmentId, { provinceId: null });
      console.log(`Successfully removed department ${departmentId} from province ${provinceId}`);
    } catch (error) {
      console.error(`Error removing department ${departmentId} from province ${provinceId}:`, error);
      throw error;
    }
  }
  // END: Add missing methods for Province-Department assignment
} 