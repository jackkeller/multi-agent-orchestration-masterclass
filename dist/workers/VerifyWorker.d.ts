import { Worker } from '../core/Worker';
import { Task } from '../types';
export declare class VerifyWorker extends Worker {
    protected executeTask(task: Task, signal: AbortSignal): Promise<any>;
    private runCheck;
    private checkSyntax;
    private runTests;
    private runLinter;
    private runTypeCheck;
    private runBuild;
    private runSecurityCheck;
    private simulateWork;
}
