'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import BundeslandSelect from './components/BundeslandSelect';
import { isSampleOnly } from '@/lib/questions';
import { buildReviewSet } from '@/lib/select';
import { getStats, resetAll, setBundesland } from '@/lib/store';
import { useTrainer } from '@/lib/useTrainer';
import type { Bundesland } from '@/lib/types';

export default function Home() {
  const state = useTrainer();
  const bundesland = state.bundesland as Bundesland | null;
  const stats = useMemo(() => getStats(state), [state]);
  const dueCount = useMemo(
    () => buildReviewSet(bundesland, state.srs).length,
    [bundesland, state.srs],
  );

  function onReset() {
    if (
      window.confirm(
        'Allen Lernfortschritt auf diesem Gerät löschen? / Reset all progress on this device?',
      )
    ) {
      resetAll();
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Einbürgerungstest Trainer</h1>
        <p className="text-gray-500">
          Adaptiver, zweisprachiger Trainer mit KI-Tutor. / Adaptive, bilingual trainer with an AI
          tutor.
        </p>
      </header>

      {isSampleOnly() && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          ⚠️ Beispieldaten — nicht der offizielle Fragenkatalog. Vor echter Prüfungsvorbereitung den
          offiziellen BAMF-Katalog (300 + 16×10 Fragen) importieren.
        </p>
      )}

      <section className="flex flex-col gap-3">
        <BundeslandSelect value={bundesland} onChange={setBundesland} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <ModeCard href="/practice" title="Üben" subtitle="Practice" emoji="📚" />
        <ModeCard href="/exam" title="Prüfung" subtitle="Mock exam" emoji="📝" />
        <ModeCard
          href="/review"
          title="Wiederholen"
          subtitle="Review"
          emoji="🔁"
          badge={dueCount > 0 ? dueCount : undefined}
        />
      </section>

      {stats.answered > 0 && (
        <section className="rounded-xl border border-gray-200 p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-600">
            Dein Fortschritt / Your progress
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <Stat label="Beantwortet" value={String(stats.answered)} />
            <Stat label="Trefferquote" value={`${Math.round(stats.accuracy * 100)}%`} />
            <Stat label="Schwächste Kategorie" value={stats.weakestCategory ?? '–'} small />
          </div>
        </section>
      )}

      <footer className="mt-auto flex items-center justify-between pt-6 text-xs text-gray-400">
        <span>Anonyme Sitzung auf diesem Gerät / Anonymous device session</span>
        {stats.answered > 0 && (
          <button type="button" onClick={onReset} className="underline hover:text-gray-600">
            Daten zurücksetzen / Reset
          </button>
        )}
      </footer>
    </main>
  );
}

function ModeCard({
  href,
  title,
  subtitle,
  emoji,
  badge,
}: {
  href: string;
  title: string;
  subtitle: string;
  emoji: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="relative flex flex-col items-center gap-1 rounded-xl border border-gray-200 p-5 text-center transition hover:border-gray-400 hover:shadow-sm"
    >
      <span className="text-2xl">{emoji}</span>
      <span className="font-semibold">{title}</span>
      <span className="text-xs text-gray-400">{subtitle}</span>
      {badge !== undefined && (
        <span className="absolute right-3 top-3 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={small ? 'text-sm font-medium' : 'text-2xl font-bold'}>{value}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
