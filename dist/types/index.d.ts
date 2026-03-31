export interface Task {
    id: string;
    type: 'research' | 'implement' | 'verify';
    description: string;
    payload: any;
    priority: number;
    dependencies?: string[];
    retryCount?: number;
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
export interface Message {
    id: string;
    from: string;
    to: string | 'broadcast';
    type: string;
    payload: any;
    timestamp: Date;
}
export interface OrchestrationConfig {
    maxParallelWorkers: number;
    defaultTimeoutMs: number;
    retryFailedTasks: boolean;
    maxRetries: number;
}
export interface Scratchpad {
    write(key: string, value: any): void;
    read(key: string): any;
    appendLog(entry: LogEntry): void;
    getLogs(): LogEntry[];
}
export interface LogEntry {
    timestamp: Date;
    workerId: string;
    message: string;
    data?: any;
}
export interface ProgressUpdate {
    taskId: string;
    workerId: string;
    progress: number;
    message?: string;
}
