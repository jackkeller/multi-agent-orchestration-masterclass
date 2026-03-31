# Module 2: Building the Orchestrator

## Overview

In this module, we'll build a production-ready multi-agent orchestrator from scratch.

## Project Structure

```
02-implementation/
├── src/
│   ├── core/
│   │   ├── Coordinator.ts       # Main orchestration logic
│   │   ├── Worker.ts            # Worker agent base class
│   │   ├── TaskQueue.ts         # Task scheduling
│   │   └── MessageBus.ts          # Inter-agent communication
│   ├── workers/
│   │   ├── ResearchWorker.ts    # Investigates, analyzes
│   │   ├── ImplementWorker.ts   # Makes code changes
│   │   └── VerifyWorker.ts      # Tests and validates
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   └── index.ts                 # Main exports
├── examples/
│   ├── 01-basic-orchestrator.ts
│   ├── 02-codebase-analysis.ts
│   └── 03-parallel-refactor.ts
└── tests/
    └── orchestrator.test.ts
```

## Building the Core

### Step 1: Define Types

Create `src/types/index.ts`:

```typescript
export interface Task {
  id: string;
  type: 'research' | 'implement' | 'verify';
  description: string;
  payload: any;
  priority: number;
  dependencies?: string[]; // Task IDs this depends on
}

export interface WorkerConfig {
  id: string;
  type: WorkerType;
  maxConcurrentTasks: number;
  timeoutMs: number;
}

export type WorkerType = 'research' | 'implement' | 'verify';

export interface TaskResult {
  taskId: string;
  workerId: string;
  success: boolean;
  data: any;
  error?: string;
  durationMs: number;
}

export interface OrchestrationResult {
  taskId: string;
  success: boolean;
  phase: 'research' | 'synthesis' | 'implementation' | 'verification';
  results: TaskResult[];
  durationMs: number;
}
```

### Step 2: Create the Message Bus

Create `src/core/MessageBus.ts`:

```typescript
export interface Message {
  id: string;
  from: string;
  to: string | 'broadcast';
  type: string;
  payload: any;
  timestamp: Date;
}

export class MessageBus {
  private handlers = new Map<string, Set<(message: Message) => void>>();
  private messageLog: Message[] = [];

  // Subscribe to messages
  subscribe(type: string, handler: (message: Message) => void): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => this.handlers.get(type)?.delete(handler);
  }

  // Send message to specific recipient
  send(message: Omit<Message, 'id' | 'timestamp'>): void {
    const fullMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    this.messageLog.push(fullMessage);
    
    // Notify specific recipient
    if (message.to !== 'broadcast') {
      this.handlers.get(message.to)?.forEach(h => h(fullMessage));
    }
    
    // Notify type subscribers
    this.handlers.get(message.type)?.forEach(h => h(fullMessage));
    
    // Notify 'all' subscribers
    this.handlers.get('all')?.forEach(h => h(fullMessage));
  }

  // Get message history
  getMessages(filter?: { from?: string; to?: string; type?: string }): Message[] {
    return this.messageLog.filter(m => {
      if (filter?.from && m.from !== filter.from) return false;
      if (filter?.to && m.to !== filter.to && m.to !== 'broadcast') return false;
      if (filter?.type && m.type !== filter.type) return false;
      return true;
    });
  }
}
```

### Step 3: Create the Base Worker

Create `src/core/Worker.ts`:

```typescript
import { MessageBus } from './MessageBus';
import { Task, TaskResult, WorkerConfig } from '../types';

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

      // Execute task with timeout
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
```

### Step 4: Create the Coordinator

Create `src/core/Coordinator.ts`:

```typescript
import { MessageBus } from './MessageBus';
import { 
  Task, 
  TaskResult, 
  OrchestrationResult,
  WorkerConfig 
} from '../types';

interface OrchestrationConfig {
  maxParallelWorkers: number;
  defaultTimeoutMs: number;
  retryFailedTasks: boolean;
  maxRetries: number;
}

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
    });

    // Worker status updates
    this.messageBus.subscribe('worker.status', (msg) => {
      // Handle worker status updates if needed
    });
  }

  // Main orchestration method
  async orchestrate(
    phase: 'research' | 'implementation' | 'verification',
    tasks: Task[]
  ): Promise<OrchestrationResult> {
    this.orchestrationStartTime = Date.now();
    
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
    
    return {
      taskId: tasks[0]?.id || 'unknown',
      success: results.every(r => r.success),
      phase,
      results,
      durationMs: Date.now() - this.orchestrationStartTime
    };
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
        const worker = availableWorkers.shift();
        if (worker) {
          this.assignTaskToWorker(task, worker);
        } else {
          // Queue for later
          this.pendingTasks.push(task);
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
      this.pendingTasks.push({
        ...task,
        retryCount: (task as any).retryCount + 1 || 1
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
      this.distributeTasks(readyTasks);
    }
  }

  private async waitForCompletion(): Promise<void> {
    // Poll until all tasks complete or timeout
    const startTime = Date.now();
    
    while (this.activeTasks.size > 0 || this.pendingTasks.length > 0) {
      if (Date.now() - startTime > this.config.defaultTimeoutMs) {
        throw new Error('Orchestration timeout');
      }

      // Process any newly ready tasks
      if (this.pendingTasks.length > 0) {
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
```

## Next Steps

Continue to [03-workers](../03-workers) to implement specific worker types.
