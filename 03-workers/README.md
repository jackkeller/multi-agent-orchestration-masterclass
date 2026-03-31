# Module 3: Implementing Worker Types

## Overview

This module implements specific worker types: Research, Implementation, and Verification.

## Research Worker

The Research Worker investigates codebases, analyzes files, and gathers information.

```typescript
import { Worker } from '../core/Worker';
import { Task } from '../types';

export class ResearchWorker extends Worker {
  protected async executeTask(task: Task, signal: AbortSignal): Promise<any> {
    const { target, query } = task.payload;
    
    this.reportProgress(task.id, 10, 'Starting research...');
    
    // Example: Find files matching pattern
    if (target.type === 'file-pattern') {
      const files = await this.findFiles(target.pattern);
      this.reportProgress(task.id, 50, `Found ${files.length} files`);
      
      // Analyze each file
      const analysis = await Promise.all(
        files.map(f => this.analyzeFile(f, query))
      );
      
      this.reportProgress(task.id, 100, 'Research complete');
      return { files, analysis };
    }
    
    // Example: Analyze dependencies
    if (target.type === 'dependencies') {
      const deps = await this.analyzeDependencies(target.packageJson);
      this.reportProgress(task.id, 100, 'Dependencies analyzed');
      return deps;
    }
    
    return { message: 'Research completed' };
  }
  
  private async findFiles(pattern: string): Promise<string[]> {
    // Implementation using glob or similar
    return [];
  }
  
  private async analyzeFile(file: string, query: string): Promise<any> {
    // Read and analyze file content
    return {};
  }
  
  private async analyzeDependencies(packageJson: string): Promise<any> {
    // Parse and analyze dependencies
    return {};
  }
}
```

## Implementation Worker

The Implementation Worker makes actual code changes.

```typescript
import { Worker } from '../core/Worker';
import { Task } from '../types';

export class ImplementWorker extends Worker {
  protected async executeTask(task: Task, signal: AbortSignal): Promise<any> {
    const { changes } = task.payload;
    const results = [];
    
    for (const change of changes) {
      if (signal.aborted) break;
      
      this.reportProgress(
        task.id, 
        Math.round((results.length / changes.length) * 100),
        `Applying change ${results.length + 1} of ${changes.length}`
      );
      
      try {
        const result = await this.applyChange(change);
        results.push({ success: true, change, result });
      } catch (error) {
        results.push({ 
          success: false, 
          change, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
    
    return { results, totalChanges: changes.length };
  }
  
  private async applyChange(change: any): Promise<any> {
    switch (change.type) {
      case 'edit':
        return this.editFile(change.file, change.edits);
      case 'create':
        return this.createFile(change.file, change.content);
      case 'delete':
        return this.deleteFile(change.file);
      case 'move':
        return this.moveFile(change.from, change.to);
      default:
        throw new Error(`Unknown change type: ${change.type}`);
    }
  }
  
  private async editFile(file: string, edits: any[]): Promise<void> {
    // Read file
    // Apply edits
    // Write back
  }
  
  private async createFile(file: string, content: string): Promise<void> {
    // Create file with content
  }
  
  private async deleteFile(file: string): Promise<void> {
    // Delete file
  }
  
  private async moveFile(from: string, to: string): Promise<void> {
    // Move/rename file
  }
}
```

## Verification Worker

The Verification Worker tests and validates changes.

```typescript
import { Worker } from '../core/Worker';
import { Task } from '../types';

export class VerifyWorker extends Worker {
  protected async executeTask(task: Task, signal: AbortSignal): Promise<any> {
    const { checks } = task.payload;
    const results = [];
    
    for (const check of checks) {
      if (signal.aborted) break;
      
      this.reportProgress(
        task.id,
        Math.round((results.length / checks.length) * 100),
        `Running check: ${check.type}`
      );
      
      const result = await this.runCheck(check);
      results.push(result);
      
      // Stop on first failure if configured
      if (!result.success && check.stopOnFailure) {
        break;
      }
    }
    
    const allPassed = results.every(r => r.success);
    
    return {
      success: allPassed,
      results,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
  }
  
  private async runCheck(check: any): Promise<any> {
    switch (check.type) {
      case 'syntax':
        return this.checkSyntax(check.files);
      case 'test':
        return this.runTests(check.pattern);
      case 'lint':
        return this.runLinter(check.files);
      case 'typecheck':
        return this.runTypeCheck();
      case 'build':
        return this.runBuild();
      default:
        throw new Error(`Unknown check type: ${check.type}`);
    }
  }
  
  private async checkSyntax(files: string[]): Promise<any> {
    // Check syntax of modified files
    return { success: true, type: 'syntax' };
  }
  
  private async runTests(pattern: string): Promise<any> {
    // Run test suite
    return { success: true, type: 'test' };
  }
  
  private async runLinter(files: string[]): Promise<any> {
    // Run linter
    return { success: true, type: 'lint' };
  }
  
  private async runTypeCheck(): Promise<any> {
    // Run TypeScript type checking
    return { success: true, type: 'typecheck' };
  }
  
  private async runBuild(): Promise<any> {
    // Run build process
    return { success: true, type: 'build' };
  }
}
```

## Worker Registration

Create a factory to register workers:

```typescript
import { MessageBus } from '../core/MessageBus';
import { WorkerConfig } from '../types';
import { ResearchWorker } from './ResearchWorker';
import { ImplementWorker } from './ImplementWorker';
import { VerifyWorker } from './VerifyWorker';

export class WorkerFactory {
  static createWorker(
    type: 'research' | 'implement' | 'verify',
    config: WorkerConfig,
    messageBus: MessageBus
  ) {
    switch (type) {
      case 'research':
        return new ResearchWorker(config, messageBus);
      case 'implement':
        return new ImplementWorker(config, messageBus);
      case 'verify':
        return new VerifyWorker(config, messageBus);
      default:
        throw new Error(`Unknown worker type: ${type}`);
    }
  }
}
```

## Worker Pool Management

Create a pool manager for multiple workers:

```typescript
export class WorkerPool {
  private workers = new Map<string, Worker>();
  private messageBus: MessageBus;
  
  constructor(messageBus: MessageBus) {
    this.messageBus = messageBus;
  }
  
  addWorker(worker: Worker): void {
    this.workers.set(worker['config'].id, worker);
  }
  
  removeWorker(workerId: string): void {
    this.workers.delete(workerId);
  }
  
  getWorker(workerId: string): Worker | undefined {
    return this.workers.get(workerId);
  }
  
  getWorkersByType(type: string): Worker[] {
    return Array.from(this.workers.values()).filter(
      w => w['config'].type === type
    );
  }
  
  getAllStatus() {
    return Array.from(this.workers.values()).map(w => w.getStatus());
  }
}
```

## Next Steps

Continue to [04-patterns](../04-patterns) for common multi-agent design patterns.
