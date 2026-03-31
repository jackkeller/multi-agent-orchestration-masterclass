import { MessageBus } from './MessageBus';
import { Task, TaskResult, WorkerConfig } from '../types';
export declare abstract class Worker {
    protected config: WorkerConfig;
    protected messageBus: MessageBus;
    protected currentTasks: Map<string, AbortController>;
    protected completedTasks: TaskResult[];
    constructor(config: WorkerConfig, messageBus: MessageBus);
    private setupMessageHandlers;
    private handleTaskAssignment;
    private cancelTask;
    private reportCompletion;
    protected abstract executeTask(task: Task, signal: AbortSignal): Promise<any>;
    protected reportProgress(taskId: string, progress: number, message?: string): void;
    protected log(message: string, data?: any): void;
    getStatus(): {
        id: string;
        type: string;
        activeTasks: number;
        completedTasks: number;
    };
}
