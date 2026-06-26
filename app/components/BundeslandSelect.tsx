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
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-gray-600">Bundesland (für Landesfragen)</span>
      <select
        className="rounded-lg border border-gray-300 bg-white px-3 py-2"
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
    </label>
  );
}
