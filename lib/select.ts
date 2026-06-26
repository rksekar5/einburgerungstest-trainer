import {
  getGeneralQuestions,
  getStateQuestions,
} from './questions';
import type { Bundesland, Question } from './types';
import { OFFICIAL_EXAM } from './types';
import { isDue, type SrsEntry } from './srs';

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Full practice pool: all general questions plus the chosen state's questions. */
export function buildPracticeSet(bundesland: Bundesland | null): Question[] {
  const state = bundesland ? getStateQuestions(bundesland) : [];
  return shuffle([...getGeneralQuestions(), ...state]);
}

/**
 * Exam set mirroring the official format (30 general + 3 state). With sample
 * data this simply uses as many as exist; the runner scales the pass mark.
 */
export function buildExamSet(bundesland: Bundesland | null): Question[] {
  const general = shuffle(getGeneralQuestions()).slice(0, OFFICIAL_EXAM.generalCount);
  const state = bundesland
    ? shuffle(getStateQuestions(bundesland)).slice(0, OFFICIAL_EXAM.stateCount)
    : [];
  return shuffle([...general, ...state]);
}

/**
 * Adaptive review queue: previously-answered questions that are due again,
 * weakest (lowest Leitner box) first. Unseen questions are not "review".
 */
export function buildReviewSet(
  bundesland: Bundesland | null,
  srs: Record<string, SrsEntry>,
): Question[] {
  const pool = [...getGeneralQuestions(), ...(bundesland ? getStateQuestions(bundesland) : [])];
  const now = new Date();
  return pool
    .filter((q) => srs[q.id] && isDue(srs[q.id], now))
    .sort((a, b) => {
      const boxDiff = srs[a.id].box - srs[b.id].box;
      if (boxDiff !== 0) return boxDiff;
      return srs[a.id].lastSeenISO.localeCompare(srs[b.id].lastSeenISO);
    });
}
