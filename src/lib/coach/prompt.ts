import type { Expressions, SmileLabel, SmileResult } from "@/lib/smile";
import type { Tip } from "./tips";

/**
 * Fixed instructions, identical on every request. Keeping them separate from the
 * per-photo data means the start of the prompt never changes, which is what
 * provider-side prompt caching needs.
 */
export const SYSTEM_PROMPT = `You are a friendly, encouraging smile coach inside a photo app.
You receive a smile score from 0 to 100, the facial expression probabilities from a face model, and a few coaching tips.
Write at most 3 short sentences in plain English, speaking directly to the user ("you").
First say briefly what the score means, then give exactly one piece of advice: the tip that best fits this score.
Use only the tips provided. Do not invent other advice, do not mention the tips list, and do not comment on appearance beyond the expression.`;

/** Strongest expression other than "happy", e.g. "neutral" for a serious face. */
export function dominantOtherExpression(expressions: Expressions): keyof Expressions {
  const others = (Object.keys(expressions) as (keyof Expressions)[]).filter((k) => k !== "happy");
  return others.reduce((best, key) => (expressions[key] > expressions[best] ? key : best));
}

/** Each label as the question a user in that situation would ask. */
const QUESTION: Record<SmileLabel, string> = {
  "Not smiling": "How do I go from a serious face to a natural smile",
  "Hint of a smile": "How do I turn a small closed-lip smile into a bigger smile",
  Smiling: "How do I make my smile a little bigger and more genuine",
  "Big smile": "I already have a big happy smile, how do I keep it in my next photos",
};

const FEELING: Record<keyof Expressions, string> = {
  neutral: "my face looks serious",
  happy: "I feel happy",
  sad: "I look sad",
  angry: "my face looks tense and frowning",
  fearful: "I feel nervous",
  disgusted: "my face looks tense",
  surprised: "my eyebrows are raised in surprise",
};

/**
 * The search query that gets embedded to find tips. Written as the question a user would ask,
 * because embeddings match meaning: it finds better tips than raw numbers would.
 */
export function buildQueryText(result: SmileResult): string {
  return `${QUESTION[result.label]} when ${FEELING[dominantOtherExpression(result.expressions)]}?`;
}

/** The per-photo part of the prompt: the result plus only the retrieved tips. */
export function buildUserMessage(result: SmileResult, tips: Tip[]): string {
  const expressions = Object.entries(result.expressions)
    .map(([name, value]) => `${name} ${Math.round(value * 100)}%`)
    .join(", ");
  return [
    `Smile score: ${result.score}/100 (${result.label})`,
    `Expressions: ${expressions}`,
    "",
    "Tips:",
    ...tips.map((tip) => `- ${tip.text}`),
  ].join("\n");
}
