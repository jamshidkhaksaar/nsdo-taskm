import { Injectable, NotFoundException, ConflictException, Inject, forwardRef, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOneOptions, DeepPartial } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { ProvinceService } from '../provinces/province.service';
import { TasksService } from '../tasks/tasks.service';
import { TaskStatus } from '../tasks/entities/task.entity';
import { ActivityLogService } from '../admin/services/activity-log.service';
import { Province } from '../provinces/entities/province.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentsRepository: Repository<Department>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private provinceService: ProvinceService,
    @Inject(forwardRef(() => TasksService))
    private tasksService: TasksService,
    private activityLogService: ActivityLogService,
  ) {}

  async findAll(provinceId?: string): Promise<Department[]> {
    try {
      const options: FindOneOptions<Department> = {
        relations: ['members', 'head', 'province', 'assignedTasks'],
      };
      let whereClause = {};

      if (provinceId) {
        console.log(`[DepartmentsService] Filtering departments by provinceId: ${provinceId}`);
        whereClause = { ...whereClause, provinceId: provinceId };
      }

      return await this.departmentsRepository.find({
        where: whereClause,
        relations: options.relations,
        order: { name: 'ASC' }
      });
    } catch (error) {
      console.error('Error finding departments:', error);
      // Throw a more specific NestJS exception
      throw new InternalServerErrorException(`Could not retrieve departments: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Department> {
    try {
      // Use a more explicit query to ensure all relations are loaded correctly
      const department = await this.departmentsRepository
        .createQueryBuilder('department')
        .leftJoinAndSelect('department.members', 'members')
        .leftJoinAndSelect('department.head', 'head')
        .leftJoinAndSelect('department.province', 'province')
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
      
      // Fetch the existing department first
      const department = await this.findOne(id);
      
      // Flag to track if head needs to be added as member later
      let shouldAddHeadAsMember = false;
      let newHeadUser: User | null = null;

      // Apply updates to the department entity
      if (updateDepartmentDto.name !== undefined) {
        department.name = updateDepartmentDto.name;
      }
      
      if (updateDepartmentDto.description !== undefined) {
        department.description = updateDepartmentDto.description;
      }
      
      if (updateDepartmentDto.provinceId !== undefined) {
          if (updateDepartmentDto.provinceId === null || updateDepartmentDto.provinceId === '') {
               department.provinceId = null;
          } else {
              await this.provinceService.findOne(updateDepartmentDto.provinceId); // Validate province
              department.provinceId = updateDepartmentDto.provinceId;
          }
      }
      
      // Handle headId update (Prepare the relationship)
      if (updateDepartmentDto.headId !== undefined) {
        const newHeadId = updateDepartmentDto.headId;
        
        if (!newHeadId) {
          console.log(`Preparing to remove head from department ${id}`);
          department.head = null;
          newHeadUser = null;
        } else {
          try {
            console.log(`Attempting to set head for department ${id} to user ID: ${newHeadId}`);
            const headUser = await this.usersService.findById(newHeadId);
            if (headUser) {
              department.head = headUser; // Set the related entity
              newHeadUser = headUser; // Store for potentially adding as member later
              console.log(`Prepared head for department ${id} to user: ${headUser.username}`);
              shouldAddHeadAsMember = true; // Flag to add member later
            } else {
              console.warn(`Head user with ID ${newHeadId} not found.`);
              throw new NotFoundException(`User with ID "${newHeadId}" not found to be set as head.`);
            }
          } catch (error) {
            console.error(`Error preparing department head update: ${error.message}`);
            throw error;
          }
        }
      }

      // *** Single save call for all updates ***
      console.log('Saving all department updates...', JSON.stringify(department, null, 2)); // Log the state before save
      try {
          await this.departmentsRepository.save(department);
          console.log('Department updates saved successfully.');
      } catch (saveError) {
          console.error('******** ERROR DURING SAVE ********', saveError); // Log the specific save error
          throw saveError; // Re-throw to be caught by outer catch
      }

      // *** Add head as member AFTER successful save ***
      if (shouldAddHeadAsMember && newHeadUser) {
         console.log(`Checking if head ${newHeadUser.username} (${newHeadUser.id}) is already a member...`);
         const isMember = await this.isDepartmentMember(id, newHeadUser.id);
         console.log(`Is head already a member? ${isMember}`);
         if (!isMember) {
             console.log(`Attempting to add head ${newHeadUser.username} as member post-save.`);
             try {
               await this.addMember(id, newHeadUser.id); 
               console.log(`Successfully added head ${newHeadUser.username} as member.`);
             } catch(addMemberError) {
                // Log error but don't fail the whole update if only adding member fails
                console.error(`Failed to add head ${newHeadUser.username} as member after update: ${addMemberError.message}`, addMemberError);
             }
         }
      }

      // Reload department with potentially updated relations
      console.log(`Update successful for department ${id}, reloading...`);
      return this.findOne(id);
    } catch (error) {
      console.error(`******** TOP LEVEL ERROR in update department ${id}: ********`, error); // Log the full error object here
      
      if (error.code === '23505') {
        throw new ConflictException(`Department with name '${updateDepartmentDto.name}' already exists`);
      }
      
      // Ensure a generic error is thrown if specific checks fail
      throw new InternalServerErrorException(error.message || 'Internal server error during department update');
    }
  }

  async addMember(id: string, userId: string): Promise<Department> {
    try {
      console.log(`[addMember-SQL] Adding member ${userId} to department ${id}`);
      
      // Fetching entities is still needed for validation and context
      const department = await this.departmentsRepository.findOneBy({ id });
      if (!department) {
        throw new NotFoundException(`[addMember-SQL] Department with ID "${id}" not found`);
      }

      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new NotFoundException(`[addMember-SQL] User with ID "${userId}" not found`);
      }

      // Check if the relationship already exists using a direct query
      const existingRelation = await this.departmentsRepository.manager.query(
        `SELECT COUNT(*) as count FROM user_departments WHERE department_id = ? AND user_id = ?`,
        [id, userId]
      );
      const isAlreadyMember = parseInt(existingRelation[0]?.count || '0', 10) > 0;
      console.log(`[addMember-SQL] Is user ${userId} already in user_departments for ${id}? ${isAlreadyMember}`);

      if (!isAlreadyMember) {
        console.log(`[addMember-SQL] Relationship does not exist, attempting direct INSERT...`);
        try {
          // Use raw SQL to insert directly into the join table
          await this.departmentsRepository.manager.query(
            `INSERT INTO user_departments (department_id, user_id) VALUES (?, ?)`,
            [id, userId]
          );
          console.log(`[addMember-SQL] Successfully INSERTED relation for dept ${id} and user ${userId}.`);
        } catch (insertError) {
            console.error(`[addMember-SQL] ********* ERROR DURING DIRECT SQL INSERT *********`, insertError);
            // If the raw SQL fails, re-throw the specific error
            throw new InternalServerErrorException(`Database error adding member relation: ${insertError.message}`);
        }
      } else {
        console.log(`[addMember-SQL] User ${userId} relation already exists. No INSERT needed.`);
      }

      // Return the department (refetch to get potentially updated state if needed elsewhere)
      console.log(`[addMember-SQL] Operation complete, refetching department ${id}...`);
      return this.findOne(id); 

    } catch (error) {
      // Catch errors from findOne, findById, or the re-thrown insertError
      console.error(`[addMember-SQL] Error in addMember for dept ${id}, user ${userId}:`, error);
      // Ensure a standard error format is thrown
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message || 'Failed to add member to department');
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
    const result = await this.departmentsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Department with ID "${id}" not found`);
    }
  }

  /**
   * Calculates the task summary for a specific department.
   * @param departmentId The ID of the department.
   * @returns An object containing counts of tasks by status.
   */
  async getTaskSummary(departmentId: string): Promise<{ [key in TaskStatus]?: number } & { total: number }> {
    try {
        console.log(`[DepartmentsService] Getting task summary for department ${departmentId}`);
        // Ensure department exists (optional, findOne throws NotFoundException if needed)
        // await this.findOne(departmentId);

        const tasks = await this.tasksService.getTasksForDepartment(departmentId);
        console.log(`[DepartmentsService] Found ${tasks.length} tasks for department ${departmentId}`);

        const summary: { [key in TaskStatus]?: number } & { total: number } = {
            total: tasks.length,
            [TaskStatus.PENDING]: 0,
            [TaskStatus.IN_PROGRESS]: 0,
            [TaskStatus.COMPLETED]: 0,
            [TaskStatus.CANCELLED]: 0,
            [TaskStatus.DELEGATED]: 0, // Include delegated count if needed
        };

        for (const task of tasks) {
            if (summary[task.status] !== undefined) {
                summary[task.status]!++;
            }
        }
        
        console.log(`[DepartmentsService] Task summary for ${departmentId}:`, summary);
        return summary;

    } catch (error) {
        console.error(`[DepartmentsService] Error calculating task summary for department ${departmentId}:`, error);
        // Rethrow specific errors or a generic one
        if (error instanceof NotFoundException) {
            throw error;
        }
        throw new InternalServerErrorException(`Failed to get task summary for department ${departmentId}`);
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
        console.warn(`Department ${departmentId} is not assigned to province ${provinceId}. Current province: ${department.provinceId}`);
        return; // Department not assigned to this province, nothing to do
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

  async getDepartmentMembers(departmentId: string): Promise<User[]> {
    // Ensure the department exists first
    await this.findOne(departmentId); 
    
    try {
      // Reuse the existing logic from usersService to find members
      const members = await this.usersService.findUsersByDepartment(departmentId);
      return members || []; // Return members or an empty array if null/undefined
    } catch (error) {
      console.error(`Error fetching members for department ${departmentId}:`, error);
      // Depending on requirements, you might want to throw a specific error here
      // For now, return an empty array or re-throw the original error
      throw new InternalServerErrorException(`Failed to fetch members for department ${departmentId}`);
    }
  }
}