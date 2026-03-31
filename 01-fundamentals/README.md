# Module 1: Multi-Agent Fundamentals

## Learning Objectives

By the end of this module, you will understand:
- What multi-agent orchestration is and when to use it
- Core concepts: Coordinators, Workers, Tasks, Shared State
- The difference between sequential and parallel execution
- Communication patterns between agents

## Core Concepts

### 1. The Coordinator Pattern

The Coordinator is the "brain" of the multi-agent system:

```typescript
interface Coordinator {
  // Receives high-level task from user
  receiveTask(task: Task): void;
  
  // Breaks down into subtasks
  decomposeTask(task: Task): SubTask[];
  
  // Spawns workers for subtasks
  spawnWorkers(subtasks: SubTask[]): Worker[];
  
  // Collects and synthesizes results
  synthesizeResults(results: Result[]): FinalResult;
}
```

### 2. Worker Agents

Workers are specialized agents that execute specific tasks:

```typescript
interface Worker {
  id: string;
  type: WorkerType; // 'research' | 'implement' | 'verify'
  status: WorkerStatus;
  
  // Execute assigned task
  execute(task: SubTask): Promise<Result>;
  
  // Report progress to coordinator
  reportProgress(progress: Progress): void;
}
```

### 3. Task Types

**Research Tasks**: Investigate, analyze, gather information
- Find files in codebase
- Analyze dependencies
- Research solutions

**Implementation Tasks**: Make changes, write code
- Edit files
- Create new components
- Refactor code

**Verification Tasks**: Test, validate, confirm
- Run tests
- Check for errors
- Validate outputs

## Execution Phases

Based on Claude Code's coordinator pattern:

### Phase 1: Research (Parallel)
Multiple workers investigate different aspects simultaneously

### Phase 2: Synthesis (Coordinator)
Coordinator reads findings, understands the problem, creates implementation specs

### Phase 3: Implementation (Parallel)
Workers make targeted changes based on specs

### Phase 4: Verification (Parallel)
Workers test that changes work correctly

## Key Principles

### Principle 1: Parallelism is Your Superpower

```typescript
// ❌ DON'T: Sequential execution
for (const task of tasks) {
  await worker.execute(task); // Wait for each to finish
}

// ✅ DO: Parallel execution
const results = await Promise.all(
  tasks.map(task => worker.execute(task))
);
```

### Principle 2: Workers Are Async

Workers run independently and report back:

```typescript
// Workers notify coordinator when done
worker.onComplete = (result) => {
  coordinator.receiveResult(worker.id, result);
};

// Coordinator doesn't block waiting
spawnWorker(task); // Returns immediately
```

### Principle 3: Shared Scratchpad

Workers share knowledge via a durable scratchpad:

```typescript
interface Scratchpad {
  // Write findings for other workers
  write(key: string, value: any): void;
  
  // Read what other workers discovered
  read(key: string): any;
  
  // Append to shared log
  appendLog(entry: LogEntry): void;
}
```

### Principle 4: Specify, Don't Delegate

```typescript
// ❌ DON'T: Vague delegation
"Based on your findings, implement the feature"

// ✅ DO: Specific instructions
"Research findings show we need:
 1. Add auth middleware to src/middleware/
 2. Update User model in src/models/
 3. Create login endpoint in src/routes/
 
 Implement these three changes"
```

## When to Use Multi-Agent

### ✅ Good Use Cases

1. **Large Refactors**: Multiple files need coordinated changes
2. **Feature Implementation**: Research + implement + test pipeline
3. **Codebase Analysis**: Understand large, unfamiliar codebases
4. **Bug Fixes**: Multiple potential root causes to investigate
5. **Documentation**: Generate docs from multiple source files

### ❌ Don't Use For

1. **Simple edits**: Single file changes
2. **Trivial tasks**: One-step operations
3. **Sequential dependencies**: Tasks that must happen in strict order
4. **Small codebases**: Overhead not worth it

## Communication Patterns

### Pattern 1: Direct Messaging

```typescript
// Worker sends message to coordinator
worker.sendMessage({
  to: 'coordinator',
  type: 'task_complete',
  payload: result
});
```

### Pattern 2: Pub/Sub

```typescript
// Workers publish to topics
eventBus.publish('research.complete', findings);

// Coordinator subscribes
eventBus.subscribe('research.complete', handleResearchComplete);
```

### Pattern 3: Shared State

```typescript
// Workers read/write shared state
sharedState.set('findings', [...currentFindings, newFinding]);

// Coordinator monitors state changes
sharedState.onChange('findings', (findings) => {
  if (findings.length === expectedCount) {
    synthesizeAndProceed();
  }
});
```

## Error Handling

### Worker Failure Strategies

1. **Retry**: Retry failed task N times
2. **Fallback**: Assign to different worker
3. **Abort**: Stop entire orchestration
4. **Continue**: Log error, continue with other workers

```typescript
interface FailurePolicy {
  maxRetries: number;
  fallbackWorkers?: string[];
  onFailure: 'retry' | 'fallback' | 'abort' | 'continue';
}
```

## Next Steps

Continue to [02-implementation](../02-implementation) where we'll build a working orchestrator from scratch.
