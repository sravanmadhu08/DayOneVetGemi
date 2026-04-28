export type ReviewQuality = 'again' | 'hard' | 'good' | 'easy';

export interface SRSData {
  interval: number; // in days
  ease: number;
  consecutiveCorrect: number;
}

export function calculateNextReview(
  quality: ReviewQuality,
  currentData: SRSData = { interval: 0, ease: 2.5, consecutiveCorrect: 0 }
): SRSData {
  let { interval, ease, consecutiveCorrect } = currentData;

  if (quality === 'again') {
    return {
      interval: 0, // Review again soon (could be minutes, but here we say 0 for "today/next session")
      ease: Math.max(1.3, ease - 0.2),
      consecutiveCorrect: 0
    };
  }

  // Map quality to numeric value for SM-2
  // hard: 3, good: 4, easy: 5
  const qMap = {
    hard: 3,
    good: 4,
    easy: 5
  };
  const q = qMap[quality];

  // Update ease factor
  ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  ease = Math.max(1.3, ease);

  if (consecutiveCorrect === 0) {
    interval = 1;
  } else if (consecutiveCorrect === 1) {
    interval = 6;
  } else {
    interval = Math.round(interval * ease);
  }

  return {
    interval,
    ease,
    consecutiveCorrect: consecutiveCorrect + 1
  };
}
