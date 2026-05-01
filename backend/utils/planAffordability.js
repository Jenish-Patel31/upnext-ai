import User from '../models/userModel.js';
import Plan from '../models/planModel.js';

export const DISCRETIONARY = ['entertainment', 'shopping', 'travel'];

export async function assertPlanAffordable(
  uid,
  { category, estimatedMonthlyAmount, horizonMonths, flexible, commitmentMode },
  excludePlanId = null
) {
  const isFlexible =
    flexible === true || String(commitmentMode || '').toLowerCase() === 'flexible';
  if (isFlexible) {
    return { ok: true, skipReason: 'flexible_commitment' };
  }

  const userDoc = await User.findOne({ uid });
  const income = Number(userDoc?.preferences?.budget) || 0;
  const amt = Math.max(0, Number(estimatedMonthlyAmount) || 0);
  const cat = (category || 'general').toLowerCase().trim();
  const horizon = Number(horizonMonths);

  if (horizon && horizon < 3) {
    return {
      ok: false,
      error:
        'Use a horizon of at least 3 months so plans stay long-term and meaningful. For quick tasks, track them as expenses instead.',
    };
  }

  if (!income || income <= 0) {
    return { ok: true, skipReason: 'no_income' };
  }

  if (amt > 0 && DISCRETIONARY.includes(cat)) {
    const cap = Math.round(income * 0.15);
    if (amt > cap) {
      return {
        ok: false,
        error: `For ${cat}, ₹${amt}/mo is above the suggested discretionary cap (₹${cap}/mo, ~15% of your ₹${income} take-home). Lower the monthly amount, pick another category, or increase accuracy of income in Profile.`,
      };
    }
  }

  const q = { uid, completed: false };
  if (excludePlanId) {
    q._id = { $ne: excludePlanId };
  }
  const active = await Plan.find(q);
  const committed = active.reduce((s, p) => s + (Number(p.estimatedMonthlyAmount) || 0), 0);
  const ceiling = Math.round(income * 0.85);
  if (committed + amt > ceiling) {
    return {
      ok: false,
      error: `Active plans already tie up ~₹${committed}/mo. Adding ₹${amt}/mo exceeds 85% of take-home (₹${ceiling}/mo), leaving too little for essentials and shocks. Complete or trim a plan first.`,
    };
  }

  return { ok: true };
}

/** Words that overlap on almost any savings goal (e.g. "purchase") — ignore for fuzzy match. */
const GOAL_STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'for',
  'and',
  'or',
  'with',
  'to',
  'of',
  'in',
  'on',
  'my',
  'new',
  'plan',
  'plans',
  'goal',
  'save',
  'saving',
  'savings',
  'fund',
  'monthly',
  'month',
  'year',
  'rs',
  'rupee',
  'rupees',
  'lakh',
  'lakhs',
  'crore',
  'purchase',
  'buy',
  'buying',
  'budget',
  'set',
  'get',
  'need',
  'want',
]);

function meaningfulGoalTokens(goal) {
  return String(goal)
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length > 2 && !GOAL_STOPWORDS.has(w));
}

/** Match proposed goal to an existing active plan (title similarity). Stricter than raw word overlap so "car purchase" ≠ "home purchase". */
export function findSimilarPlan(activePlans, proposedGoal) {
  if (!proposedGoal || !String(proposedGoal).trim()) return null;
  const g = String(proposedGoal).toLowerCase().trim();
  const norm = (s) => String(s).toLowerCase().trim();
  const gTokens = meaningfulGoalTokens(proposedGoal);

  for (const p of activePlans) {
    const pg = norm(p.goal);
    if (!pg) continue;
    if (pg === g) return p;

    const minSub = 6;
    if (g.length >= minSub && pg.length >= minSub && (pg.includes(g) || g.includes(pg))) return p;

    const wa = new Set(gTokens);
    const wb = new Set(meaningfulGoalTokens(p.goal));
    if (wa.size === 0 || wb.size === 0) continue;

    let inter = 0;
    for (const x of wa) if (wb.has(x)) inter++;

    if (inter >= 2) return p;
    if (inter === 1 && wa.size === 1 && wb.size === 1) return p;
  }
  return null;
}
