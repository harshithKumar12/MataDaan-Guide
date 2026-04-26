import { describe, it, expect } from 'vitest';
import { detectStepFromText } from '../lib/electionUtils';

describe('detectStepFromText', () => {
  it('detects registration step correctly', () => {
    expect(detectStepFromText('I want to register for voter id')).toBe(0);
  });

  it('detects voting step with polling booth keyword', () => {
    expect(detectStepFromText('Where is my polling booth for the vote?')).toBe(3);
  });

  it('prefers later stages when multiple keywords are present', () => {
    // Both 'register' (0) and 'vote' (3) are present.
    expect(detectStepFromText('I registered but I want to know how to vote')).toBe(3);
  });

  it('returns -1 for unrelated text', () => {
    expect(detectStepFromText('Hello, how is the weather?')).toBe(-1);
  });

  it('detects results stage', () => {
    expect(detectStepFromText('When will the winners be declared?')).toBe(5);
  });
});
