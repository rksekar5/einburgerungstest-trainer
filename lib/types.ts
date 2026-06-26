// Core domain types for the Einbürgerungstest Trainer.

export const BUNDESLAENDER = [
  'Baden-Württemberg',
  'Bayern',
  'Berlin',
  'Brandenburg',
  'Bremen',
  'Hamburg',
  'Hessen',
  'Mecklenburg-Vorpommern',
  'Niedersachsen',
  'Nordrhein-Westfalen',
  'Rheinland-Pfalz',
  'Saarland',
  'Sachsen',
  'Sachsen-Anhalt',
  'Schleswig-Holstein',
  'Thüringen',
] as const;

export type Bundesland = (typeof BUNDESLAENDER)[number];

export interface Question {
  /** Stable id, e.g. "g-001" (general) or "berlin-001" (state). */
  id: string;
  /** Display number within its pool. */
  number: number;
  /** Topic category, used as the primary "similar question" signal. */
  category: string;
  /** null = general catalogue (the 300); otherwise a state-specific question. */
  bundesland: Bundesland | null;
  /** Question text in German (as in the official exam). */
  questionDe: string;
  /** Optional short English gloss to aid learning. */
  hintEn?: string;
  /** Exactly four answer options, in German. */
  options: [string, string, string, string];
  /** Index (0-3) of the correct option. */
  correctIndex: number;
  /** Optional Blob-hosted image referenced by the question. */
  imageUrl?: string | null;
  /**
   * Marks placeholder/sample data that is NOT the official BAMF catalogue.
   * The full, verified catalogue (300 general + 16x10 state) must be imported
   * from the official source before this app is used for real preparation.
   */
  sample?: boolean;
}

/** Official exam shape, replicated by exam mode when enough questions exist. */
export const OFFICIAL_EXAM = {
  generalCount: 30,
  stateCount: 3,
  total: 33,
  passThreshold: 17,
  timeLimitMinutes: 60,
} as const;
