// Device-scoped persistence (anonymous, no login).
//
// Backed by localStorage for local dev, exposed through a cached snapshot +
// subscription so React can consume it via useSyncExternalStore. These exports
// are the ONLY persistence surface, so the whole module can later be swapped to
// Vercel KV (session) + Vercel Postgres (attempts/SRS) without touching the UI.

import { type SrsEntry, nextBox } from './srs';

const STORAGE_KEY = 'eb_trainer_v1';
const MAX_ATTEMPTS = 500;

export interface Attempt {
  questionId: string;
  category: string;
  selectedIndex: number;
  correct: boolean;
  atISO: string;
}

export interface TrainerState {
  deviceId: string;
  bundesland: string | null;
  srs: Record<string, SrsEntry>;
  attempts: Attempt[];
}

/** Stable reference used for server rendering (no localStorage available). */
const EMPTY: TrainerState = { deviceId: 'pending', bundesland: null, srs: {}, attempts: [] };

let cache: TrainerState | null = null;
const listeners = new Set<() => void>();

function freshState(): TrainerState {
  return {
    deviceId:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `dev-${Math.random().toString(36).slice(2)}`,
    bundesland: null,
    srs: {},
    attempts: [],
  };
}

function readStorage(): TrainerState {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = freshState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return { ...freshState(), ...(JSON.parse(raw) as Partial<TrainerState>) } as TrainerState;
  } catch {
    return freshState();
  }
}

/** Lazily hydrate and return the cached snapshot (stable identity between writes). */
function ensure(): TrainerState {
  if (!cache) cache = readStorage();
  return cache;
}

/** Replace the snapshot, persist it, and notify subscribers. */
function commit(next: TrainerState): void {
  cache = next;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  for (const l of listeners) l();
}

// --- useSyncExternalStore wiring ---
export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
export function getSnapshot(): TrainerState {
  return ensure();
}
export function getServerSnapshot(): TrainerState {
  return EMPTY;
}

// --- reads ---
export function loadState(): TrainerState {
  return ensure();
}
export function getDeviceId(): string {
  return ensure().deviceId;
}
export function getBundesland(): string | null {
  return ensure().bundesland;
}
export function getSrsMap(): Record<string, SrsEntry> {
  return ensure().srs;
}

// --- writes ---
export function setBundesland(bundesland: string | null): void {
  commit({ ...ensure(), bundesland });
}

/** Record one answer: updates the Leitner box and appends a capped attempt log. */
export function recordAnswer(
  questionId: string,
  category: string,
  selectedIndex: number,
  correct: boolean,
): void {
  const state = ensure();
  const prev = state.srs[questionId];
  const atISO = new Date().toISOString();

  const srs: Record<string, SrsEntry> = {
    ...state.srs,
    [questionId]: {
      box: nextBox(prev?.box ?? 1, correct),
      lastSeenISO: atISO,
      lastCorrect: correct,
      reps: (prev?.reps ?? 0) + 1,
    },
  };

  const attempts = [
    ...state.attempts,
    { questionId, category, selectedIndex, correct, atISO },
  ].slice(-MAX_ATTEMPTS);

  commit({ ...state, srs, attempts });
}

export function resetAll(): void {
  commit(freshState());
}

// --- derived stats ---
export interface Stats {
  answered: number;
  correct: number;
  accuracy: number;
  weakestCategory: string | null;
  byCategory: Record<string, { answered: number; correct: number }>;
}

export function getStats(state: TrainerState = ensure()): Stats {
  const byCategory: Stats['byCategory'] = {};
  let correct = 0;

  for (const a of state.attempts) {
    const c = (byCategory[a.category] ??= { answered: 0, correct: 0 });
    c.answered += 1;
    if (a.correct) {
      c.correct += 1;
      correct += 1;
    }
  }

  let weakestCategory: string | null = null;
  let worstRate = Infinity;
  for (const [cat, c] of Object.entries(byCategory)) {
    if (c.answered < 2) continue;
    const rate = c.correct / c.answered;
    if (rate < worstRate) {
      worstRate = rate;
      weakestCategory = cat;
    }
  }

  return {
    answered: state.attempts.length,
    correct,
    accuracy: state.attempts.length ? correct / state.attempts.length : 0,
    weakestCategory,
    byCategory,
  };
}
