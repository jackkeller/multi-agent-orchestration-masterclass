import { MessageBus } from './MessageBus';
import { 
  Task, 
  TaskResult, 
  OrchestrationResult,
  WorkerConfig,
  OrchestrationConfig 
} from '../types';

export class Coordinator {
  private messageBus: MessageBus;
  private config: OrchestrationConfig;
  private pendingTasks: Task[] = [];
  private activeTasks = new Map<string, Task>();
  private completedTasks = new Map<string, TaskResult>();
  private workerPool = new Map<string, WorkerConfig>();
  private orchestrationStartTime: number = 0;

  constructor(
    messageBus: MessageBus,
    config: Partial<OrchestrationConfig> = {}
  ) {
    this.messageBus = messageBus;
    this.config = {
      maxParallelWorkers: 8,
      defaultTimeoutMs: 300000, // 5 minutes
      retryFailedTasks: true,
      maxRetries: 2,
      ...config
    };

    this.setupMessageHandlers();
  }

  private setupMessageHandlers(): void {
    // Task completion
    this.messageBus.subscribe('task.complete', (msg) => {
      const result = msg.payload as TaskResult;
      this.handleTaskCompletion(result);
    });

    // Task failure
    this.messageBus.subscribe('task.failed', (msg) => {
      const result = msg.payload as TaskResult;
      this.handleTaskFailure(result);
    });

    // Worker registration
    this.messageBus.subscribe('worker.register', (msg) => {
      const config = msg.payload as WorkerConfig;
      this.workerPool.set(config.id, config);
      console.log(`[Coordinator] Worker registered: ${config.id} (${config.type})`);
    });

    // Progress updates
    this.messageBus.subscribe('task.progress', (msg) => {
      const { taskId, progress, message } = msg.payload;
      console.log(`[Progress] Task ${taskId}: ${progress}% ${message || ''}`);
    });
  }

  // Register a worker
  registerWorker(config: WorkerConfig): void {
    this.workerPool.set(config.id, config);
    this.messageBus.send({
      from: 'coordinator',
      to: 'broadcast',
      type: 'worker.register',
      payload: config
    });
  }

  // Main orchestration method
  async orchestrate(
    phase: 'research' | 'implementation' | 'verification',
    tasks: Task[]
  ): Promise<OrchestrationResult> {
    this.orchestrationStartTime = Date.now();
    
    console.log(`\n[Coordinator] Starting ${phase} phase with ${tasks.length} tasks`);
    
    // Reset state for new orchestration
    this.pendingTasks = [...tasks];
    this.activeTasks.clear();
    this.completedTasks.clear();

    // Distribute tasks to workers
    await this.distributeTasks(tasks);

    // Wait for all tasks to complete
    await this.waitForCompletion();

    // Synthesize results
    const results = Array.from(this.completedTasks.values());
    const success = results.every(r => r.success);
    
    const orchestrationResult: OrchestrationResult = {
      taskId: tasks[0]?.id || 'unknown',
      success,
      phase,
      results,
      durationMs: Date.now() - this.orchestrationStartTime
    };

    console.log(`[Coordinator] ${phase} phase complete: ${success ? 'SUCCESS' : 'PARTIAL FAILURE'}`);
    console.log(`  - Completed: ${results.filter(r => r.success).length}/${results.length} tasks`);
    console.log(`  - Duration: ${orchestrationResult.durationMs}ms\n`);
    
    return orchestrationResult;
  }

  private async distributeTasks(tasks: Task[]): Promise<void> {
    // Filter tasks by dependencies
    const readyTasks = tasks.filter(t => 
      !t.dependencies || 
      t.dependencies.every(depId => this.completedTasks.has(depId))
    );

    // Group by type for efficient worker assignment
    const tasksByType = this.groupByType(readyTasks);

    // Send tasks to appropriate workers
    for (const [type, typeTasks] of Object.entries(tasksByType)) {
      const availableWorkers = this.getAvailableWorkers(type as any);
      
      for (const task of typeTasks) {
        // Simple round-robin assignment
        const worker = availableWorkers.shift();
        if (worker) {
          this.assignTaskToWorker(task, worker);
          availableWorkers.push(worker); // Put back for next task
        } else {
          // Queue for later if no workers available
          console.log(`[Coordinator] No ${type} workers available, queuing task ${task.id}`);
        }
      }
    }
  }

  private groupByType(tasks: Task[]): Record<string, Task[]> {
    return tasks.reduce((acc, task) => {
      if (!acc[task.type]) acc[task.type] = [];
      acc[task.type].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  }

  private getAvailableWorkers(type: string): WorkerConfig[] {
    return Array.from(this.workerPool.values()).filter(
      w => w.type === type
    );
  }

  private assignTaskToWorker(task: Task, worker: WorkerConfig): void {
    this.activeTasks.set(task.id, task);
    this.pendingTasks = this.pendingTasks.filter(t => t.id !== task.id);

    console.log(`[Coordinator] Assigning task ${task.id} to worker ${worker.id}`);

    this.messageBus.send({
      from: 'coordinator',
      to: worker.id,
      type: 'task.assign',
      payload: task
    });
  }

  private handleTaskCompletion(result: TaskResult): void {
    this.activeTasks.delete(result.taskId);
    this.completedTasks.set(result.taskId, result);

    // Check if there are dependent tasks ready
    this.processDependentTasks(result.taskId);
  }

  private handleTaskFailure(result: TaskResult): void {
    const task = this.activeTasks.get(result.taskId);
    this.activeTasks.delete(result.taskId);

    if (task && this.shouldRetry(task)) {
      // Re-queue for retry
      console.log(`[Coordinator] Retrying task ${task.id}`);
      this.pendingTasks.push({
        ...task,
        retryCount: ((task as any).retryCount || 0) + 1
      });
    } else {
      this.completedTasks.set(result.taskId, result);
    }
  }

  private shouldRetry(task: Task): boolean {
    const retryCount = (task as any).retryCount || 0;
    return this.config.retryFailedTasks && retryCount < this.config.maxRetries;
  }

  private processDependentTasks(completedTaskId: string): void {
    const dependentTasks = this.pendingTasks.filter(
      t => t.dependencies?.includes(completedTaskId)
    );

    // Check if all dependencies are now satisfied
    const readyTasks = dependentTasks.filter(t =>
      t.dependencies!.every(depId => this.completedTasks.has(depId))
    );

    if (readyTasks.length > 0) {
      console.log(`[Coordinator] ${readyTasks.length} dependent tasks now ready`);
      this.distributeTasks(readyTasks);
    }
  }

  private async waitForCompletion(): Promise<void> {
    const startTime = Date.now();
    
    while (this.activeTasks.size > 0 || this.pendingTasks.length > 0) {
      if (Date.now() - startTime > this.config.defaultTimeoutMs) {
        throw new Error('Orchestration timeout');
      }

      // Process any newly ready tasks
      if (this.pendingTasks.length > 0 && this.activeTasks.size < this.config.maxParallelWorkers) {
        await this.distributeTasks(this.pendingTasks);
      }

      // Small delay to prevent busy-waiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Get current orchestration status
  getStatus(): {
    pending: number;
    active: number;
    completed: number;
    workers: number;
  } {
    return {
      pending: this.pendingTasks.length,
      active: this.activeTasks.size,
      completed: this.completedTasks.size,
      workers: this.workerPool.size
    };
  }
}
