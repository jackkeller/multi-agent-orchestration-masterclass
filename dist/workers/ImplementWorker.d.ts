import { Worker } from '../core/Worker';
import { Task } from '../types';
export declare class ImplementWorker extends Worker {
    protected executeTask(task: Task, signal: AbortSignal): Promise<any>;
    private applyChange;
    private editFile;
    private createFile;
    private deleteFile;
    private moveFile;
    private refactorFile;
    private simulateWork;
}
