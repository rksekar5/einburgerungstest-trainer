// Adaptive review using a simple Leitner box scheme.
//
// We deliberately chose Leitner over SM-2: the Einbürgerungstest is a one-time
// pass (not lifelong retention), and a multiple-choice answer only yields a
// binary correct/incorrect signal — which maps cleanly onto Leitner boxes
// without inventing a 0-5 quality score. The algorithm decides WHAT to review;
// the AI tutor only ever explains WHY an answer is correct.

export const MAX_BOX = 5;

/** Days a question "rests" in each box before it is due again (index = box-1). */
export const LEITNER_INTERVALS_DAYS = [0, 1, 3, 7, 16] as const;

export interface SrsEntry {
  /** Current Leitner box, 1..MAX_BOX. */
  box: number;
  /** ISO timestamp of the most recent answer. */
  lastSeenISO: string;
  /** Whether the most recent answer was correct. */
  lastCorrect: boolean;
  /** Total times this question has been answered. */
  reps: number;
}

/** Promote on a correct answer (capped), demote straight to box 1 on a miss. */
export function nextBox(currentBox: number, correct: boolean): number {
  if (!correct) return 1;
  return Math.min(currentBox + 1, MAX_BOX);
}

/** A question is due if never seen, last answered wrong, or its interval elapsed. */
export function isDue(entry: SrsEntry | undefined, now: Date = new Date()): boolean {
  if (!entry) return true;
  if (!entry.lastCorrect) return true;
  const interval = LEITNER_INTERVALS_DAYS[Math.min(entry.box, MAX_BOX) - 1] ?? 0;
  const due = new Date(entry.lastSeenISO);
  due.setDate(due.getDate() + interval);
  return now.getTime() >= due.getTime();
}
