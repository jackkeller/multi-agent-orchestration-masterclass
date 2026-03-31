# Module 4: Multi-Agent Design Patterns

## Overview

This module covers common patterns for multi-agent orchestration.

## Pattern 1: Map-Reduce

Distribute work across many workers, then aggregate results.

```typescript
class MapReducePattern {
  async execute(
    items: any[],
    mapFn: (item: any) => Promise<any>,
    reduceFn: (results: any[]) => any
  ): Promise<any> {
    // Map phase: Process items in parallel
    const results = await Promise.all(
      items.map(item => mapFn(item))
    );
    
    // Reduce phase: Aggregate results
    return reduceFn(results);
  }
}

// Example: Code review all files
async function reviewAllFiles(files: string[]) {
  const pattern = new MapReducePattern();
  
  return await pattern.execute(
    files,
    async (file) => {
      // Each worker reviews one file
      return await reviewFile(file);
    },
    (reviews) => {
      // Aggregate all reviews
      return {
        totalFiles: reviews.length,
        issuesFound: reviews.flatMap(r => r.issues),
        summary: generateSummary(reviews)
      };
    }
  );
}
```

## Next Steps

Continue to [05-production](../05-production) for scaling and monitoring.
