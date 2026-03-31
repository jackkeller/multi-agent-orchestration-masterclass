import { Worker } from '../core/Worker';
import { Task } from '../types';
export declare class ResearchWorker extends Worker {
    protected executeTask(task: Task, signal: AbortSignal): Promise<any>;
    private simulateWork;
}
