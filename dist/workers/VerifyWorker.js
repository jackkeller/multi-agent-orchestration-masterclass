"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyWorker = void 0;
const Worker_1 = require("../core/Worker");
class VerifyWorker extends Worker_1.Worker {
    async executeTask(task, signal) {
        const { checks } = task.payload;
        const results = [];
        this.log(`Starting verification with ${checks?.length || 0} checks`);
        for (let i = 0; i < (checks?.length || 0); i++) {
            if (signal.aborted) {
                throw new Error('Task cancelled');
            }
            const check = checks[i];
            const progress = Math.round(((i + 1) / checks.length) * 100);
            this.reportProgress(task.id, progress, `Running check: ${check.type}`);
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
    async runCheck(check) {
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
    async checkSyntax(files) {
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
    async runTests(pattern, coverage) {
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
    async runLinter(files, rules) {
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
    async runTypeCheck(strict) {
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
    async runBuild(target) {
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
    async runSecurityCheck(level = 'standard') {
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
    simulateWork(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.VerifyWorker = VerifyWorker;
//# sourceMappingURL=VerifyWorker.js.map