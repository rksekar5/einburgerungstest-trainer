'use client';

import { useState } from 'react';
import QuestionRunner from './QuestionRunner';
import { buildExamSet, buildPracticeSet, buildReviewSet } from '@/lib/select';
import { getBundesland, getSrsMap } from '@/lib/store';
import type { Bundesland, Question } from '@/lib/types';

type Mode = 'practice' | 'exam' | 'review';

// Rendered client-only (via `dynamic(..., { ssr: false })`) so the one-time,
// randomized question set is built from localStorage without a hydration
// mismatch. The lazy initializer runs exactly once on the client.
export default function RunnerLoader({ mode }: { mode: Mode }) {
  const [questions] = useState<Question[]>(() => {
    const bl = getBundesland() as Bundesland | null;
    if (mode === 'practice') return buildPracticeSet(bl);
    if (mode === 'exam') return buildExamSet(bl);
    return buildReviewSet(bl, getSrsMap());
  });

  if (mode === 'review' && questions.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted">
        Nichts zu wiederholen. Übe zuerst ein paar Fragen. / Nothing due — practice some questions
        first.
      </p>
    );
  }

  return <QuestionRunner questions={questions} mode={mode} />;
}
