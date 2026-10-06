import { describe, expect, it } from "vitest";
import { buildQueryText, buildUserMessage, dominantOtherExpression, SYSTEM_PROMPT } from "@/lib/coach/prompt";
import type { SmileResult } from "@/lib/smile/types";

const result = (overrides: Partial<SmileResult> = {}): SmileResult => ({
  score: 35,
  label: "Hint of a smile",
  expressions: { neutral: 0.6, happy: 0.35, sad: 0, angry: 0, fearful: 0.05, disgusted: 0, surprised: 0 },
  faceCount: 1,
  ...overrides,
});

describe("dominantOtherExpression", () => {
  it("ignores happy and picks the strongest remaining expression", () => {
    expect(dominantOtherExpression(result().expressions)).toBe("neutral");
  });
});

describe("buildQueryText", () => {
  it("describes the label and mood as a question, for embedding", () => {
    expect(buildQueryText(result())).toBe(
      "How do I turn a small closed-lip smile into a bigger smile when my face looks serious?",
    );
  });
});

describe("buildUserMessage", () => {
  it("includes the score, the expressions as percentages and only the given tips", () => {
    const message = buildUserMessage(result(), [{ id: "relax-jaw", text: "Relax your jaw." }]);
    expect(message).toContain("Smile score: 35/100 (Hint of a smile)");
    expect(message).toContain("neutral 60%");
    expect(message).toContain("- Relax your jaw.");
    expect(message.match(/^- /gm)).toHaveLength(1);
  });

  it("keeps per-photo data out of the fixed system prompt (so it can be cached)", () => {
    expect(SYSTEM_PROMPT).not.toMatch(/\d+\/100/);
  });
});
