# Multi-Agent Orchestration Masterclass - Complete

## Overview

A comprehensive masterclass on building multi-agent orchestration systems from scratch, based on production patterns from Claude Code and OpenClaw.

## Course Structure

### Module 1: Fundamentals
- Core concepts: Coordinators, Workers, Tasks
- Communication patterns
- Error handling strategies
- When to use multi-agent

### Module 2: Implementation
- Building the Message Bus
- Creating the Coordinator
- Implementing the Worker base class
- Task scheduling and management

### Module 3: Worker Types
- Research Worker: Investigation and analysis
- Implementation Worker: Code changes
- Verification Worker: Testing and validation
- Worker pools and factories

### Module 4: Design Patterns
- Map-Reduce: Parallel processing with aggregation
- Pipeline: Chained worker execution
- Fan-Out/Fan-In: Distribute and collect
- Competitive: Multiple strategies, best wins
- Divide and Conquer: Recursive task breakdown
- Hierarchical: Multi-level coordination
- Probabilistic: Uncertainty-based execution
- Workflow: Pre-defined process flows

### Module 5: Production
- Error handling and retry strategies
- Circuit breaker pattern
- Metrics and monitoring
- Auto-scaling worker pools
- Security and sandboxing

### Module 6: Projects
- Codebase Analysis System
- Automated Refactoring Pipeline
- Multi-Agent Coding Competition
- Real-world implementations

## Key Principles

1. **Parallelism is your superpower** - Workers are async, launch independent workers concurrently
2. **Don't serialize work that can run simultaneously**
3. **Read actual findings** - Don't say "based on your findings", read and specify exactly what to do
4. **Shared scratchpad** - Cross-worker durable knowledge sharing
5. **Color assignments** - Visual distinction for different agent types

## Architecture

```
User Request → Coordinator → Workers (parallel) → Results → Synthesis → Output
```

**Phases:**
1. **Research**: Multiple workers investigate
2. **Synthesis**: Coordinator reads findings, crafts specs
3. **Implementation**: Workers make changes
4. **Verification**: Workers test changes

## Quick Start

```bash
cd 02-implementation
npm install
npm run build

# Run examples
cd examples
node 01-basic-orchestrator.js
```

## File Structure

```
multi-agent-orchestration-masterclass/
├── README.md
├── 01-fundamentals/
│   └── README.md
├── 02-implementation/
│   ├── README.md
│   └── src/
│       ├── core/
│       │   ├── Coordinator.ts
│       │   ├── Worker.ts
│       │   └── MessageBus.ts
│       ├── workers/
│       │   ├── ResearchWorker.ts
│       │   ├── ImplementWorker.ts
│       │   └── VerifyWorker.ts
│       └── types/
│           └── index.ts
├── 03-workers/
│   └── README.md
├── 04-patterns/
│   └── README.md
├── 05-production/
│   └── README.md
├── 06-projects/
│   └── README.md
└── examples/
    ├── 01-basic-orchestrator.ts
    ├── 02-codebase-analysis.ts
    └── 03-parallel-refactor.ts
```

## Resources

- **Claude Code Reference**: https://github.com/Kuberwastaken/claude-code
- **OpenClaw Subagents**: sessions_spawn runtime="subagent"
- **Pattern Documentation**: See individual module READMEs

## License

MIT
