import { MessageBus } from '../core/MessageBus';
import { Coordinator } from '../core/Coordinator';
import { ResearchWorker } from '../workers/ResearchWorker';
import { ImplementWorker } from '../workers/ImplementWorker';
import { VerifyWorker } from '../workers/VerifyWorker';
import { Task } from '../types';

/**
 * Example 1: Basic Orchestrator
 * 
 * Demonstrates the core multi-agent orchestration pattern:
 * 1. Research phase - Multiple workers gather information
 * 2. Synthesis - Coordinator processes findings
 * 3. Implementation phase - Workers make changes
 * 4. Verification phase - Workers validate changes
 */

async function runBasicOrchestrator() {
  console.log('═══════════════════════════════════════════');
  console.log('  Multi-Agent Orchestration - Example 1');
  console.log('  Basic Orchestrator');
  console.log('═══════════════════════════════════════════\n');

  // Create message bus for inter-agent communication
  const messageBus = new MessageBus();
  
  // Create coordinator
  const coordinator = new Coordinator(messageBus, {
    maxParallelWorkers: 4,
    defaultTimeoutMs: 30000
  });

  // Create and register workers
  console.log('🤖 Creating workers...\n');
  
  const researchWorker1 = new ResearchWorker(
    { id: 'researcher-1', type: 'research', maxConcurrentTasks: 2, timeoutMs: 10000 },
    messageBus
  );
  coordinator.registerWorker({ id: 'researcher-1', type: 'research', maxConcurrentTasks: 2, timeoutMs: 10000 });
  
  const researchWorker2 = new ResearchWorker(
    { id: 'researcher-2', type: 'research', maxConcurrentTasks: 2, timeoutMs: 10000 },
    messageBus
  );
  coordinator.registerWorker({ id: 'researcher-2', type: 'research', maxConcurrentTasks: 2, timeoutMs: 10000 });
  
  const implementWorker = new ImplementWorker(
    { id: 'implementer-1', type: 'implement', maxConcurrentTasks: 2, timeoutMs: 15000 },
    messageBus
  );
  coordinator.registerWorker({ id: 'implementer-1', type: 'implement', maxConcurrentTasks: 2, timeoutMs: 15000 });
  
  const verifyWorker = new VerifyWorker(
    { id: 'verifier-1', type: 'verify', maxConcurrentTasks: 3, timeoutMs: 20000 },
    messageBus
  );
  coordinator.registerWorker({ id: 'verifier-1', type: 'verify', maxConcurrentTasks: 3, timeoutMs: 20000 });

  // Phase 1: Research
  console.log('═══════════════════════════════════════════');
  console.log('  PHASE 1: RESEARCH');
  console.log('═══════════════════════════════════════════\n');
  
  const researchTasks: Task[] = [
    {
      id: 'research-files',
      type: 'research',
      description: 'Find and analyze source files',
      payload: { 
        target: { type: 'file-pattern', pattern: '**/*.ts' },
        query: 'analyze complexity and dependencies'
      },
      priority: 1
    },
    {
      id: 'research-deps',
      type: 'research',
      description: 'Analyze project dependencies',
      payload: { 
        target: { type: 'dependencies', packageJson: 'package.json' }
      },
      priority: 1
    }
  ];
  
  const researchResults = await coordinator.orchestrate('research', researchTasks);
  console.log('Research Results:', JSON.stringify(researchResults.results.map(r => ({
    taskId: r.taskId,
    success: r.success,
    duration: r.durationMs + 'ms'
  })), null, 2));

  // Phase 2: Synthesis (simulated - coordinator would do this)
  console.log('\n═══════════════════════════════════════════');
  console.log('  PHASE 2: SYNTHESIS');
  console.log('═══════════════════════════════════════════\n');
  
  console.log('🧠 Coordinator synthesizing research findings...');
  console.log('   - Analyzed ' + researchResults.results[0]?.data?.files?.length + ' source files');
  console.log('   - Found ' + researchResults.results[1]?.data?.direct + ' direct dependencies');
  console.log('   - Identified refactoring opportunities\n');

  // Phase 3: Implementation
  console.log('═══════════════════════════════════════════');
  console.log('  PHASE 3: IMPLEMENTATION');
  console.log('═══════════════════════════════════════════\n');
  
  const implementationTasks: Task[] = [
    {
      id: 'implement-refactor-1',
      type: 'implement',
      description: 'Refactor complex functions',
      payload: {
        changes: [
          { type: 'refactor', file: 'src/utils/helpers.ts', transformations: ['extract-function', 'simplify'] },
          { type: 'edit', file: 'src/components/Button.tsx', edits: [{ line: 45, action: 'replace' }] }
        ]
      },
      priority: 1
    },
    {
      id: 'implement-new-feature',
      type: 'implement',
      description: 'Add new utility module',
      payload: {
        changes: [
          { type: 'create', file: 'src/utils/newFeature.ts', content: '// New feature implementation' }
        ]
      },
      priority: 2
    }
  ];
  
  const implementationResults = await coordinator.orchestrate('implementation', implementationTasks);
  console.log('Implementation Results:', JSON.stringify(implementationResults.results.map(r => ({
    taskId: r.taskId,
    success: r.success,
    changes: r.data?.totalChanges,
    duration: r.durationMs + 'ms'
  })), null, 2));

  // Phase 4: Verification
  console.log('\n═══════════════════════════════════════════');
  console.log('  PHASE 4: VERIFICATION');
  console.log('═══════════════════════════════════════════\n');
  
  const verificationTasks: Task[] = [
    {
      id: 'verify-syntax',
      type: 'verify',
      description: 'Check syntax of modified files',
      payload: {
        checks: [
          { type: 'syntax', files: ['src/utils/helpers.ts', 'src/components/Button.tsx'] },
          { type: 'typecheck', strict: true }
        ]
      },
      priority: 1
    },
    {
      id: 'verify-tests',
      type: 'verify',
      description: 'Run test suite',
      payload: {
        checks: [
          { type: 'test', pattern: '**/*.test.ts', coverage: true }
        ]
      },
      priority: 1
    },
    {
      id: 'verify-build',
      type: 'verify',
      description: 'Verify build succeeds',
      payload: {
        checks: [
          { type: 'build', target: 'production' },
          { type: 'security', level: 'standard' }
        ]
      },
      priority: 2
    }
  ];
  
  const verificationResults = await coordinator.orchestrate('verification', verificationTasks);
  console.log('Verification Results:', JSON.stringify(verificationResults.results.map(r => ({
    taskId: r.taskId,
    success: r.success,
    checks: r.data?.summary,
    duration: r.durationMs + 'ms'
  })), null, 2));

  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log('  EXECUTION SUMMARY');
  console.log('═══════════════════════════════════════════\n');
  
  const allResults = [
    ...researchResults.results,
    ...implementationResults.results,
    ...verificationResults.results
  ];
  
  const totalTasks = allResults.length;
  const successfulTasks = allResults.filter(r => r.success).length;
  const totalDuration = researchResults.durationMs + 
                       implementationResults.durationMs + 
                       verificationResults.durationMs;
  
  console.log(`✅ Total Tasks: ${totalTasks}`);
  console.log(`✅ Successful: ${successfulTasks}`);
  console.log(`❌ Failed: ${totalTasks - successfulTasks}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);
  console.log(`🤖 Workers Used: 4`);
  console.log(`📊 Success Rate: ${Math.round((successfulTasks / totalTasks) * 100)}%`);
  
  console.log('\n═══════════════════════════════════════════');
  console.log('  Example Complete!');
  console.log('═══════════════════════════════════════════\n');
}

// Run the example
runBasicOrchestrator().catch(console.error);
