'use client';

import { BUNDESLAENDER, type Bundesland } from '@/lib/types';

export default function BundeslandSelect({
  value,
  onChange,
}: {
  value: Bundesland | null;
  onChange: (value: Bundesland | null) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-muted">Bundesland (für Landesfragen)</span>
      <div className="relative">
        <select
          className="w-full appearance-none rounded-xl border border-border bg-surface px-3.5 py-2.5 pr-10 text-foreground transition hover:border-border-strong"
          value={value ?? ''}
          onChange={(e) => onChange((e.target.value || null) as Bundesland | null)}
        >
          <option value="">– bitte wählen / select –</option>
          {BUNDESLAENDER.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </div>
    </label>
  );
}
