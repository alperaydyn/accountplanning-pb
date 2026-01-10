// Utilities to persist/restore "Plan My Day" structured payload inside chat messages.
// We store a hidden JSON payload inside the assistant message content so the UI
// can re-render the rich PlanMyDayDisplay after a refresh.

export const PLAN_MY_DAY_PAYLOAD_START = "<<<PLAN_MY_DAY_JSON>>>";
export const PLAN_MY_DAY_PAYLOAD_END = "<<<END_PLAN_MY_DAY_JSON>>>";

export function appendPlanMyDayPayload(text: string, plan: unknown): string {
  // Keep the human-readable text intact; append a machine-readable block after it.
  // The UI strips this block when rendering plain messages.
  return [
    text.trimEnd(),
    "",
    PLAN_MY_DAY_PAYLOAD_START,
    JSON.stringify(plan),
    PLAN_MY_DAY_PAYLOAD_END,
  ].join("\n");
}

export function extractPlanMyDayPayload(content: string): {
  text: string;
  plan: unknown | null;
} {
  const startIdx = content.indexOf(PLAN_MY_DAY_PAYLOAD_START);
  if (startIdx === -1) return { text: content, plan: null };

  const endIdx = content.indexOf(PLAN_MY_DAY_PAYLOAD_END, startIdx);
  if (endIdx === -1) {
    // If content is malformed, at least avoid showing the marker block.
    const text = content.slice(0, startIdx).trimEnd();
    return { text, plan: null };
  }

  const jsonStart = startIdx + PLAN_MY_DAY_PAYLOAD_START.length;
  const rawJson = content.slice(jsonStart, endIdx).trim();

  const text = (content.slice(0, startIdx) + content.slice(endIdx + PLAN_MY_DAY_PAYLOAD_END.length)).trim();

  try {
    const plan = JSON.parse(rawJson);
    return { text, plan };
  } catch {
    return { text, plan: null };
  }
}
