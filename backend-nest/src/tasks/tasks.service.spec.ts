import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task, TaskStatus, TaskPriority, TaskType } from './entities/task.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Department } from '../departments/entities/department.entity';
import { Province } from '../provinces/entities/province.entity';
import { UsersService } from '../users/users.service';
import { DepartmentsService } from '../departments/departments.service';
import { ProvinceService } from '../provinces/province.service';
import { ActivityLogService } from '../admin/services/activity-log.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskPriorityDto } from './dto/update-task-priority.dto';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ActivityLog } from '../admin/entities/activity-log.entity';

// Correct Mock Repository Type using keyof Repository
type MockRepository<T extends abstract new (...args: any) => any> = Partial<Record<keyof Repository<InstanceType<T>>, jest.Mock>>;
const createMockRepository = <T extends abstract new (...args: any) => any>(): MockRepository<T> => ({
  // Add mocks for methods used in the service
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findBy: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({ // Keep basic mock
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  }),
});

// Correct Mock Service Type
type MockService<T> = { [K in keyof T]?: jest.Mock };


describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: MockRepository<typeof Task>;
  let userRepository: MockRepository<typeof User>;
  let departmentRepository: MockRepository<typeof Department>;
  let provinceRepository: MockRepository<typeof Province>;
  let activityLogRepository: MockRepository<typeof ActivityLog>; // Add mock repo for ActivityLog
  let usersServiceMock: MockService<UsersService>;
  let departmentsServiceMock: MockService<DepartmentsService>;
  let provinceServiceMock: MockService<ProvinceService>;
  let activityLogServiceMock: MockService<ActivityLogService>;

  const mockUser: User = {
    id: 'user-uuid-1',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: UserRole.USER,
    isActive: true,
    twoFactorEnabled: false,
    twoFactorSecret: '' as (string | null),
    twoFactorMethod: 'app',
    rememberedBrowsers: [],
    bio: '' as (string | null),
    avatarUrl: '' as (string | null),
    skills: [],
    socialLinks: {},
    preferences: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    createdTasks: [],
    assignedTasks: [],
    departments: [], 
    notes: [],
  };
  
  const mockReqUser = { userId: mockUser.id, username: mockUser.username, role: mockUser.role };

  beforeEach(async () => {
    // Define mocks for services
    usersServiceMock = {
      findById: jest.fn().mockResolvedValue(mockUser),
    };
    departmentsServiceMock = {
      findOne: jest.fn(),
    };
    provinceServiceMock = {
      findOne: jest.fn(),
    };
    activityLogServiceMock = {
      createLog: jest.fn().mockResolvedValue({}),
      logFromRequest: jest.fn().mockResolvedValue({}),
    };
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: createMockRepository<typeof Task>() },
        { provide: getRepositoryToken(User), useValue: createMockRepository<typeof User>() },
        { provide: getRepositoryToken(Department), useValue: createMockRepository<typeof Department>() },
        { provide: getRepositoryToken(Province), useValue: createMockRepository<typeof Province>() },
        { provide: getRepositoryToken(ActivityLog), useValue: createMockRepository<typeof ActivityLog>() },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: DepartmentsService, useValue: departmentsServiceMock },
        { provide: ProvinceService, useValue: provinceServiceMock },
        { provide: ActivityLogService, useValue: activityLogServiceMock },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get(getRepositoryToken(Task));
    userRepository = module.get(getRepositoryToken(User));
    departmentRepository = module.get(getRepositoryToken(Department));
    provinceRepository = module.get(getRepositoryToken(Province));
    activityLogRepository = module.get(getRepositoryToken(ActivityLog));
    usersServiceMock = module.get(UsersService);
    departmentsServiceMock = module.get(DepartmentsService);
    provinceServiceMock = module.get(ProvinceService);
    activityLogServiceMock = module.get(ActivityLogService);

    // Mock findOne for the final return step in create
    taskRepository.findOne = jest.fn().mockImplementation(async (options) => {
        // Basic mock: return the saved task data
        const saveCalls = (taskRepository.save as jest.Mock).mock.calls;
        if (saveCalls.length === 0) return Promise.resolve(null); // No save called yet
        const savedTask = saveCalls[saveCalls.length - 1][0];
        if (options?.where?.id === savedTask.id || !savedTask.id) { // Handle case where ID is generated by save
            return Promise.resolve({...savedTask, id: savedTask.id || 'new-task-uuid' });
        }
        return Promise.resolve(null);
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    let createTaskDto: CreateTaskDto;

    beforeEach(() => {
      createTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        priority: TaskPriority.MEDIUM,
        dueDate: new Date().toISOString(),
      };
      jest.clearAllMocks();
      taskRepository.save = jest.fn().mockImplementation(task => Promise.resolve({ ...task, id: 'new-task-uuid' }));
      userRepository.findOneBy = jest.fn().mockResolvedValue(mockUser);
      taskRepository.findOne = jest.fn().mockImplementation(async (options) => {
          const saveCalls = (taskRepository.save as jest.Mock).mock.calls;
          if (saveCalls.length === 0) return Promise.resolve(null); 
          const savedTask = saveCalls[saveCalls.length - 1][0]; 
           return Promise.resolve({ ...savedTask, id: savedTask.id || 'new-task-uuid' });
      });
    });

    it('should create a PERSONAL task if no assignees are provided', async () => {
      const result = await service.create(createTaskDto, mockReqUser);
      expect(taskRepository.save).toHaveBeenCalledTimes(1);
      const savedTaskData = (taskRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedTaskData.type).toEqual(TaskType.PERSONAL);
      expect(savedTaskData.assignedToUsers).toHaveLength(1);
      expect(savedTaskData.assignedToUsers[0].id).toEqual(mockUser.id);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: mockUser.id });
      expect(result.type).toEqual(TaskType.PERSONAL);
    });

    it('should create a USER task when assignedToUserIds are provided', async () => {
      const user2: User = { ...mockUser, id: 'user-uuid-2', username: 'user2' };
      createTaskDto.assignedToUserIds = [user2.id];
      userRepository.findBy = jest.fn().mockResolvedValue([user2]);
      const result = await service.create(createTaskDto, mockReqUser);
      expect(taskRepository.save).toHaveBeenCalledTimes(1);
      const savedTaskData = (taskRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedTaskData.type).toEqual(TaskType.USER);
      expect(savedTaskData.assignedToUsers).toHaveLength(1);
      expect(savedTaskData.assignedToUsers[0].id).toEqual(user2.id);
      expect(userRepository.findBy).toHaveBeenCalledWith({ id: In(createTaskDto.assignedToUserIds) });
      expect(result.type).toEqual(TaskType.USER);
    });

     it('should throw BadRequestException if assigned user is not found', async () => {
       createTaskDto.assignedToUserIds = ['non-existent-user-id'];
       userRepository.findBy = jest.fn().mockResolvedValue([]);
       await expect(service.create(createTaskDto, mockReqUser)).rejects.toThrow(BadRequestException);
       expect(taskRepository.save).not.toHaveBeenCalled();
     });

    it('should create a DEPARTMENT task when assignedToDepartmentIds are provided', async () => {
      const dept1 = {
          id: 'dept-uuid-1', name: 'Dept 1', description: '',
          members: [], headId: null, assignedTasks: [],
          provinceId: null // Allow null
      } as unknown as Department;
      createTaskDto.assignedToDepartmentIds = [dept1.id];
      departmentRepository.findBy = jest.fn().mockResolvedValue([dept1]);
      const result = await service.create(createTaskDto, mockReqUser);
      expect(taskRepository.save).toHaveBeenCalledTimes(1);
      const savedTaskData = (taskRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedTaskData.type).toEqual(TaskType.DEPARTMENT);
      expect(savedTaskData.assignedToDepartments).toHaveLength(1);
      expect(savedTaskData.assignedToDepartments[0].id).toEqual(dept1.id);
      expect(departmentRepository.findBy).toHaveBeenCalledWith({ id: In(createTaskDto.assignedToDepartmentIds) });
      expect(result.type).toEqual(TaskType.DEPARTMENT);
    });
    
     it('should throw BadRequestException if assigned department is not found', async () => {
       createTaskDto.assignedToDepartmentIds = ['non-existent-dept-id'];
       departmentRepository.findBy = jest.fn().mockResolvedValue([]);
       await expect(service.create(createTaskDto, mockReqUser)).rejects.toThrow(BadRequestException);
       expect(taskRepository.save).not.toHaveBeenCalled();
     });

    it('should create a PROVINCE_DEPARTMENT task when province and departments are provided', async () => {
      const prov1 = { id: 'prov-uuid-1', name: 'Prov 1' } as unknown as Province;
      const dept1 = {
          id: 'dept-uuid-1', name: 'Dept 1', description: '',
          members: [], headId: null, assignedTasks: [],
          provinceId: prov1.id // Use string ID
      } as unknown as Department;
      createTaskDto.assignedToProvinceId = prov1.id;
      createTaskDto.assignedToDepartmentIds = [dept1.id];
      provinceRepository.findOneBy = jest.fn().mockResolvedValue(prov1);
      departmentRepository.find = jest.fn().mockResolvedValue([{ id: dept1.id, provinceId: prov1.id }]);
      departmentRepository.findBy = jest.fn().mockResolvedValue([dept1]);
      const result = await service.create(createTaskDto, mockReqUser);
      expect(taskRepository.save).toHaveBeenCalledTimes(1);
      const savedTaskData = (taskRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedTaskData.type).toEqual(TaskType.PROVINCE_DEPARTMENT);
      expect(savedTaskData.assignedToProvinceId).toEqual(prov1.id);
      expect(savedTaskData.assignedToDepartments).toHaveLength(1);
      expect(departmentRepository.find).toHaveBeenCalledWith({ where: { id: In([dept1.id]) }, select: ['id', 'provinceId'] });
      expect(departmentRepository.findBy).toHaveBeenCalledWith({ id: In([dept1.id]) });
      expect(result.type).toEqual(TaskType.PROVINCE_DEPARTMENT);
    });
    
     it('should throw BadRequestException if province is not found for PROVINCE_DEPARTMENT task', async () => {
       const dept1: Department = { 
           id: 'dept-uuid-1', name: 'Dept 1', description: '', 
           members: [], head: null, headId: null, assignedTasks: [], 
           province: null, provinceId: 'prov-uuid-1' // provinceId exists but province won't be found
       };
       createTaskDto.assignedToProvinceId = 'non-existent-prov-id';
       createTaskDto.assignedToDepartmentIds = [dept1.id];
       provinceRepository.findOneBy = jest.fn().mockResolvedValue(null);
       await expect(service.create(createTaskDto, mockReqUser)).rejects.toThrow(BadRequestException);
       expect(taskRepository.save).not.toHaveBeenCalled();
     });

     it('should throw BadRequestException if a department does not belong to the province', async () => {
       const prov1: Province = { id: 'prov-uuid-1', name: 'Prov 1', description: '', departments: [], assignedTasks: [] };
       const deptWrongProv: Department = { 
           id: 'dept-uuid-wrong', name: 'Dept Wrong', description: '', 
           members: [], head: null, headId: null, assignedTasks: [], 
           province: null, provinceId: 'other-prov-id' // Non-matching provinceId
       };
       createTaskDto.assignedToProvinceId = prov1.id;
       createTaskDto.assignedToDepartmentIds = [deptWrongProv.id];
       provinceRepository.findOneBy = jest.fn().mockResolvedValue(prov1);
       departmentRepository.find = jest.fn().mockResolvedValue([{ id: deptWrongProv.id, provinceId: 'other-prov-id' }]);
       await expect(service.create(createTaskDto, mockReqUser)).rejects.toThrow(BadRequestException);
        expect(taskRepository.save).not.toHaveBeenCalled();
     });

    // Error case tests
    it('should throw BadRequestException if assigning to both users and departments', async () => {
      createTaskDto.assignedToUserIds = ['user-uuid-2'];
      createTaskDto.assignedToDepartmentIds = ['dept-uuid-1'];
      await expect(service.create(createTaskDto, mockReqUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if assigning to users and province', async () => {
      createTaskDto.assignedToUserIds = ['user-uuid-2'];
      createTaskDto.assignedToProvinceId = 'prov-uuid-1';
      await expect(service.create(createTaskDto, mockReqUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if assigning to province without departments', async () => {
      createTaskDto.assignedToProvinceId = 'prov-uuid-1';
      createTaskDto.assignedToDepartmentIds = [];
      await expect(service.create(createTaskDto, mockReqUser)).rejects.toThrow(BadRequestException);
    });
    
    it('should throw NotFoundException if creator user is not found during PERSONAL task creation', async () => {
      userRepository.findOneBy = jest.fn().mockResolvedValue(null);
      await expect(service.create(createTaskDto, mockReqUser)).rejects.toThrow(NotFoundException);
       expect(taskRepository.save).not.toHaveBeenCalled();
    });

  });

  describe('findOne', () => {
     beforeEach(() => {
         jest.clearAllMocks();
     });
     
    it('should return a task if found', async () => {
      const taskId = 'task-uuid-1';
      const mockTask = { 
          id: taskId, title: 'Found Task', description: '', 
          status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, type: TaskType.PERSONAL, 
          is_private: false, dueDate: null, createdAt: new Date(), updatedAt: new Date(), 
          createdById: 'user-uuid-1', 
          createdBy: null as (User | null),
          assignedToUsers: [], 
          assignedToDepartments: [], 
          assignedToProvinceId: null as (string | null),
          assignedToProvince: null as (Province | null), 
          isDelegated: false, 
          delegatedByUserId: null as (string | null),
          delegatedBy: null as (User | null),
          delegatedFromTaskId: null as (string | null),
          delegatedFromTask: null as (Task | null)
      };
      taskRepository.findOne = jest.fn().mockResolvedValue(mockTask);

      const result = await service.findOne(taskId);
      expect(result).toEqual(mockTask);
      expect(taskRepository.findOne).toHaveBeenCalledWith({ 
          where: { id: taskId },
          relations: expect.arrayContaining([
            'createdBy', 'assignedToUsers', 'assignedToDepartments', 'assignedToProvince', 'delegatedBy', 'delegatedFromTask'
          ])
      });
    });

    it('should throw NotFoundException if task is not found', async () => {
      const taskId = 'non-existent-task-id';
      taskRepository.findOne = jest.fn().mockResolvedValue(null);
      await expect(service.findOne(taskId)).rejects.toThrow(NotFoundException);
    });
  });
  
   // TODO: Add tests for update, updateStatus, updatePriority, remove, cancelTask, delegateTask, etc.
   // Remember to test permission logic within those methods.

  // --- Tests for update method ---
  describe('update', () => {
    let updateTaskDto: UpdateTaskDto;
    let mockTask: Task;
    const taskId = 'task-update-uuid';
    const creator = { userId: 'creator-uuid', username: 'creator', role: UserRole.USER };
    const nonCreator = { userId: 'non-creator-uuid', username: 'noncreator', role: UserRole.USER };

    beforeEach(() => {
      jest.clearAllMocks();
      updateTaskDto = { title: 'Updated Title' };
      mockTask = { 
        id: taskId, title: 'Original Title', description: '', 
        status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, type: TaskType.PERSONAL, 
        is_private: false, dueDate: null, createdAt: new Date(), updatedAt: new Date(), 
        createdById: creator.userId, 
        createdBy: null as (User | null), 
        assignedToUsers: [], assignedToDepartments: [], 
        assignedToProvinceId: null as (string | null),
        assignedToProvince: null as (Province | null), 
        isDelegated: false, 
        delegatedByUserId: null as (string | null),
        delegatedBy: null as (User | null),
        delegatedFromTaskId: null as (string | null),
        delegatedFromTask: null as (Task | null)
      } as Task;
      
      taskRepository.findOne = jest.fn().mockResolvedValue(mockTask);
      taskRepository.save = jest.fn().mockImplementation(task => Promise.resolve({ ...task }));
      userRepository.findOneBy = jest.fn().mockResolvedValue(creator as User);
      activityLogServiceMock.createLog = jest.fn(); 
    });

    it('should allow the creator to update the task', async () => {
      await service.update(taskId, updateTaskDto, creator);
      expect(taskRepository.findOne).toHaveBeenCalledWith({ where: { id: taskId }, relations: expect.any(Array) });
      expect(taskRepository.save).toHaveBeenCalledTimes(1);
      const savedData = (taskRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedData.title).toEqual(updateTaskDto.title);
      expect(activityLogServiceMock.createLog).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if a non-creator tries to update', async () => {
      await expect(service.update(taskId, updateTaskDto, nonCreator)).rejects.toThrow(ForbiddenException);
      expect(taskRepository.save).not.toHaveBeenCalled();
      expect(activityLogServiceMock.createLog).not.toHaveBeenCalled();
    });
    
    it('should ignore status, priority, and type fields in the DTO', async () => {
       const dtoWithForbiddenFields = { 
           title: 'Updated Title Again', 
           status: TaskStatus.COMPLETED, 
           priority: TaskPriority.HIGH,   
           type: TaskType.USER          
       } as UpdateTaskDto;
       
       await service.update(taskId, dtoWithForbiddenFields, creator);
       expect(taskRepository.save).toHaveBeenCalledTimes(1);
       const savedData = (taskRepository.save as jest.Mock).mock.calls[0][0];
       expect(savedData.title).toEqual(dtoWithForbiddenFields.title);
       // Assert that restricted fields were NOT updated
       expect(savedData.status).toEqual(mockTask.status); // Should still be PENDING
       expect(savedData.priority).toEqual(mockTask.priority); // Should still be MEDIUM
       expect(savedData.type).toEqual(mockTask.type); // Should still be PERSONAL
    });
    
    // TODO: Add more tests for updating assignments by creator
  });
  
  // --- Tests for updateStatus method ---
  describe('updateStatus', () => {
     let updateStatusDto: UpdateTaskStatusDto;
     let mockTask: Task;
     let assignee: User;
     let nonAssignee: User;
     const taskId = 'task-status-uuid';
     const creator = { userId: 'creator-for-status', username: 'creatorStat', role: UserRole.USER };

     beforeEach(() => {
       jest.clearAllMocks();
       assignee = { id: 'assignee-uuid', /* other props */ departments: [] } as unknown as User;
       nonAssignee = { id: 'non-assignee-uuid', /* other props */ departments: [] } as unknown as User;
       updateStatusDto = { status: TaskStatus.IN_PROGRESS };
       mockTask = {
         id: taskId, title: 'Status Task', description: '', 
         status: TaskStatus.PENDING, // Start as Pending
         priority: TaskPriority.MEDIUM, type: TaskType.USER, 
         is_private: false, dueDate: null, createdAt: new Date(), updatedAt: new Date(), 
         createdById: creator.userId,
         assignedToUsers: [assignee], // Assignee is assigned
         assignedToDepartments: [], 
         createdBy: null as (User | null), 
         assignedToProvinceId: null as (string | null),
         assignedToProvince: null as (Province | null), 
         isDelegated: false, 
         delegatedByUserId: null as (string | null),
         delegatedBy: null as (User | null),
         delegatedFromTaskId: null as (string | null),
         delegatedFromTask: null as (Task | null)
       } as Task;
       
       taskRepository.findOne = jest.fn().mockResolvedValue(mockTask);
       taskRepository.save = jest.fn().mockImplementation(task => Promise.resolve({ ...task }));
       userRepository.findOneBy = jest.fn().mockResolvedValue(assignee as User); // Cast
       activityLogServiceMock.createLog = jest.fn();
       // Mock the permission helper - return true for assignee, false otherwise
       // Note: This bypasses the actual logic in checkAssigneePermission for these unit tests
       jest.spyOn(service as any, 'checkAssigneePermission').mockImplementation(async (tId, uId) => {
           return tId === taskId && uId === assignee.id;
       });
     });
     
     it('should allow an assignee to update status from PENDING to IN_PROGRESS', async () => {
        updateStatusDto.status = TaskStatus.IN_PROGRESS;
        await service.updateStatus(taskId, updateStatusDto, { userId: assignee.id });
        expect(taskRepository.save).toHaveBeenCalledTimes(1);
        const savedData = (taskRepository.save as jest.Mock).mock.calls[0][0];
        expect(savedData.status).toEqual(TaskStatus.IN_PROGRESS);
        expect(activityLogServiceMock.createLog).toHaveBeenCalled();
     });
     
     it('should allow an assignee to update status from IN_PROGRESS to COMPLETED', async () => {
         mockTask.status = TaskStatus.IN_PROGRESS; // Set initial state for test
         taskRepository.findOne = jest.fn().mockResolvedValue(mockTask);
         updateStatusDto.status = TaskStatus.COMPLETED;
         await service.updateStatus(taskId, updateStatusDto, { userId: assignee.id });
         expect(taskRepository.save).toHaveBeenCalledTimes(1);
         const savedData = (taskRepository.save as jest.Mock).mock.calls[0][0];
         expect(savedData.status).toEqual(TaskStatus.COMPLETED);
         expect(activityLogServiceMock.createLog).toHaveBeenCalled();
     });
     
     it('should throw ForbiddenException if a non-assignee tries to update status', async () => {
         await expect(service.updateStatus(taskId, updateStatusDto, { userId: nonAssignee.id })).rejects.toThrow(ForbiddenException);
         expect(taskRepository.save).not.toHaveBeenCalled();
     });

     it('should throw BadRequestException for invalid assignee status transitions', async () => {
         // Pending -> Completed (Invalid for assignee)
         updateStatusDto.status = TaskStatus.COMPLETED;
         await expect(service.updateStatus(taskId, updateStatusDto, { userId: assignee.id })).rejects.toThrow(BadRequestException);
         
         // InProgress -> Pending (Invalid for assignee)
         mockTask.status = TaskStatus.IN_PROGRESS;
         taskRepository.findOne = jest.fn().mockResolvedValue(mockTask);
         updateStatusDto.status = TaskStatus.PENDING;
          await expect(service.updateStatus(taskId, updateStatusDto, { userId: assignee.id })).rejects.toThrow(BadRequestException);
         
         // Completed -> InProgress (Invalid for assignee)
         mockTask.status = TaskStatus.COMPLETED;
         taskRepository.findOne = jest.fn().mockResolvedValue(mockTask);
         updateStatusDto.status = TaskStatus.IN_PROGRESS;
          await expect(service.updateStatus(taskId, updateStatusDto, { userId: assignee.id })).rejects.toThrow(BadRequestException);
     });
     
     // TODO: Add tests for department assignee permissions if checkAssigneePermission logic is complex
  });
  
  // --- Tests for updatePriority method ---
  describe('updatePriority', () => {
       let updatePriorityDto: UpdateTaskPriorityDto;
       let mockTask: Task;
       let assignee: User;
       let nonAssignee: User;
       const taskId = 'task-priority-uuid';
       const creator = { userId: 'creator-for-priority', username: 'creatorPrio', role: UserRole.USER };
       
       beforeEach(() => {
           jest.clearAllMocks();
           assignee = { id: 'assignee-uuid-prio', /* other props */ departments: [] } as unknown as User;
           nonAssignee = { id: 'non-assignee-uuid-prio', /* other props */ departments: [] } as unknown as User;
           updatePriorityDto = { priority: TaskPriority.HIGH };
           mockTask = {
               id: taskId, title: 'Priority Task', description: '', 
               status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, type: TaskType.USER, 
               assignedToUsers: [assignee], // Assignee is assigned
               is_private: false, dueDate: null, createdAt: new Date(), updatedAt: new Date(),
               createdById: 'some-creator-id',
               createdBy: null as (User | null), 
               assignedToDepartments: [], 
               assignedToProvinceId: null as (string | null),
               assignedToProvince: null as (Province | null), 
               isDelegated: false, 
               delegatedByUserId: null as (string | null),
               delegatedBy: null as (User | null),
               delegatedFromTaskId: null as (string | null),
               delegatedFromTask: null as (Task | null)
           } as Task;
           
           taskRepository.findOne = jest.fn().mockResolvedValue(mockTask);
           taskRepository.save = jest.fn().mockImplementation(task => Promise.resolve({ ...task }));
           userRepository.findOneBy = jest.fn().mockResolvedValue(assignee as User); // Cast
           activityLogServiceMock.createLog = jest.fn();
           jest.spyOn(service as any, 'checkAssigneePermission').mockImplementation(async (tId, uId) => {
               return tId === taskId && uId === assignee.id;
           });
       });
       
       it('should allow an assignee to update priority', async () => {
           await service.updatePriority(taskId, updatePriorityDto, { userId: assignee.id });
           expect(taskRepository.save).toHaveBeenCalledTimes(1);
           const savedData = (taskRepository.save as jest.Mock).mock.calls[0][0];
           expect(savedData.priority).toEqual(TaskPriority.HIGH);
           expect(activityLogServiceMock.createLog).toHaveBeenCalled();
       });
       
       it('should throw ForbiddenException if a non-assignee tries to update priority', async () => {
           await expect(service.updatePriority(taskId, updatePriorityDto, { userId: nonAssignee.id })).rejects.toThrow(ForbiddenException);
           expect(taskRepository.save).not.toHaveBeenCalled();
       });
       
       // TODO: Add tests for department assignee permissions if needed
  });

  // --- Tests for remove method ---
  describe('remove', () => {
     let mockTask: Task;
     const taskId = 'task-remove-uuid';
     const creator = { userId: 'creator-rm-uuid', username: 'creatorRM', role: UserRole.USER };
     const nonCreator = { userId: 'non-creator-rm-uuid', username: 'noncreatorRM', role: UserRole.USER };
     
     beforeEach(() => {
         jest.clearAllMocks();
         mockTask = { 
             id: taskId, title: 'Task To Remove', 
             createdById: creator.userId, 
             description: '', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, type: TaskType.PERSONAL,
             is_private: false, dueDate: null, createdAt: new Date(), updatedAt: new Date(),
             createdBy: null as (User | null), assignedToUsers: [], assignedToDepartments: [], 
             assignedToProvinceId: null as (string | null),
             assignedToProvince: null as (Province | null), isDelegated: false, 
             delegatedByUserId: null as (string | null), delegatedBy: null as (User | null),
             delegatedFromTaskId: null as (string | null), delegatedFromTask: null as (Task | null)
         } as Task;
         
         taskRepository.findOne = jest.fn().mockResolvedValue(mockTask);
         taskRepository.delete = jest.fn().mockResolvedValue({ affected: 1 });
         userRepository.findOneBy = jest.fn().mockResolvedValue(creator as User); // Cast
         activityLogServiceMock.createLog = jest.fn();
     });
     
     it('should allow the creator to remove the task', async () => {
         await service.remove(taskId, creator);
         expect(taskRepository.findOne).toHaveBeenCalledWith({ where: { id: taskId }, relations: expect.any(Array) });
         expect(activityLogServiceMock.createLog).toHaveBeenCalled(); // Log before delete
         expect(taskRepository.delete).toHaveBeenCalledWith(taskId);
     });
     
     it('should throw ForbiddenException if a non-creator tries to remove the task', async () => {
          await expect(service.remove(taskId, nonCreator)).rejects.toThrow(ForbiddenException);
          expect(taskRepository.delete).not.toHaveBeenCalled();
          expect(activityLogServiceMock.createLog).not.toHaveBeenCalled();
     });
     
     it('should throw NotFoundException if task deletion affects 0 rows', async () => {
          taskRepository.delete = jest.fn().mockResolvedValue({ affected: 0 }); // Mock delete fails
          await expect(service.remove(taskId, creator)).rejects.toThrow(NotFoundException);
          expect(activityLogServiceMock.createLog).toHaveBeenCalled(); // Log should still be attempted
     });
  });

  // --- Tests for cancelTask method ---
  describe('cancelTask', () => {
      let mockTask: Task;
      const taskId = 'task-cancel-uuid';
      const creator = { userId: 'creator-cancel-uuid', username: 'creatorCancel', role: UserRole.USER };
      const nonCreator = { userId: 'non-creator-cancel-uuid', username: 'noncreatorCancel', role: UserRole.USER };
      
      beforeEach(() => {
          jest.clearAllMocks();
          mockTask = { 
              id: taskId, title: 'Task To Cancel', 
              status: TaskStatus.PENDING,
              createdById: creator.userId, 
              description: '', priority: TaskPriority.MEDIUM, type: TaskType.PERSONAL,
              is_private: false, dueDate: null, createdAt: new Date(), updatedAt: new Date(),
              createdBy: null as (User | null), assignedToUsers: [], assignedToDepartments: [], 
              assignedToProvinceId: null as (string | null),
              assignedToProvince: null as (Province | null), isDelegated: false, 
              delegatedByUserId: null as (string | null), delegatedBy: null as (User | null),
              delegatedFromTaskId: null as (string | null), delegatedFromTask: null as (Task | null)
          } as Task;
          
          taskRepository.findOne = jest.fn().mockResolvedValue(mockTask);
          taskRepository.save = jest.fn().mockImplementation(task => Promise.resolve({ ...task }));
          userRepository.findOneBy = jest.fn().mockResolvedValue(creator as User); // Cast
          activityLogServiceMock.createLog = jest.fn();
      });
      
     it('should allow the creator to cancel a pending task', async () => {
          await service.cancelTask(taskId, creator);
          expect(taskRepository.findOne).toHaveBeenCalledWith({ where: { id: taskId }, relations: expect.any(Array) });
          expect(taskRepository.save).toHaveBeenCalledTimes(1);
          const savedData = (taskRepository.save as jest.Mock).mock.calls[0][0];
          expect(savedData.status).toEqual(TaskStatus.CANCELLED);
          expect(activityLogServiceMock.createLog).toHaveBeenCalled();
      });
      
     it('should allow the creator to cancel an in-progress task', async () => {
           mockTask.status = TaskStatus.IN_PROGRESS;
           taskRepository.findOne = jest.fn().mockResolvedValue(mockTask);
           await service.cancelTask(taskId, creator);
           expect(taskRepository.save).toHaveBeenCalledTimes(1);
           const savedData = (taskRepository.save as jest.Mock).mock.calls[0][0];
           expect(savedData.status).toEqual(TaskStatus.CANCELLED);
           expect(activityLogServiceMock.createLog).toHaveBeenCalled();
      });
      
       it('should throw ForbiddenException if a non-creator tries to cancel the task', async () => {
           await expect(service.cancelTask(taskId, nonCreator)).rejects.toThrow(ForbiddenException);
           expect(taskRepository.save).not.toHaveBeenCalled();
       });
       
       it('should throw BadRequestException if trying to cancel a completed task', async () => {
            mockTask.status = TaskStatus.COMPLETED;
            taskRepository.findOne = jest.fn().mockResolvedValue(mockTask);
            await expect(service.cancelTask(taskId, creator)).rejects.toThrow(BadRequestException);
            expect(taskRepository.save).not.toHaveBeenCalled();
       });
       
       it('should throw BadRequestException if trying to cancel an already cancelled task', async () => {
            mockTask.status = TaskStatus.CANCELLED;
            taskRepository.findOne = jest.fn().mockResolvedValue(mockTask);
            await expect(service.cancelTask(taskId, creator)).rejects.toThrow(BadRequestException);
            expect(taskRepository.save).not.toHaveBeenCalled();
       });
  });

  // TODO: Add tests for delegateTask, assignTask, getDashboardTasks, etc.

});
