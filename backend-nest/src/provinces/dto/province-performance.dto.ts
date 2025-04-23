import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../../tasks/entities/task.entity';

export class TaskStatusCount {
  @ApiProperty({ description: 'Task status' })
  status: TaskStatus;

  @ApiProperty({ description: 'Number of tasks with this status' })
  count: number;
}

export class PerformanceMetrics {
  @ApiProperty({ description: 'Average time to complete tasks in hours' })
  avgCompletionTime: number;

  @ApiProperty({ description: 'Percentage of tasks completed on time' })
  onTimeCompletionRate: number;

  @ApiProperty({ description: 'Percentage of tasks that are overdue' })
  overdueRate: number;

  @ApiProperty({ description: 'Total number of tasks' })
  taskVolume: number;
}

export class ProvincePerformanceDto {
  @ApiProperty({ description: 'Province ID' })
  provinceId: string;

  @ApiProperty({ description: 'Province name' })
  provinceName: string;

  @ApiProperty({ description: 'Task status distribution', type: [TaskStatusCount] })
  statusDistribution: TaskStatusCount[];

  @ApiProperty({ description: 'Performance metrics', type: PerformanceMetrics })
  metrics: PerformanceMetrics;
}

export class MultiProvincePerformanceDto {
  @ApiProperty({ description: 'Performance data for multiple provinces', type: [ProvincePerformanceDto] })
  provinces: ProvincePerformanceDto[];
} 