# Pre-commit Check Performance Analysis

## Summary of Test Parallelization Approaches

### Original Baseline

- **Total time**: 82.2 seconds
- **Configuration**: Default vitest settings (8 threads)
- **CPU utilization**: ~25%

### Approach 1: Ultra-Parallel (Current Best)

- **Total time**: 35-47 seconds (best: 35.2s)
- **Configuration**:
  - Increased thread pool to 15 threads
  - All tests run in parallel
  - Single vitest instance for UI tests
- **Performance gain**: 55-57% improvement
- **CPU utilization**: ~40-50%

### Approach 2: Split UI Tests

- **Total time**: 72.7 seconds
- **Configuration**:
  - UI tests split into 4 groups by directory
  - Each group runs in separate vitest instance
  - Analytics: 4 tests
  - Settings: 11 tests
  - Clients: 3 tests
  - Others: 4 tests
- **Performance**: Worse than single instance due to vitest startup overhead
- **Key finding**: Each vitest instance has ~20-30s startup overhead

## Test Execution Breakdown

### Unit Tests (427 tests)

- Execution time: 35-49 seconds
- Highly parallelizable with thread pool
- Benefits from increased thread count

### UI Tests (22 tests)

- Execution time: 47-78 seconds
- Individual test duration: 11-47 seconds each
- Heavy component initialization overhead
- Limited parallelization benefit due to:
  - Next.js app bootstrap for each test
  - DOM environment setup
  - Component import overhead

### Type Checking

- Execution time: 36-52 seconds
- CPU-bound task
- Runs in parallel with tests

### Linting

- Execution time: 1.7-2.2 seconds
- Fast, minimal impact

## Individual UI Test Performance

Slowest UI tests:

1. Scheduled Page: 47.4s
2. Analytics Page: 39.8s - 40.2s
3. Clients Page: 37.6s - 40.9s
4. Profile Settings: 36.1s - 39.6s
5. Practice Info Settings: 32.1s - 37.6s

## Key Findings

1. **UI tests are the bottleneck**: Each UI test takes 30-50 seconds just to import a component
2. **Splitting doesn't help**: Vitest startup overhead (20-30s) negates parallelization benefits
3. **Optimal configuration**: Run all tests in single instances with maxed thread pools
4. **CPU utilization**: Even with 15 threads, only reaching 40-50% CPU usage

## Recommendations

### Short-term (Implemented)

✅ Increase thread pool to 15 (from 8)
✅ Run all tests in parallel
✅ Use single vitest instance per test type
✅ Add test count reporting

### Long-term (To Consider)

1. **Convert UI tests to unit tests**: Mock Next.js components instead of full imports
2. **Reduce component initialization**: Lazy load heavy dependencies
3. **Optimize imports**: Use dynamic imports for test-specific code
4. **Consider test sharding**: Split tests across multiple CI runners
5. **Profile component loading**: Identify why imports take 30-50 seconds

## Performance Timeline

- Original: 82.2s
- With 15 threads: 47-78s
- Best achieved: 35.2s (57% improvement)
- Theoretical minimum: ~30s (limited by slowest UI test)

## Scripts Created

1. `scripts/pre-commit-check.ts` - Standard parallel execution
2. `scripts/pre-commit-check-ultra.ts` - Optimized with 15 threads
3. `scripts/pre-commit-check-split-ui.ts` - Experimental UI test splitting
4. `scripts/analyze-ui-test-performance.ts` - Performance analysis tool

## Usage

```bash
# Fastest execution (recommended)
npm run check:ultra

# With integration tests
npm run check:ultra:full

# Analyze test performance
npx tsx scripts/analyze-ui-test-performance.ts
```
