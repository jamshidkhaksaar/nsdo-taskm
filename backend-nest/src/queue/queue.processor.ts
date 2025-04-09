import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bullmq';

@Processor('default')
export class DefaultQueueProcessor {
  @Process()
  async handleJob(job: Job) {
    console.log('Processing job:', job.id, job.name, job.data);
    // Add your background task logic here
  }
}