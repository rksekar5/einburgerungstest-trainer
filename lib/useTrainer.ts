'use client';

import { useSyncExternalStore } from 'react';
import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
  type TrainerState,
} from './store';

/** Reactive access to the device store (re-renders on any write). */
export function useTrainer(): TrainerState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
