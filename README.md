# Multi-Agent Orchestration Masterclass

A comprehensive guide to building multi-agent systems from scratch, based on production patterns from Claude Code and OpenClaw.

## Overview

This masterclass teaches you how to build multi-agent orchestration systems that can:
- Spawn and manage multiple worker agents in parallel
- Coordinate complex tasks across distributed agents
- Share state and communicate between agents
- Handle failures and retries gracefully
- Scale from single-machine to distributed deployments

## Architecture Reference

Based on Claude Code's Coordinator Mode and OpenClaw's subagent system:

```
┌─────────────────────────────────────────────────────────────┐
│                    COORDINATOR AGENT                        │
│  - Receives high-level tasks                                │
│  - Breaks down into subtasks                                │
│  - Spawns worker agents                                     │
│  - Synthesizes results                                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Worker 1│  │ Worker 2│  │ Worker 3│
│Research │  │Research │  │Research │
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
     └────────────┼────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │   SYNTHESIS     │
         │  Coordinator    │
         │  reads findings │
         │  crafts specs   │
         └────────┬────────┘
                  │
     ┌────────────┼────────────┐
     │            │            │
     ▼            ▼            ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Worker 4│  │ Worker 5│  │ Worker 6│
│Implement│  │Implement│  │Implement│
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
     └────────────┼────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  VERIFICATION   │
         │  Workers test   │
         │  changes work   │
         └─────────────────┘
```

## Course Structure

1. **Fundamentals** - Core concepts and patterns
2. **Implementation** - Building the orchestrator from scratch
3. **Communication** - Inter-agent messaging and state sharing
4. **Patterns** - Common multi-agent design patterns
5. **Production** - Scaling, monitoring, and error handling
6. **Projects** - Real-world implementations

## Quick Start

```bash
cd 01-fundamentals
npm install
npm run example:01-basic-orchestrator
```

## Key Principles

1. **Parallelism is your superpower** - Workers are async, launch independent workers concurrently
2. **Don't serialize work that can run simultaneously**
3. **Read actual findings** - Don't say "based on your findings", read and specify exactly what to do
4. **Shared scratchpad** - Cross-worker durable knowledge sharing
5. **Color assignments** - Visual distinction for different agent types

## License

MIT
