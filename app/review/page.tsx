'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const RunnerLoader = dynamic(() => import('../components/RunnerLoader'), {
  ssr: false,
  loading: () => <p className="text-sm text-gray-400">Lädt… / Loading…</p>,
});

export default function ReviewPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-10">
      <Link href="/" className="w-fit text-sm text-gray-400 hover:text-gray-600">
        ← Startseite / Home
      </Link>
      <h1 className="text-2xl font-bold">Wiederholen / Review</h1>
      <p className="text-sm text-gray-500">
        Adaptiv: schwächste Fragen zuerst. / Adaptive: your weakest questions first.
      </p>
      <RunnerLoader mode="review" />
    </main>
  );
}
