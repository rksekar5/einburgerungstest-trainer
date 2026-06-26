import { NextResponse } from 'next/server';
import { getQuestionById } from '@/lib/questions';

// Fact-bounded AI tutor.
//
// Trust rule: this app teaches toward an official government exam, so the model
// must explain ONLY from the facts we pass in and must never invent legal or
// historical facts. When no AI Gateway key is configured (e.g. local dev before
// Vercel is connected), we return a deterministic, fact-only fallback instead.

const TUTOR_MODEL = process.env.TUTOR_MODEL ?? 'openai/gpt-4o-mini';
const PROMPT_VERSION = 'explain-v1';

// Fact-only, bilingual summary used when the AI tutor is not reachable.
// States only what we already know (the correct option, the learner's choice) —
// never fabricates exam facts, and never apologises in the UI.
function factSummary(correctOption: string, userOption: string, wasCorrect: boolean): string {
  const de = wasCorrect
    ? `Richtig — „${correctOption}“ ist die korrekte Antwort.`
    : `Die richtige Antwort ist „${correctOption}“. Ihre Wahl war „${userOption}“.`;
  const en = wasCorrect
    ? `Correct — “${correctOption}” is the right answer.`
    : `The correct answer is “${correctOption}”. You chose “${userOption}”.`;
  return `${de}\n\n${en}`;
}

interface ExplainRequest {
  questionId?: string;
  selectedIndex?: number;
}

export async function POST(req: Request) {
  let body: ExplainRequest;
  try {
    body = (await req.json()) as ExplainRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { questionId, selectedIndex } = body;
  if (!questionId || typeof selectedIndex !== 'number') {
    return NextResponse.json(
      { error: 'questionId and selectedIndex are required.' },
      { status: 400 },
    );
  }

  const question = getQuestionById(questionId);
  if (!question) {
    return NextResponse.json({ error: 'Unknown questionId.' }, { status: 404 });
  }

  const correctOption = question.options[question.correctIndex];
  const userOption = question.options[selectedIndex];
  const wasCorrect = selectedIndex === question.correctIndex;

  // No gateway configured → honest, fact-only summary (no fabricated content).
  if (!process.env.AI_GATEWAY_API_KEY) {
    return NextResponse.json({
      explanation: factSummary(correctOption, userOption, wasCorrect),
      source: 'fallback',
      promptVersion: PROMPT_VERSION,
    });
  }

  try {
    const { generateText } = await import('ai');
    const system = [
      'You are a tutor for the German citizenship test (Einbürgerungstest).',
      'Explain ONLY using the facts provided below. Never invent legal, historical, or factual claims.',
      'Answer in two short parts: first 2-3 sentences in German, then 2-3 sentences in English.',
      'Be concise and encouraging. Do not repeat all answer options verbatim.',
    ].join(' ');

    const prompt = [
      `Category: ${question.category}`,
      question.bundesland ? `Bundesland: ${question.bundesland}` : 'Scope: general (federal)',
      `Question (DE): ${question.questionDe}`,
      `Options: ${question.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(' | ')}`,
      `Correct answer: ${correctOption}`,
      `Learner selected: ${userOption} (${wasCorrect ? 'correct' : 'incorrect'})`,
      '',
      'Explain why the correct answer is correct, grounded only in the facts above.',
    ].join('\n');

    const { text } = await generateText({ model: TUTOR_MODEL, system, prompt });

    return NextResponse.json({
      explanation: text,
      source: 'ai',
      model: TUTOR_MODEL,
      promptVersion: PROMPT_VERSION,
    });
  } catch (err) {
    // Never fail the UX on an AI error — fall back to the fact-only summary.
    console.error('explain route AI error:', err);
    return NextResponse.json({
      explanation: factSummary(correctOption, userOption, wasCorrect),
      source: 'fallback',
      promptVersion: PROMPT_VERSION,
    });
  }
}
