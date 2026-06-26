'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const RunnerLoader = dynamic(() => import('../components/RunnerLoader'), {
  ssr: false,
  loading: () => <p className="text-sm text-muted">Lädt… / Loading…</p>,
});

export default function ExamPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-10">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 rounded text-sm text-muted transition hover:text-foreground"
      >
        <span aria-hidden="true">←</span> Startseite / Home
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">Prüfung / Mock exam</h1>
      <RunnerLoader mode="exam" />
    </main>
  );
}
