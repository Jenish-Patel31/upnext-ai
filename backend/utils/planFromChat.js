import { generateContentWithFallback } from './gemini.js';

/**
 * Detect if user wants to commit the chat into My Plans and extract structured fields.
 */
export async function extractPlanFromConversation(
  userMessage,
  assistantReply,
  existingTitles,
  threadSnippet = ''
) {
  const titles = existingTitles.length ? existingTitles.join(' | ') : '(none)';
  const threadBlock =
    threadSnippet && String(threadSnippet).trim()
      ? `\nEARLIER IN THIS CHAT (use for goal name and steps if the latest user message is only "yes" / "add now"):\n${String(threadSnippet).slice(-7000)}\n`
      : '';

  const extractPrompt = `You extract whether the user wants to SAVE the current discussion as a formal plan in their app (e.g. "add this plan", "save to my plans", "create this plan", "add it to the planes" — "planes" is a common typo for "plans").

USER MESSAGE:
${String(userMessage).slice(0, 2000)}

ASSISTANT REPLY (for context — what was agreed):
${String(assistantReply).slice(0, 3500)}
${threadBlock}
EXISTING PLAN TITLES:
${titles}

Return ONLY valid JSON with this shape:
{"commit": boolean, "goal": string or null, "steps": string[], "category": string, "estimatedMonthlyAmount": number, "horizonMonths": number, "commitmentMode": "budgeted" | "flexible"}

Rules:
- commit true when the user clearly asks to add/save/put/create this in the app's plans or goals — including phrasing like "add to my plans", "add it to the planes", "save to goals", "put in plan section". NOT commit for vague "I should save money" with no save-to-app request.
- If commit is true but the user message is short ("yes", "yes please add", "just add", "add now"), infer goal and steps from BOTH messages: use the ASSISTANT REPLY and earlier thread context for the plan name (e.g. "Buy Car"), amounts, and steps.
- commitmentMode "flexible" when the user wants a placeholder / rough / TBD / "for now" plan, flexible savings, or take-home not set and they accept skipping strict budget checks. Otherwise "budgeted".
- goal: short title; steps: at least 1 non-empty actionable step (derive from context if needed).
- category: prefer "savings" for home/emergency funds; one of: general, essentials, savings, entertainment, shopping, travel, other
- estimatedMonthlyAmount: INR per month if inferable from message else 0
- horizonMonths: integer; default 12; use timeline from context (e.g. "one year" -> 12)
- If not committing: {"commit":false,"goal":null,"steps":[],"category":"general","estimatedMonthlyAmount":0,"horizonMonths":12,"commitmentMode":"budgeted"}`;

  try {
    const result = await generateContentWithFallback({
      contents: [{ role: 'user', parts: [{ text: extractPrompt }] }],
      generationConfig: {
        temperature: 0.15,
        maxOutputTokens: 700,
        responseMimeType: 'application/json',
      },
    });
    const rawText = (await result.response).text();
    const data = JSON.parse(rawText);
    if (!data.commit) return null;
    return {
      goal: data.goal,
      steps: data.steps,
      category: data.category,
      estimatedMonthlyAmount: data.estimatedMonthlyAmount,
      horizonMonths: data.horizonMonths,
      commitmentMode: data.commitmentMode,
      flexible: data.flexible,
    };
  } catch (e) {
    console.warn('[planFromChat] extract failed:', e.message || e);
    return null;
  }
}

/** User wants a second / different plan, not updating the similar one we warned about. */
export function userWantsSeparateNewPlan(userMessage) {
  const t = String(userMessage || '').toLowerCase();
  if (t.length < 4) return false;
  return (
    /\bcreate\s+(a\s+)?new\s+plan\b/.test(t) ||
    /\bplease\s+create\s+new\s+plan\b/.test(t) ||
    /\b(add|save)\s+(as\s+)?(a\s+)?(new|separate|different|second|another)\s+plan\b/.test(t) ||
    /\bnew\s+plan\b/.test(t) ||
    /\bseparate\s+plan\b/.test(t) ||
    /\banother\s+plan\b/.test(t) ||
    /\bdifferent\s+plan\b/.test(t) ||
    /\b(second|other)\s+plan\b/.test(t) ||
    /\bdon'?t\s+update\b/.test(t) ||
    /\bkeep\s+both\b/.test(t) ||
    /\bnot\s+the\s+same\s+plan\b/.test(t) ||
    /\bokay\s+so\s+add\s+with\s+that\s+as\s+new\s+plan\b/.test(t) ||
    /\bas\s+new\s+plan\b/.test(t) ||
    /\bfor\s+now\s+just\s+add\b/.test(t)
  );
}

export function userMessageSuggestsPlanCommit(userMessage) {
  const t = String(userMessage || '').toLowerCase();
  if (t.length < 5) return false;
  // "planes" = common typo for "plans" — must match or users see no save in My Plans
  const patterns = [
    /\badd\s+(this\s+)?(to\s+)?(my\s+)?plans?\b/,
    /\badd\s+(this\s+)?(to\s+)?(my\s+)?planes\b/,
    /\badd\s+(this\s+)?(to\s+)?(my\s+)?goals?\b/,
    /\bsave\s+(this\s+)?(to\s+)?(my\s+)?plans?\b/,
    /\bsave\s+(this\s+)?(to\s+)?(my\s+)?planes\b/,
    /\bcreate\s+(this\s+)?plans?\b/,
    /\bput\s+(this\s+)?in\s+(my\s+)?plans?\b/,
    /\bput\s+(this\s+)?in\s+(my\s+)?planes\b/,
    /\badd\s+it\s+to\s+(the\s+)?(plan|plans|planes)\b/,
    /\bplan\s+section\b/,
    /\bmy\s+plans\b.*\b(add|save|put)\b/,
    /\b(can you|could you|please)\s+.{0,60}\b(add|put|save)\b.{0,40}\b(plan|plans|planes|goals?)\b/,
    /\byes[\s,]*(please\s+)?(just\s+)?add(\s+it|\s+now|\s+that)?\b/,
    /\bjust\s+add(\s+it|\s+now)?\b/,
    /\bproceed\s+with\s+adding\b/,
    /\badd\s+[\"']?buy\s/,
    /\bsave\s*it\b/,
    /\bsaveit\b/,
    /\byes\s+save\b/,
    /\bsave\s+it\s+with\b/,
    /\bflexible\s+sav/i,
  ];
  return patterns.some((re) => re.test(t));
}
