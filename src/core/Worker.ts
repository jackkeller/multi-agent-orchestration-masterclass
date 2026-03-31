import { MessageBus } from './MessageBus';
import { Task, TaskResult, WorkerConfig, LogEntry } from '../types';

export abstract class Worker {
  protected config: WorkerConfig;
  protected messageBus: MessageBus;
  protected currentTasks = new Map<string, AbortController>();
  protected completedTasks: TaskResult[] = [];

  constructor(config: WorkerConfig, messageBus: MessageBus) {
    this.config = config;
    this.messageBus = messageBus;
    this.setupMessageHandlers();
  }

  private setupMessageHandlers(): void {
    // Listen for task assignments
    this.messageBus.subscribe('task.assign', (msg) => {
      if (msg.to === this.config.id || msg.to === 'broadcast') {
        this.handleTaskAssignment(msg.payload as Task);
      }
    });

    // Listen for cancellation requests
    this.messageBus.subscribe('task.cancel', (msg) => {
      const taskId = msg.payload.taskId;
      this.cancelTask(taskId);
    });
  }

  private async handleTaskAssignment(task: Task): Promise<void> {
    // Check if at capacity
    if (this.currentTasks.size >= this.config.maxConcurrentTasks) {
      this.messageBus.send({
        from: this.config.id,
        to: 'coordinator',
        type: 'worker.busy',
        payload: { taskId: task.id, workerId: this.config.id }
      });
      return;
    }

    const abortController = new AbortController();
    this.currentTasks.set(task.id, abortController);

    const startTime = Date.now();

    try {
      // Report task started
      this.messageBus.send({
        from: this.config.id,
        to: 'coordinator',
        type: 'task.started',
        payload: { taskId: task.id, workerId: this.config.id }
      });

      // Execute task
      const result = await this.executeTask(task, abortController.signal);
      
      const taskResult: TaskResult = {
        taskId: task.id,
        workerId: this.config.id,
        success: true,
        data: result,
        durationMs: Date.now() - startTime
      };

      this.completedTasks.push(taskResult);
      this.reportCompletion(taskResult);

    } catch (error) {
      const taskResult: TaskResult = {
        taskId: task.id,
        workerId: this.config.id,
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startTime
      };

      this.completedTasks.push(taskResult);
      this.reportCompletion(taskResult);
    } finally {
      this.currentTasks.delete(task.id);
    }
  }

  private cancelTask(taskId: string): void {
    const controller = this.currentTasks.get(taskId);
    if (controller) {
      controller.abort();
      this.currentTasks.delete(taskId);
    }
  }

  private reportCompletion(result: TaskResult): void {
    this.messageBus.send({
      from: this.config.id,
      to: 'coordinator',
      type: result.success ? 'task.complete' : 'task.failed',
      payload: result
    });
  }

  // Abstract method for task execution
  protected abstract executeTask(
    task: Task, 
    signal: AbortSignal
  ): Promise<any>;

  // Report progress during long-running tasks
  protected reportProgress(taskId: string, progress: number, message?: string): void {
    this.messageBus.send({
      from: this.config.id,
      to: 'coordinator',
      type: 'task.progress',
      payload: { taskId, progress, message }
    });
  }

  // Log to scratchpad
  protected log(message: string, data?: any): void {
    this.messageBus.send({
      from: this.config.id,
      to: 'scratchpad',
      type: 'log.append',
      payload: {
        timestamp: new Date(),
        workerId: this.config.id,
        message,
        data
      } as LogEntry
    });
  }

  getStatus(): {
    id: string;
    type: string;
    activeTasks: number;
    completedTasks: number;
  } {
    return {
      id: this.config.id,
      type: this.config.type,
      activeTasks: this.currentTasks.size,
      completedTasks: this.completedTasks.length
    };
  }
}
