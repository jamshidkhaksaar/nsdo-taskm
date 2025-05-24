import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Province } from "./entities/province.entity";
import { TaskStatus } from "../tasks/entities/task.entity";
import { Task } from "../tasks/entities/task.entity";
import {
  ProvincePerformanceDto,
  PerformanceMetrics,
  TaskStatusCount,
  MultiProvincePerformanceDto,
} from "./dto/province-performance.dto";
import { CreateProvinceDto } from "./dto/create-province.dto";
import { UpdateProvinceDto } from "./dto/update-province.dto";
import { In } from "typeorm";

@Injectable()
export class ProvinceService {
  private readonly logger = new Logger(ProvinceService.name);

  constructor(
    @InjectRepository(Province)
    private provinceRepository: Repository<Province>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async create(createProvinceDto: CreateProvinceDto): Promise<Province> {
    const province = this.provinceRepository.create(createProvinceDto);
    return this.provinceRepository.save(province);
  }

  async findAll(): Promise<Province[]> {
    return this.provinceRepository.find({
      relations: ["departments"],
    });
  }

  async findOne(id: string): Promise<Province> {
    const province = await this.provinceRepository.findOne({
      where: { id },
      relations: ["departments"],
    });
    if (!province) {
      throw new NotFoundException(`Province with ID ${id} not found`);
    }
    return province;
  }

  async update(
    id: string,
    updateProvinceDto: UpdateProvinceDto,
  ): Promise<Province> {
    const province = await this.findOne(id);
    this.provinceRepository.merge(province, updateProvinceDto);
    return this.provinceRepository.save(province);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Throws if not found
    await this.provinceRepository.delete(id);
  }

  async getPerformanceStatistics(
    provinceId: string,
  ): Promise<ProvincePerformanceDto> {
    const province = await this.findOne(provinceId);

    // Get all tasks for the province
    const tasks = await this.tasksRepository
      .createQueryBuilder("task")
      .where("task.assignedToProvinceId = :provinceId", { provinceId })
      .leftJoinAndSelect("task.assignedToDepartments", "department")
      .getMany();

    // Calculate status distribution
    const statusDistribution: TaskStatusCount[] = [];
    const statuses = Object.values(TaskStatus);

    for (const status of statuses) {
      const count = tasks.filter((task) => task.status === status).length;
      statusDistribution.push({ status, count });
    }

    // Calculate performance metrics
    const completedTasks = tasks.filter(
      (task) => task.status === TaskStatus.COMPLETED,
    );
    const totalTasks = tasks.length;

    // Calculate average completion time in hours
    let avgCompletionTime = 0;
    if (completedTasks.length > 0) {
      const completionTimes = completedTasks
        .filter((task) => task.completedAt && task.createdAt)
        .map((task) => {
          const completionTime =
            task.completedAt!.getTime() - task.createdAt.getTime();
          return completionTime / (1000 * 60 * 60); // Convert to hours
        });

      avgCompletionTime =
        completionTimes.length > 0
          ? completionTimes.reduce((sum, time) => sum + time, 0) /
            completionTimes.length
          : 0;
    }

    // Calculate on-time completion rate
    const onTimeCompletedTasks = completedTasks.filter((task) => {
      if (!task.dueDate || !task.completedAt) return false;
      return task.completedAt <= task.dueDate;
    });

    const onTimeCompletionRate =
      completedTasks.length > 0
        ? (onTimeCompletedTasks.length / completedTasks.length) * 100
        : 0;

    // Calculate overdue rate
    const currentDate = new Date();
    const overdueTasks = tasks.filter((task) => {
      if (task.status === TaskStatus.COMPLETED || !task.dueDate) return false;
      return task.dueDate < currentDate;
    });

    const overdueRate =
      totalTasks > 0 ? (overdueTasks.length / totalTasks) * 100 : 0;

    const metrics: PerformanceMetrics = {
      avgCompletionTime,
      onTimeCompletionRate,
      overdueRate,
      taskVolume: totalTasks,
    };

    return {
      provinceId: province.id,
      provinceName: province.name,
      statusDistribution,
      metrics,
    };
  }

  async getMultiProvincePerformance(
    provinceIds: string[],
  ): Promise<MultiProvincePerformanceDto> {
    if (!provinceIds || provinceIds.length === 0) {
      return { provinces: [] };
    }

    const provincesMap = new Map<string, ProvincePerformanceDto>();

    // 1. Fetch all relevant provinces at once
    const allProvinces = await this.provinceRepository.find({
      where: { id: In(provinceIds) },
      // relations: ["departments"], // Departments not directly used in the final DTO structure here, tasks are key
    });

    if (allProvinces.length === 0) {
        return { provinces: [] };
    }

    // Initialize map with basic province info
    allProvinces.forEach(p => {
      provincesMap.set(p.id, {
        provinceId: p.id,
        provinceName: p.name,
        statusDistribution: Object.values(TaskStatus).map(status => ({ status, count: 0 })),
        metrics: {
          avgCompletionTime: 0,
          onTimeCompletionRate: 0,
          overdueRate: 0,
          taskVolume: 0,
        },
      });
    });

    // 2. Fetch all relevant tasks for these provinces at once
    const allTasks = await this.tasksRepository
      .createQueryBuilder("task")
      .where("task.assignedToProvinceId IN (:...provinceIdsToQuery)", { provinceIdsToQuery: provinceIds })
      // No need to join departments here if not used in performance metrics directly for province summary
      // .leftJoinAndSelect("task.assignedToDepartments", "department") 
      .getMany();

    // 3. Process tasks and aggregate data for each province
    const tasksByProvince = new Map<string, Task[]>();
    allTasks.forEach(task => {
      if (task.assignedToProvinceId) {
        if (!tasksByProvince.has(task.assignedToProvinceId)) {
          tasksByProvince.set(task.assignedToProvinceId, []);
        }
        tasksByProvince.get(task.assignedToProvinceId)!.push(task);
      }
    });

    for (const province of allProvinces) {
      const provinceId = province.id;
      const tasksForThisProvince = tasksByProvince.get(provinceId) || [];
      const currentDto = provincesMap.get(provinceId)!;

      // Calculate status distribution
      const statusDistributionMap = new Map<TaskStatus, number>();
      Object.values(TaskStatus).forEach(s => statusDistributionMap.set(s, 0));
      tasksForThisProvince.forEach(task => {
        statusDistributionMap.set(task.status, (statusDistributionMap.get(task.status) || 0) + 1);
      });
      currentDto.statusDistribution = Array.from(statusDistributionMap.entries()).map(([status, count]) => ({ status, count }));

      // Calculate performance metrics
      const completedTasks = tasksForThisProvince.filter(
        (task) => task.status === TaskStatus.COMPLETED,
      );
      const totalTasks = tasksForThisProvince.length;
      currentDto.metrics.taskVolume = totalTasks;

      let avgCompletionTime = 0;
      if (completedTasks.length > 0) {
        const completionTimes = completedTasks
          .filter((task) => task.completedAt && task.createdAt)
          .map((task) => {
            const completionTime =
              task.completedAt!.getTime() - task.createdAt.getTime();
            return completionTime / (1000 * 60 * 60); // Convert to hours
          });
        avgCompletionTime =
          completionTimes.length > 0
            ? completionTimes.reduce((sum, time) => sum + time, 0) /
              completionTimes.length
            : 0;
      }
      currentDto.metrics.avgCompletionTime = avgCompletionTime;

      const onTimeCompletedTasks = completedTasks.filter((task) => {
        if (!task.dueDate || !task.completedAt) return false;
        return task.completedAt <= task.dueDate;
      });
      currentDto.metrics.onTimeCompletionRate =
        completedTasks.length > 0
          ? (onTimeCompletedTasks.length / completedTasks.length) * 100
          : 0;

      const currentDate = new Date();
      const overdueTasks = tasksForThisProvince.filter((task) => {
        if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED || !task.dueDate) return false;
        return task.dueDate < currentDate;
      });
      currentDto.metrics.overdueRate =
        totalTasks > 0 ? (overdueTasks.length / totalTasks) * 100 : 0;
    }

    return { provinces: Array.from(provincesMap.values()) };
  }
}
