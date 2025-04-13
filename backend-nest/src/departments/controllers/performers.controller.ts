import { Controller, Get, Param, Request, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DepartmentsService } from '../departments.service';
import { ActivityLogService } from '../../admin/services/activity-log.service';
import { TaskStatus } from '../../tasks/entities/task.entity';

@Controller('departments')
@UseGuards(JwtAuthGuard)
export class DepartmentPerformersController {
  constructor(
    private departmentsService: DepartmentsService,
    @Inject(forwardRef(() => ActivityLogService))
    private activityLogService: ActivityLogService,
  ) {}

  @Get('/:id/performers')
  async getDepartmentPerformers(@Param('id') id: string, @Request() req) {
    try {
      // Log the activity
      await this.activityLogService.logFromRequest(
        req,
        'view',
        'department_performers',
        `Viewed performers for department with id: ${id}`,
        id,
      );
      
      // Generate performers data
      // For simplicity, we'll base this on department members and their task completion rates
      const department = await this.departmentsService.findOne(id);
      
      if (!department || !department.members || department.members.length === 0) {
        return [];
      }
      
      // Calculate performance metrics for each member
      const performers = await Promise.all(department.members.map(async (member) => {
        try {
          // Get completed tasks count for this user in this department
          const completedTasksCount = department.assignedTasks?.filter(task => 
            task.status === TaskStatus.COMPLETED && 
            (task.createdById === member.id ||
            (task.assignedToUsers && task.assignedToUsers.some(assignee => assignee.id === member.id)))
          ).length || 0;
          
          // Get total tasks for this user in this department
          const totalTasksCount = department.assignedTasks?.filter(task => 
            task.createdById === member.id ||
            (task.assignedToUsers && task.assignedToUsers.some(assignee => assignee.id === member.id))
          ).length || 0;
          
          // Calculate completion rate
          const completionRate = totalTasksCount > 0 
            ? Math.round((completedTasksCount / totalTasksCount) * 100) 
            : 0;
          
          return {
            id: member.id,
            username: member.username || 'Unknown User',
            first_name: member.username?.split(' ')[0] || 'Unknown',
            last_name: member.username?.split(' ')[1] || '',
            email: member.email || '',
            completed_tasks: completedTasksCount,
            total_tasks: totalTasksCount,
            completion_rate: completionRate
          };
        } catch (error) {
          console.error(`Error calculating performance for member ${member.id}:`, error);
          return null;
        }
      }));
      
      // Filter out null entries and sort by completion rate
      return performers
        .filter(performer => performer !== null)
        .sort((a, b) => b.completion_rate - a.completion_rate);
    } catch (error) {
      console.error(`Error getting performers for department ${id}:`, error);
      return [];
    }
  }
} 