import { ELECTION_STEPS } from "../constants";

export function detectStepFromText(text: string): number {
  const lowerText = text.toLowerCase();
  const weights: Record<string, number> = {};

  ELECTION_STEPS.forEach((step) => {
    const keywords = {
      registration: ['register', 'voter id', 'form 6', 'electoral roll', 'apply', 'enroll'],
      verification: ['verify', 'check name', 'nvsp', 'blo', 'search name', 'electoral search'],
      campaigning: ['campaign', 'manifesto', 'candidate', 'party', 'rally', 'promises'],
      voting: ['vote', 'evm', 'polling', 'booth', 'ink', 'vvpat', 'slip'],
      counting: ['count', 'tally', 'machine', 'strong room', 'observer'],
      results: ['result', 'winner', 'declared', 'victory', 'majority']
    }[step.id] || [];

    let score = 0;
    keywords.forEach(k => {
      if (lowerText.includes(k)) score += 1;
    });
    weights[step.id] = score;
  });

  let bestStepIdx = -1;
  let maxScore = 0;
  
  // Iterate in reverse to prefer later stages if scores are equal
  for (let i = ELECTION_STEPS.length - 1; i >= 0; i--) {
    if (weights[ELECTION_STEPS[i].id] > maxScore) {
      maxScore = weights[ELECTION_STEPS[i].id];
      bestStepIdx = i;
    }
  }

  return maxScore > 0 ? bestStepIdx : -1;
}
