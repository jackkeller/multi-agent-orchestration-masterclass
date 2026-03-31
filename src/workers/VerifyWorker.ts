import { Worker } from '../core/Worker';
import { Task } from '../types';

export class VerifyWorker extends Worker {
  protected async executeTask(task: Task, signal: AbortSignal): Promise<any> {
    const { checks } = task.payload;
    const results = [];
    
    this.log(`Starting verification with ${checks?.length || 0} checks`);
    
    for (let i = 0; i < (checks?.length || 0); i++) {
      if (signal.aborted) {
        throw new Error('Task cancelled');
      }
      
      const check = checks[i];
      const progress = Math.round(((i + 1) / checks.length) * 100);
      
      this.reportProgress(
        task.id,
        progress,
        `Running check: ${check.type}`
      );
      
      const result = await this.runCheck(check);
      results.push(result);
      
      this.log(`${check.type} check: ${result.success ? 'PASSED' : 'FAILED'}`, result);
      
      // Stop on first failure if configured
      if (!result.success && check.stopOnFailure) {
        this.reportProgress(task.id, 100, 'Verification stopped due to failure');
        break;
      }
      
      // Simulate work
      await this.simulateWork(400);
    }
    
    const allPassed = results.every(r => r.success);
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    this.reportProgress(task.id, 100, allPassed ? 'All checks passed' : `${failed} check(s) failed`);
    
    return {
      success: allPassed,
      results,
      passed,
      failed,
      summary: `${passed}/${results.length} checks passed`
    };
  }
  
  private async runCheck(check: any): Promise<any> {
    switch (check.type) {
      case 'syntax':
        return await this.checkSyntax(check.files);
      case 'test':
        return await this.runTests(check.pattern, check.coverage);
      case 'lint':
        return await this.runLinter(check.files, check.rules);
      case 'typecheck':
        return await this.runTypeCheck(check.strict);
      case 'build':
        return await this.runBuild(check.target);
      case 'security':
        return await this.runSecurityCheck(check.level);
      default:
        return { success: false, type: check.type, error: `Unknown check type: ${check.type}` };
    }
  }
  
  private async checkSyntax(files: string[]): Promise<any> {
    // Simulate syntax check
    await this.simulateWork(300);
    const errors = Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0;
    return { 
      success: errors === 0, 
      type: 'syntax',
      files: files?.length || 0,
      errors
    };
  }
  
  private async runTests(pattern: string, coverage?: boolean): Promise<any> {
    // Simulate test run
    await this.simulateWork(800);
    const tests = Math.floor(Math.random() * 50) + 10;
    const passed = Math.floor(tests * (0.9 + Math.random() * 0.1));
    return { 
      success: passed === tests, 
      type: 'test',
      total: tests,
      passed,
      failed: tests - passed,
      coverage: coverage ? Math.floor(Math.random() * 30) + 70 : undefined
    };
  }
  
  private async runLinter(files: string[], rules?: string[]): Promise<any> {
    // Simulate linting
    await this.simulateWork(400);
    const warnings = Math.floor(Math.random() * 10);
    const errors = Math.random() > 0.9 ? Math.floor(Math.random() * 3) : 0;
    return { 
      success: errors === 0, 
      type: 'lint',
      files: files?.length || 0,
      warnings,
      errors
    };
  }
  
  private async runTypeCheck(strict?: boolean): Promise<any> {
    // Simulate type checking
    await this.simulateWork(600);
    const errors = Math.random() > 0.85 ? Math.floor(Math.random() * 5) : 0;
    return { 
      success: errors === 0, 
      type: 'typecheck',
      errors,
      strict
    };
  }
  
  private async runBuild(target?: string): Promise<any> {
    // Simulate build
    await this.simulateWork(1000);
    const success = Math.random() > 0.1;
    return { 
      success, 
      type: 'build',
      target,
      duration: success ? Math.floor(Math.random() * 5000) + 2000 : undefined,
      error: success ? undefined : 'Build failed: Module not found'
    };
  }
  
  private async runSecurityCheck(level: string = 'standard'): Promise<any> {
    // Simulate security check
    await this.simulateWork(500);
    const vulnerabilities = Math.random() > 0.9 ? Math.floor(Math.random() * 3) : 0;
    return { 
      success: vulnerabilities === 0, 
      type: 'security',
      level,
      vulnerabilities
    };
  }
  
  private simulateWork(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
