import { Worker } from '../core/Worker';
import { Task } from '../types';

export class ImplementWorker extends Worker {
  protected async executeTask(task: Task, signal: AbortSignal): Promise<any> {
    const { changes } = task.payload;
    const results = [];
    
    this.log(`Starting implementation of ${changes?.length || 0} changes`);
    
    for (let i = 0; i < (changes?.length || 0); i++) {
      if (signal.aborted) {
        throw new Error('Task cancelled');
      }
      
      const change = changes[i];
      const progress = Math.round(((i + 1) / changes.length) * 100);
      
      this.reportProgress(
        task.id, 
        progress,
        `Applying change ${i + 1} of ${changes.length}: ${change.type}`
      );
      
      try {
        const result = await this.applyChange(change);
        results.push({ success: true, change: change.type, file: change.file, result });
        this.log(`Applied ${change.type} to ${change.file}`);
      } catch (error) {
        results.push({ 
          success: false, 
          change: change.type, 
          file: change.file,
          error: error instanceof Error ? error.message : String(error) 
        });
        this.log(`Failed to apply ${change.type} to ${change.file}: ${error}`);
      }
      
      // Simulate work
      await this.simulateWork(500);
    }
    
    const allSuccessful = results.every(r => r.success);
    
    this.reportProgress(task.id, 100, allSuccessful ? 'Implementation complete' : 'Implementation complete with errors');
    
    return { 
      results, 
      totalChanges: changes.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
  }
  
  private async applyChange(change: any): Promise<any> {
    switch (change.type) {
      case 'edit':
        return await this.editFile(change.file, change.edits);
      case 'create':
        return await this.createFile(change.file, change.content);
      case 'delete':
        return await this.deleteFile(change.file);
      case 'move':
        return await this.moveFile(change.from, change.to);
      case 'refactor':
        return await this.refactorFile(change.file, change.transformations);
      default:
        throw new Error(`Unknown change type: ${change.type}`);
    }
  }
  
  private async editFile(file: string, edits: any[]): Promise<{linesChanged: number}> {
    // Simulate file edit
    await this.simulateWork(300);
    return { linesChanged: edits.length * 5 };
  }
  
  private async createFile(file: string, content: string): Promise<{size: number}> {
    // Simulate file creation
    await this.simulateWork(200);
    return { size: content.length };
  }
  
  private async deleteFile(file: string): Promise<{deleted: boolean}> {
    // Simulate file deletion
    await this.simulateWork(100);
    return { deleted: true };
  }
  
  private async moveFile(from: string, to: string): Promise<{from: string; to: string}> {
    // Simulate file move
    await this.simulateWork(150);
    return { from, to };
  }
  
  private async refactorFile(file: string, transformations: any[]): Promise<{transformationsApplied: number}> {
    // Simulate refactoring
    await this.simulateWork(400);
    return { transformationsApplied: transformations.length };
  }
  
  private simulateWork(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
