'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Question } from '@/lib/types';
import { OFFICIAL_EXAM } from '@/lib/types';
import { recordAnswer } from '@/lib/store';

type Mode = 'practice' | 'exam' | 'review';

interface Answer {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
}

interface Explanation {
  loading: boolean;
  text: string | null;
  source: 'ai' | 'fallback' | null;
  model?: string;
}

function scaledThreshold(count: number): number {
  return Math.max(1, Math.ceil((count * OFFICIAL_EXAM.passThreshold) / OFFICIAL_EXAM.total));
}

function scaledMinutes(count: number): number {
  return Math.max(1, Math.round((count * OFFICIAL_EXAM.timeLimitMinutes) / OFFICIAL_EXAM.total));
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export default function QuestionRunner({
  questions,
  mode,
}: {
  questions: Question[];
  mode: Mode;
}) {
  const isExam = mode === 'exam';
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [finished, setFinished] = useState(false);
  const [explain, setExplain] = useState<Explanation>({
    loading: false,
    text: null,
    source: null,
  });

  const totalMinutes = useMemo(() => scaledMinutes(questions.length), [questions.length]);
  const [secondsLeft, setSecondsLeft] = useState(totalMinutes * 60);

  const current = questions[index];
  const passThreshold = scaledThreshold(questions.length);
  const correctCount = answers.filter((a) => a.correct).length;

  const finish = useCallback(
    (collected: Answer[]) => {
      // For exam mode, attempts are recorded into the SRS only at the end.
      if (isExam) {
        for (const a of collected) {
          const q = questions.find((x) => x.id === a.questionId);
          if (q) recordAnswer(q.id, q.category, a.selectedIndex, a.correct);
        }
      }
      setFinished(true);
    },
    [isExam, questions],
  );

  // Exam countdown timer. setState lives inside the async timeout (not the
  // effect body), and finishing is triggered from there when the clock hits 0.
  useEffect(() => {
    if (!isExam || finished || secondsLeft <= 0) return;
    const t = setTimeout(() => {
      if (secondsLeft <= 1) {
        setSecondsLeft(0);
        finish(answers);
      } else {
        setSecondsLeft(secondsLeft - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [isExam, finished, secondsLeft, answers, finish]);

  if (questions.length === 0) {
    return (
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
        Keine Fragen verfügbar. / No questions available for this selection.
      </p>
    );
  }

  function choose(optionIndex: number) {
    if (revealed) return;
    const correct = optionIndex === current.correctIndex;
    setSelected(optionIndex);

    if (isExam) {
      // Defer feedback; just store the choice and let the user advance.
      return;
    }
    // Practice / review: immediate feedback + persist right away.
    setRevealed(true);
    recordAnswer(current.id, current.category, optionIndex, correct);
    setAnswers((prev) => [...prev, { questionId: current.id, selectedIndex: optionIndex, correct }]);
  }

  function next() {
    let collected = answers;
    if (isExam && selected !== null) {
      const correct = selected === current.correctIndex;
      collected = [...answers, { questionId: current.id, selectedIndex: selected, correct }];
      setAnswers(collected);
    }

    if (index + 1 >= questions.length) {
      finish(collected);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
    setExplain({ loading: false, text: null, source: null });
  }

  async function getExplanation() {
    if (selected === null) return;
    setExplain({ loading: true, text: null, source: null });
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ questionId: current.id, selectedIndex: selected }),
      });
      const data = await res.json();
      setExplain({
        loading: false,
        text: data.explanation ?? 'Keine Erklärung verfügbar.',
        source: data.source ?? null,
        model: data.model,
      });
    } catch {
      setExplain({
        loading: false,
        text: 'Erklärung konnte nicht geladen werden. / Could not load explanation.',
        source: null,
      });
    }
  }

  if (finished) {
    const passed = correctCount >= passThreshold;
    return (
      <Summary
        questions={questions}
        answers={answers}
        correctCount={correctCount}
        passThreshold={passThreshold}
        passed={passed}
        isExam={isExam}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Frage {index + 1} / {questions.length}
        </span>
        {isExam ? (
          <span className="font-mono tabular-nums" aria-label="Verbleibende Zeit">
            ⏱ {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </span>
        ) : (
          <span>{current.category}</span>
        )}
      </header>

      <div>
        <h2 className="text-lg font-semibold leading-snug">{current.questionDe}</h2>
        {current.hintEn && <p className="mt-1 text-sm text-gray-400">{current.hintEn}</p>}
      </div>

      <ul className="flex flex-col gap-2">
        {current.options.map((option, i) => {
          const isSelected = selected === i;
          const isCorrect = i === current.correctIndex;
          let cls =
            'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition';
          if (revealed && isCorrect) cls += ' border-green-500 bg-green-50';
          else if (revealed && isSelected && !isCorrect) cls += ' border-red-500 bg-red-50';
          else if (isSelected) cls += ' border-blue-500 bg-blue-50';
          else cls += ' border-gray-200 hover:border-gray-400';

          return (
            <li key={i}>
              <button type="button" className={cls} onClick={() => choose(i)} disabled={revealed}>
                <span className="font-mono text-sm text-gray-400">{OPTION_LETTERS[i]}</span>
                <span>{option}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {!isExam && revealed && (
        <div className="flex flex-col gap-3">
          <p
            className={
              selected === current.correctIndex
                ? 'font-medium text-green-700'
                : 'font-medium text-red-700'
            }
          >
            {selected === current.correctIndex ? 'Richtig! / Correct!' : 'Leider falsch. / Incorrect.'}
          </p>

          {!explain.text && (
            <button
              type="button"
              onClick={getExplanation}
              disabled={explain.loading}
              className="w-fit rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {explain.loading ? 'Erkläre …' : '💡 Erklären / Explain'}
            </button>
          )}

          {explain.text && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
              <p className="whitespace-pre-line">{explain.text}</p>
              {explain.source && (
                <p className="mt-2 text-xs text-gray-400">
                  {explain.source === 'ai' ? `via ${explain.model ?? 'AI'}` : 'Fallback (kein KI-Schlüssel)'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={next}
          disabled={selected === null}
          className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {index + 1 >= questions.length ? 'Fertig / Finish' : 'Weiter / Next'}
        </button>
      </div>
    </div>
  );
}

function Summary({
  questions,
  answers,
  correctCount,
  passThreshold,
  passed,
  isExam,
}: {
  questions: Question[];
  answers: Answer[];
  correctCount: number;
  passThreshold: number;
  passed: boolean;
  isExam: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div
        className={`rounded-xl border p-6 ${
          passed ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
        }`}
      >
        <h2 className="text-2xl font-bold">
          {correctCount} / {answers.length} richtig
        </h2>
        {isExam && (
          <p className="mt-1 text-sm text-gray-600">
            {passed ? 'Bestanden 🎉' : 'Nicht bestanden'} — benötigt: {passThreshold} richtig
          </p>
        )}
      </div>

      <ol className="flex flex-col gap-2">
        {answers.map((a, i) => {
          const q = questions.find((x) => x.id === a.questionId);
          if (!q) return null;
          return (
            <li
              key={a.questionId}
              className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 text-sm"
            >
              <span>{a.correct ? '✅' : '❌'}</span>
              <div>
                <p className="font-medium">
                  {i + 1}. {q.questionDe}
                </p>
                <p className="text-gray-500">
                  Richtig: {q.options[q.correctIndex]}
                  {!a.correct && ` · Ihre Antwort: ${q.options[a.selectedIndex]}`}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <Link
        href="/"
        className="w-fit rounded-lg border border-gray-300 px-5 py-2.5 text-sm hover:bg-gray-50"
      >
        ← Zur Startseite / Home
      </Link>
    </div>
  );
}
