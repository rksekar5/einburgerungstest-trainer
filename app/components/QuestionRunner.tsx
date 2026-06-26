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
      <p className="rounded-xl border border-info-border bg-info-soft p-4 text-info-foreground">
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
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-muted">
          <span className="font-medium">
            Frage {index + 1} <span className="text-subtle">/ {questions.length}</span>
          </span>
          {isExam ? (
            <span
              role="timer"
              aria-label={`Verbleibende Zeit: ${Math.floor(secondsLeft / 60)} Minuten ${secondsLeft % 60} Sekunden`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 font-mono tabular-nums"
            >
              <ClockIcon />
              {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
            </span>
          ) : (
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
              {current.category}
            </span>
          )}
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-label="Fortschritt / Progress"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={questions.length}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${Math.round(((index + 1) / questions.length) * 100)}%` }}
          />
        </div>
      </div>

      <div>
        <h2 id="question-heading" className="text-xl font-semibold leading-snug">
          {current.questionDe}
        </h2>
        {current.hintEn && <p className="mt-1 text-sm text-subtle">{current.hintEn}</p>}
      </div>

      <ul className="flex flex-col gap-2.5" role="group" aria-labelledby="question-heading">
        {current.options.map((option, i) => {
          const isSelected = selected === i;
          const isCorrect = i === current.correctIndex;
          const showCorrect = revealed && isCorrect;
          const showWrong = revealed && isSelected && !isCorrect;

          let cls =
            'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition disabled:cursor-default';
          let letterCls =
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold ';
          if (showCorrect) {
            cls += ' border-success-border bg-success-soft';
            letterCls += 'border-success bg-success/15 text-success';
          } else if (showWrong) {
            cls += ' border-danger-border bg-danger-soft';
            letterCls += 'border-danger bg-danger/15 text-danger';
          } else if (isSelected) {
            cls += ' border-primary bg-primary/10';
            letterCls += 'border-primary bg-primary/15 text-primary';
          } else {
            cls += ' border-border bg-card hover:border-border-strong hover:bg-card-hover';
            letterCls += 'border-border text-muted';
          }

          return (
            <li key={i}>
              <button
                type="button"
                className={cls}
                onClick={() => choose(i)}
                disabled={revealed}
                aria-pressed={isSelected}
              >
                <span aria-hidden="true" className={letterCls}>
                  {OPTION_LETTERS[i]}
                </span>
                <span className="flex-1">{option}</span>
                {showCorrect && (
                  <span className="shrink-0 text-success">
                    <span className="sr-only">Richtige Antwort / Correct answer</span>
                    <CheckIcon />
                  </span>
                )}
                {showWrong && (
                  <span className="shrink-0 text-danger">
                    <span className="sr-only">Ihre falsche Antwort / Your incorrect answer</span>
                    <CrossIcon />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {!isExam && revealed && (
        <div className="flex flex-col gap-3" aria-live="polite">
          <p
            className={
              selected === current.correctIndex
                ? 'flex items-center gap-2 font-semibold text-success'
                : 'flex items-center gap-2 font-semibold text-danger'
            }
          >
            <span aria-hidden="true">
              {selected === current.correctIndex ? <CheckIcon /> : <CrossIcon />}
            </span>
            {selected === current.correctIndex ? 'Richtig! / Correct!' : 'Leider falsch. / Incorrect.'}
          </p>

          {!explain.text && (
            <button
              type="button"
              onClick={getExplanation}
              disabled={explain.loading}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition hover:border-border-strong hover:bg-card-hover disabled:opacity-50"
            >
              <LightbulbIcon />
              {explain.loading ? 'Erkläre … / Explaining …' : 'Erklären / Explain'}
            </button>
          )}

          {explain.text && (
            <div className="rounded-xl border border-border bg-card p-4 text-sm">
              <p className="whitespace-pre-line leading-relaxed">{explain.text}</p>
              {explain.source && (
                <p className="mt-3 text-xs text-subtle">
                  {explain.source === 'ai'
                    ? `via ${explain.model ?? 'KI / AI'}`
                    : 'Fallback (kein KI-Schlüssel / no AI key)'}
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
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {index + 1 >= questions.length ? 'Fertig / Finish' : 'Weiter / Next'}
          <ArrowRightIcon />
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
        className={`rounded-2xl border p-6 ${
          passed ? 'border-success-border bg-success-soft' : 'border-danger-border bg-danger-soft'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={passed ? 'text-success' : 'text-danger'} aria-hidden="true">
            {passed ? <CheckIcon /> : <CrossIcon />}
          </span>
          <h2 className="text-2xl font-bold">
            {correctCount} / {answers.length} richtig
            {answers.length > 0 && (
              <span className="ml-2 text-base font-medium text-muted">
                ({Math.round((correctCount / answers.length) * 100)}%)
              </span>
            )}
          </h2>
        </div>
        {isExam && (
          <p className="mt-2 text-sm text-muted">
            {passed ? 'Bestanden / Passed 🎉' : 'Nicht bestanden / Not passed'} — benötigt / required:{' '}
            {passThreshold} richtig
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
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-sm"
            >
              <span className={`mt-0.5 shrink-0 ${a.correct ? 'text-success' : 'text-danger'}`}>
                <span className="sr-only">{a.correct ? 'Richtig / Correct' : 'Falsch / Incorrect'}</span>
                {a.correct ? <CheckIcon /> : <CrossIcon />}
              </span>
              <div>
                <p className="font-medium">
                  {i + 1}. {q.questionDe}
                </p>
                <p className="text-muted">
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
        className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium transition hover:border-border-strong hover:bg-card-hover"
      >
        <ArrowLeftIcon />
        Zur Startseite / Home
      </Link>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}
