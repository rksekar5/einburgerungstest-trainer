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
      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />
          Adaptiv · Zweisprachig · KI-Tutor
        </span>
        <h1 className="text-4xl font-bold tracking-tight">Einbürgerungstest Trainer</h1>
        <p className="text-base text-muted">
          Adaptiver, zweisprachiger Trainer mit KI-Tutor. / Adaptive, bilingual trainer with an AI
          tutor.
        </p>
      </header>

      {isSampleOnly() && (
        <p
          role="note"
          className="flex items-start gap-2 rounded-xl border border-info-border bg-info-soft p-3 text-sm text-info-foreground"
        >
          <span aria-hidden="true" className="mt-0.5">⚠️</span>
          <span>
            Beispieldaten — nicht der offizielle Fragenkatalog. Vor echter Prüfungsvorbereitung den
            offiziellen BAMF-Katalog (300 + 16×10 Fragen) importieren.
          </span>
        </p>
      )}

      <section aria-label="Bundesland wählen" className="flex flex-col gap-3">
        <BundeslandSelect value={bundesland} onChange={setBundesland} />
      </section>

      <nav aria-label="Lernmodus / Learning mode" className="grid gap-3 sm:grid-cols-3">
        <ModeCard href="/practice" title="Üben" subtitle="Practice" icon={<BookIcon />}>
          Fragen ohne Zeitdruck
        </ModeCard>
        <ModeCard href="/exam" title="Prüfung" subtitle="Mock exam" icon={<ClipboardIcon />}>
          Auf Zeit, wie echt
        </ModeCard>
        <ModeCard
          href="/review"
          title="Wiederholen"
          subtitle="Review"
          icon={<RepeatIcon />}
          badge={dueCount > 0 ? dueCount : undefined}
        >
          Schwächste zuerst
        </ModeCard>
      </nav>

      {stats.answered > 0 && (
        <section
          aria-label="Dein Fortschritt / Your progress"
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h2 className="mb-4 text-sm font-semibold text-muted">
            Dein Fortschritt / Your progress
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <Stat label="Beantwortet" value={String(stats.answered)} />
            <Stat label="Trefferquote" value={`${Math.round(stats.accuracy * 100)}%`} />
            <Stat label="Schwächste Kategorie" value={stats.weakestCategory ?? '–'} small />
          </div>
          <div className="mt-4">
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-border"
              role="progressbar"
              aria-label="Trefferquote / Accuracy"
              aria-valuenow={Math.round(stats.accuracy * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${Math.round(stats.accuracy * 100)}%` }}
              />
            </div>
          </div>
        </section>
      )}

      <footer className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-6 text-xs text-subtle">
        <span>Anonyme Sitzung auf diesem Gerät / Anonymous device session</span>
        {stats.answered > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="rounded underline underline-offset-2 hover:text-foreground"
          >
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
  icon,
  badge,
  children,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: number;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary hover:bg-card-hover hover:shadow-sm"
    >
      <span
        aria-hidden="true"
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary transition group-hover:bg-primary/25"
      >
        {icon}
      </span>
      <span className="mt-1 flex items-baseline gap-2">
        <span className="text-base font-semibold">{title}</span>
        <span className="text-xs text-subtle">{subtitle}</span>
      </span>
      {children && <span className="text-xs text-muted">{children}</span>}
      {badge !== undefined && (
        <span className="absolute right-3 top-3 inline-flex min-w-5 items-center justify-center rounded-full bg-accent-red px-1.5 py-0.5 text-xs font-semibold text-white">
          <span className="sr-only">Fällig zur Wiederholung: </span>
          {badge}
        </span>
      )}
    </Link>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={small ? 'text-sm font-semibold' : 'text-2xl font-bold'}>{value}</span>
      <span className="text-xs text-subtle">{label}</span>
    </div>
  );
}

function BookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
