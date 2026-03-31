"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Worker = void 0;
class Worker {
    config;
    messageBus;
    currentTasks = new Map();
    completedTasks = [];
    constructor(config, messageBus) {
        this.config = config;
        this.messageBus = messageBus;
        this.setupMessageHandlers();
    }
    setupMessageHandlers() {
        // Listen for task assignments
        this.messageBus.subscribe('task.assign', (msg) => {
            if (msg.to === this.config.id || msg.to === 'broadcast') {
                this.handleTaskAssignment(msg.payload);
            }
        });
        // Listen for cancellation requests
        this.messageBus.subscribe('task.cancel', (msg) => {
            const taskId = msg.payload.taskId;
            this.cancelTask(taskId);
        });
    }
    async handleTaskAssignment(task) {
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
            const taskResult = {
                taskId: task.id,
                workerId: this.config.id,
                success: true,
                data: result,
                durationMs: Date.now() - startTime
            };
            this.completedTasks.push(taskResult);
            this.reportCompletion(taskResult);
        }
        catch (error) {
            const taskResult = {
                taskId: task.id,
                workerId: this.config.id,
                success: false,
                data: null,
                error: error instanceof Error ? error.message : String(error),
                durationMs: Date.now() - startTime
            };
            this.completedTasks.push(taskResult);
            this.reportCompletion(taskResult);
        }
        finally {
            this.currentTasks.delete(task.id);
        }
    }
    cancelTask(taskId) {
        const controller = this.currentTasks.get(taskId);
        if (controller) {
            controller.abort();
            this.currentTasks.delete(taskId);
        }
    }
    reportCompletion(result) {
        this.messageBus.send({
            from: this.config.id,
            to: 'coordinator',
            type: result.success ? 'task.complete' : 'task.failed',
            payload: result
        });
    }
    // Report progress during long-running tasks
    reportProgress(taskId, progress, message) {
        this.messageBus.send({
            from: this.config.id,
            to: 'coordinator',
            type: 'task.progress',
            payload: { taskId, progress, message }
        });
    }
    // Log to scratchpad
    log(message, data) {
        this.messageBus.send({
            from: this.config.id,
            to: 'scratchpad',
            type: 'log.append',
            payload: {
                timestamp: new Date(),
                workerId: this.config.id,
                message,
                data
            }
        });
    }
    getStatus() {
        return {
            id: this.config.id,
            type: this.config.type,
            activeTasks: this.currentTasks.size,
            completedTasks: this.completedTasks.length
        };
    }
}
exports.Worker = Worker;
//# sourceMappingURL=Worker.js.map