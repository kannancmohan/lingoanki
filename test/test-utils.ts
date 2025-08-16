// A simple assertion helper
export function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      // Use a small tolerance for floating point comparisons
      if (typeof actual === 'number' && typeof expected === 'number') {
        if (Math.abs(actual - expected) > 1e-9) {
          throw new Error(`Expected ${actual} to be close to ${expected}`);
        }
      } else if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
      }
    },
    toBeDefined() {
        if(actual === undefined || actual === null) {
            throw new Error(`Expected value to be defined, but got ${actual}`);
        }
    },
    toHaveLength(expected: number) {
        const length = (actual as any)?.length;
        if (length !== expected) {
            throw new Error(`Expected length to be ${expected}, but got ${length}`);
        }
    }
  };
}

export interface TestCase {
    name: string;
    testFn: () => Promise<void> | void;
}
