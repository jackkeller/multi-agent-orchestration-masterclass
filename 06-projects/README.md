# Module 6: Real-World Projects

## Project 1: Codebase Analysis System

Analyze an entire codebase using multiple agents.

```typescript
// Main orchestration
async function analyzeCodebase(repoPath: string) {
  const messageBus = new MessageBus();
  const coordinator = new Coordinator(messageBus);
  
  // Phase 1: Research - Discover all files
  const researchTasks = [
    { id: 'find-source', type: 'research', payload: { pattern: '**/*.ts' } },
    { id: 'find-tests', type: 'research', payload: { pattern: '**/*.test.ts' } },
    { id: 'find-config', type: 'research', payload: { pattern: '*.{json,yaml}' } }
  ];
  
  const researchResults = await coordinator.orchestrate('research', researchTasks);
  
  // Phase 2: Analysis - Analyze each file
  const files = researchResults.results.flatMap(r => r.data.files);
  const analysisTasks = files.map(file => ({
    id: `analyze-${file}`,
    type: 'research',
    payload: { file, query: 'analyze complexity and dependencies' }
  }));
  
  const analysisResults = await coordinator.orchestrate('research', analysisTasks);
  
  // Phase 3: Synthesis
  return synthesizeAnalysis(analysisResults);
}
```

## Project 2: Automated Refactoring

Refactor a large codebase with parallel workers.

```typescript
async function refactorCodebase(tasks: RefactorTask[]) {
  const messageBus = new MessageBus();
  const coordinator = new Coordinator(messageBus);
  
  // Chunk tasks for parallel processing
  const chunks = chunkArray(tasks, 10);
  
  for (const chunk of chunks) {
    // Research current state
    const researchTasks = chunk.map(task => ({
      id: `research-${task.id}`,
      type: 'research',
      payload: task
    }));
    
    await coordinator.orchestrate('research', researchTasks);
    
    // Implement changes
    const implTasks = chunk.map(task => ({
      id: `impl-${task.id}`,
      type: 'implement',
      payload: task
    }));
    
    await coordinator.orchestrate('implementation', implTasks);
    
    // Verify changes
    const verifyTasks = chunk.map(task => ({
      id: `verify-${task.id}`,
      type: 'verify',
      payload: task
    }));
    
    await coordinator.orchestrate('verification', verifyTasks);
  }
}
```

## Project 3: Multi-Agent Coding Competition

Multiple agents solve same problem, best solution wins.

```typescript
async function codingCompetition(requirements: string) {
  const messageBus = new MessageBus();
  const coordinator = new Coordinator(messageBus);
  
  // Spawn multiple implementation workers with different strategies
  const strategies = ['functional', 'oop', 'procedural', 'async-first'];
  
  const tasks = strategies.map(strategy => ({
    id: `implement-${strategy}`,
    type: 'implement',
    payload: { requirements, strategy }
  }));
  
  const results = await coordinator.orchestrate('implementation', tasks);
  
  // Verify all solutions
  const verifyTasks = results.results.map(r => ({
    id: `verify-${r.workerId}`,
    type: 'verify',
    payload: { solution: r.data }
  }));
  
  const verified = await coordinator.orchestrate('verification', verifyTasks);
  
  // Score and select best
  return selectBestSolution(verified.results);
}
```

## Complete Examples

See the `examples/` directory for complete working implementations.

## Next Steps

- Experiment with the examples
- Build your own multi-agent systems
- Contribute patterns back to the community
