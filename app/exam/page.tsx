'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const RunnerLoader = dynamic(() => import('../components/RunnerLoader'), {
  ssr: false,
  loading: () => <p className="text-sm text-gray-400">Lädt… / Loading…</p>,
});

export default function ExamPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-10">
      <Link href="/" className="w-fit text-sm text-gray-400 hover:text-gray-600">
        ← Startseite / Home
      </Link>
      <h1 className="text-2xl font-bold">Prüfung / Mock exam</h1>
      <RunnerLoader mode="exam" />
    </main>
  );
}
