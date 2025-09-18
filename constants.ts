export const PRIORITY_WEIGHTS = {
  [ 'High' as const]: 0.4,
  [ 'Medium' as const]: 0.3,
  [ 'Low' as const]: 0.2,
  [ 'Unset' as const]: 0.1,
};

// FIX: Add constants for srsPreview.ts
export const AGAIN_INTERVAL = 1; // 1 minute
export const HARD_INTERVAL = 5; // 5 minutes
export const GOOD_INTERVAL = 10; // 10 minutes
export const GRADUATING_INTERVAL = 1 * 24 * 60; // 1 day
export const EASY_GRADUATING_INTERVAL = 4 * 24 * 60; // 4 days
