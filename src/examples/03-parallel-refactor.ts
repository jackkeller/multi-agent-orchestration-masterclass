import { MessageBus } from '../core/MessageBus';
import { Coordinator } from '../core/Coordinator';
import { ResearchWorker } from '../workers/ResearchWorker';
import { ImplementWorker } from '../workers/ImplementWorker';
import { VerifyWorker } from '../workers/VerifyWorker';
import { Task } from '../types';

/**
 * Example 3: Parallel Refactoring
 * 
 * Demonstrates Divide and Conquer pattern:
 * - Breaks large refactoring into chunks
 * - Processes chunks in parallel
 * - Combines results
 */

async function runParallelRefactor() {
  console.log('═══════════════════════════════════════════');
  console.log('  Multi-Agent Orchestration - Example 3');
  console.log('  Parallel Refactoring');
  console.log('═══════════════════════════════════════════\n');

  const messageBus = new MessageBus();
  const coordinator = new Coordinator(messageBus, {
    maxParallelWorkers: 6,
    defaultTimeoutMs: 60000
  });

  // Create workers
  const researchWorker = new ResearchWorker(
    { id: 'researcher', type: 'research', maxConcurrentTasks: 5, timeoutMs: 10000 },
    messageBus
  );
  coordinator.registerWorker({ id: 'researcher', type: 'research', maxConcurrentTasks: 5, timeoutMs: 10000 });

  // Multiple implement workers for parallel refactoring
  for (let i = 1; i <= 3; i++) {
    new ImplementWorker(
      { id: `implementer-${i}`, type: 'implement', maxConcurrentTasks: 2, timeoutMs: 15000 },
      messageBus
    );
    coordinator.registerWorker({ id: `implementer-${i}`, type: 'implement', maxConcurrentTasks: 2, timeoutMs: 15000 });
  }

  const verifyWorker = new VerifyWorker(
    { id: 'verifier', type: 'verify', maxConcurrentTasks: 5, timeoutMs: 20000 },
    messageBus
  );
  coordinator.registerWorker({ id: 'verifier', type: 'verify', maxConcurrentTasks: 5, timeoutMs: 20000 });

  // Define files to refactor (simulating a large codebase)
  const filesToRefactor = [
    'src/components/Button.tsx',
    'src/components/Input.tsx',
    'src/components/Modal.tsx',
    'src/utils/helpers.ts',
    'src/utils/validation.ts',
    'src/hooks/useAuth.ts',
    'src/hooks/useData.ts',
    'src/services/api.ts',
    'src/services/cache.ts'
  ];

  console.log(`📝 Refactoring ${filesToRefactor.length} files in parallel\n`);

  // Phase 1: Quick research on all files
  console.log('═══════════════════════════════════════════');
  console.log('  PHASE 1: RESEARCH');
  console.log('═══════════════════════════════════════════\n');
  
  const researchTasks: Task[] = filesToRefactor.map((file, index) => ({
    id: `research-${index}`,
    type: 'research',
    description: `Research ${file}`,
    payload: { 
      target: { type: 'file-analysis', file },
      query: 'refactoring opportunities'
    },
    priority: 1
  }));
  
  const researchResults = await coordinator.orchestrate('research', researchTasks);
  console.log(`✅ Researched ${researchResults.results.length} files\n`);

  // Phase 2: Divide into chunks and refactor in parallel
  console.log('═══════════════════════════════════════════');
  console.log('  PHASE 2: PARALLEL REFACTORING');
  console.log('═══════════════════════════════════════════\n');
  
  // Chunk files into groups
  const chunkSize = 3;
  const chunks: string[][] = [];
  for (let i = 0; i < filesToRefactor.length; i += chunkSize) {
    chunks.push(filesToRefactor.slice(i, i + chunkSize));
  }
  
  console.log(`🔄 Processing ${chunks.length} chunks in parallel\n`);
  
  const implementTasks: Task[] = chunks.map((chunk, index) => ({
    id: `refactor-chunk-${index}`,
    type: 'implement',
    description: `Refactor chunk ${index + 1}/${chunks.length}`,
    payload: {
      changes: chunk.map(file => ({
        type: 'refactor',
        file,
        transformations: ['extract-function', 'simplify-conditionals', 'add-types']
      }))
    },
    priority: 1
  }));
  
  const implementResults = await coordinator.orchestrate('implementation', implementTasks);
  
  // Combine results
  const totalChanges = implementResults.results.reduce((sum, r) => sum + (r.data?.totalChanges || 0), 0);
  const successfulChanges = implementResults.results.reduce((sum, r) => sum + (r.data?.successful || 0), 0);
  
  console.log(`✅ Applied ${successfulChanges}/${totalChanges} changes\n`);

  // Phase 3: Verify all changes
  console.log('═══════════════════════════════════════════');
  console.log('  PHASE 3: VERIFICATION');
  console.log('═══════════════════════════════════════════\n');
  
  const verifyTasks: Task[] = [
    {
      id: 'verify-syntax-all',
      type: 'verify',
      description: 'Verify syntax of all refactored files',
      payload: {
        checks: [
          { type: 'syntax', files: filesToRefactor },
          { type: 'typecheck', strict: true }
        ]
      },
      priority: 1
    },
    {
      id: 'verify-tests',
      type: 'verify',
      description: 'Run affected tests',
      payload: {
        checks: [
          { type: 'test', pattern: '**/*.{test,spec}.{ts,tsx}' }
        ]
      },
      priority: 1
    },
    {
      id: 'verify-build',
      type: 'verify',
      description: 'Verify build',
      payload: {
        checks: [
          { type: 'lint', files: filesToRefactor },
          { type: 'build' }
        ]
      },
      priority: 2
    }
  ];
  
  const verifyResults = await coordinator.orchestrate('verification', verifyTasks);

  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log('  REFACTORING SUMMARY');
  console.log('═══════════════════════════════════════════\n');
  
  console.log(`📁 Files Refactored: ${filesToRefactor.length}`);
  console.log(`🔧 Total Changes: ${totalChanges}`);
  console.log(`✅ Successful: ${successfulChanges}`);
  console.log(`📊 Success Rate: ${Math.round((successfulChanges / totalChanges) * 100)}%`);
  console.log(`⏱️  Total Duration: ${researchResults.durationMs + implementResults.durationMs + verifyResults.durationMs}ms`);
  console.log(`🤖 Workers Used: 5 (3 implementers + 1 researcher + 1 verifier)`);
  console.log(`🚀 Parallel Chunks: ${chunks.length}`);
  
  const allChecks = verifyResults.results.flatMap(r => r.data?.results || []);
  const passedChecks = allChecks.filter((c: any) => c.success).length;
  console.log(`✅ Verification: ${passedChecks}/${allChecks.length} checks passed`);
  
  console.log('\n═══════════════════════════════════════════');
  console.log('  Refactoring Complete!');
  console.log('═══════════════════════════════════════════\n');
}

runParallelRefactor().catch(console.error);
