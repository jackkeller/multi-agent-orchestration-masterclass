import { MessageBus } from './MessageBus';
import { Task, OrchestrationResult, WorkerConfig, OrchestrationConfig } from '../types';
export declare class Coordinator {
    private messageBus;
    private config;
    private pendingTasks;
    private activeTasks;
    private completedTasks;
    private workerPool;
    private orchestrationStartTime;
    constructor(messageBus: MessageBus, config?: Partial<OrchestrationConfig>);
    private setupMessageHandlers;
    registerWorker(config: WorkerConfig): void;
    orchestrate(phase: 'research' | 'implementation' | 'verification', tasks: Task[]): Promise<OrchestrationResult>;
    private distributeTasks;
    private groupByType;
    private getAvailableWorkers;
    private assignTaskToWorker;
    private handleTaskCompletion;
    private handleTaskFailure;
    private shouldRetry;
    private processDependentTasks;
    private waitForCompletion;
    getStatus(): {
        pending: number;
        active: number;
        completed: number;
        workers: number;
    };
}
