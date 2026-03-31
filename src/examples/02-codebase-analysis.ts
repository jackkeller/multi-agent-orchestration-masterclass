import { MessageBus } from '../core/MessageBus';
import { Coordinator } from '../core/Coordinator';
import { ResearchWorker } from '../workers/ResearchWorker';
import { Task } from '../types';

/**
 * Example 2: Codebase Analysis
 * 
 * Demonstrates Map-Reduce pattern:
 * - Multiple research workers analyze different parts of codebase in parallel
 * - Results are aggregated and synthesized
 */

async function runCodebaseAnalysis() {
  console.log('═══════════════════════════════════════════');
  console.log('  Multi-Agent Orchestration - Example 2');
  console.log('  Codebase Analysis (Map-Reduce Pattern)');
  console.log('═══════════════════════════════════════════\n');

  const messageBus = new MessageBus();
  const coordinator = new Coordinator(messageBus);

  // Create multiple research workers for parallel analysis
  const workers = [
    { id: 'analyzer-1', type: 'research' as const },
    { id: 'analyzer-2', type: 'research' as const },
    { id: 'analyzer-3', type: 'research' as const },
    { id: 'analyzer-4', type: 'research' as const }
  ];

  workers.forEach(w => {
    new ResearchWorker(
      { id: w.id, type: w.type, maxConcurrentTasks: 3, timeoutMs: 15000 },
      messageBus
    );
    coordinator.registerWorker({ id: w.id, type: w.type, maxConcurrentTasks: 3, timeoutMs: 15000 });
  });

  // Define different parts of codebase to analyze (MAP phase)
  console.log('📁 Defining analysis tasks...\n');
  
  const analysisTasks: Task[] = [
    {
      id: 'analyze-src',
      type: 'research',
      description: 'Analyze source code',
      payload: { target: { type: 'file-pattern', pattern: 'src/**/*.ts' }, query: 'complexity analysis' },
      priority: 1
    },
    {
      id: 'analyze-tests',
      type: 'research',
      description: 'Analyze test coverage',
      payload: { target: { type: 'file-pattern', pattern: '**/*.test.ts' }, query: 'coverage analysis' },
      priority: 1
    },
    {
      id: 'analyze-deps',
      type: 'research',
      description: 'Analyze dependencies',
      payload: { target: { type: 'dependencies', packageJson: 'package.json' } },
      priority: 2
    },
    {
      id: 'analyze-config',
      type: 'research',
      description: 'Analyze configuration',
      payload: { target: { type: 'file-pattern', pattern: '*.{json,yaml,yml,js,ts}' }, query: 'config analysis' },
      priority: 2
    }
  ];

  // Run parallel analysis
  console.log('🔍 Running parallel analysis...\n');
  const analysisResults = await coordinator.orchestrate('research', analysisTasks);

  // REDUCE phase: Aggregate results
  console.log('\n📊 Aggregating Results...\n');
  
  const aggregated = analysisResults.results.reduce((acc, result) => {
    if (result.data?.files) {
      acc.totalFiles += result.data.files.length;
      acc.totalComplexity += result.data.analysis?.reduce((sum: number, a: any) => sum + a.complexity, 0) || 0;
    }
    if (result.data?.direct) {
      acc.dependencies = result.data;
    }
    return acc;
  }, { totalFiles: 0, totalComplexity: 0, dependencies: {} as any });

  console.log('═══════════════════════════════════════════');
  console.log('  CODEBASE ANALYSIS REPORT');
  console.log('═══════════════════════════════════════════\n');
  
  console.log(`📁 Total Files Analyzed: ${aggregated.totalFiles}`);
  console.log(`📊 Average Complexity: ${(aggregated.totalComplexity / aggregated.totalFiles).toFixed(2)}/10`);
  console.log(`📦 Direct Dependencies: ${aggregated.dependencies?.direct || 'N/A'}`);
  console.log(`⚠️  Outdated Dependencies: ${aggregated.dependencies?.outdated || 0}`);
  console.log(`⏱️  Analysis Duration: ${analysisResults.durationMs}ms`);
  console.log(`🤖 Workers Used: ${workers.length} (parallel)`);
  console.log(`🚀 Speedup vs Sequential: ~${Math.round((analysisTasks.length * 2000) / analysisResults.durationMs * 10) / 10}x`);
  
  console.log('\n═══════════════════════════════════════════');
  console.log('  Analysis Complete!');
  console.log('═══════════════════════════════════════════\n');
}

runCodebaseAnalysis().catch(console.error);
