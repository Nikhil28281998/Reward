// Finance-framework templates (50/30/20, Zero-based, Envelope, Debt Snowball/
// Avalanche, Emergency Fund, Pay Yourself First). Each framework exports a
// `compute()` that turns the user's real data into a one-line Home insight.

export type FrameworkId =
  | 'fifty-thirty-twenty'
  | 'zero-based'
  | 'envelope'
  | 'debt-snowball'
  | 'debt-avalanche'
  | 'emergency-fund'
  | 'pay-yourself-first';

export type FrameworkTemplate = {
  id: FrameworkId;
  emoji: string;
  title: string;
  sub: string;
  colors: [string, string];
  horizon: string;
  needsIncome: boolean;
  blurb: string;
  playbook: string[];
};

export const FRAMEWORK_TEMPLATES: FrameworkTemplate[] = [
  {
    id: 'fifty-thirty-twenty',
    emoji: '⚖️',
    title: '50 / 30 / 20 rule',
    sub: 'Needs · Wants · Savings',
    colors: ['#0EA5E9', '#2563EB'],
    horizon: 'Monthly',
    needsIncome: true,
    blurb: 'Split take-home pay 50% needs, 30% wants, 20% savings. The classic starter framework.',
    playbook: [
      '50% of income → rent, utilities, groceries, minimum debt payments.',
      '30% of income → dining out, entertainment, subscriptions, travel.',
      '20% of income → savings, investing, and extra debt paydown.',
      'Labhly tracks your category mix and flags when wants creep past 30%.',
    ],
  },
  {
    id: 'zero-based',
    emoji: '📋',
    title: 'Zero-based budget',
    sub: 'Every dollar has a job',
    colors: ['#8B5CF6', '#6366F1'],
    horizon: 'Monthly',
    needsIncome: true,
    blurb: 'Assign every dollar of income to a category until income − expenses = 0.',
    playbook: [
      'List every category you spend on: housing, food, transport, fun, savings.',
      'Assign a dollar amount to each until your income is fully allocated.',
      'Track spending against each envelope — unspent dollars roll to savings.',
      'Labhly reconciles your real ledger against your plan weekly.',
    ],
  },
  {
    id: 'envelope',
    emoji: '✉️',
    title: 'Envelope method',
    sub: 'Category caps you can feel',
    colors: ['#F59E0B', '#D97706'],
    horizon: 'Monthly',
    needsIncome: true,
    blurb: 'Cap discretionary spend per category. When an envelope is empty, you stop.',
    playbook: [
      'Pick your top 5 flexible categories (dining, shopping, entertainment...).',
      'Set a monthly cap for each (e.g., $400 dining, $200 shopping).',
      'Labhly warns you when you hit 80% of a cap mid-month.',
      'Unused cap can roll to savings or next month.',
    ],
  },
  {
    id: 'debt-snowball',
    emoji: '❄️',
    title: 'Debt snowball',
    sub: 'Smallest balance first',
    colors: ['#EC4899', '#DB2777'],
    horizon: 'Until debt-free',
    needsIncome: false,
    blurb: 'Pay minimums on all debts. Throw every extra dollar at the smallest — quick wins build momentum.',
    playbook: [
      'Pay minimums on every card and loan.',
      'Pick the card with the smallest balance — attack it with every extra dollar.',
      'Kill it, celebrate, then roll that payment into the next smallest.',
      'Labhly surfaces the next target and progress bar on Home.',
    ],
  },
  {
    id: 'debt-avalanche',
    emoji: '🏔️',
    title: 'Debt avalanche',
    sub: 'Highest APR first',
    colors: ['#EF4444', '#B91C1C'],
    horizon: 'Until debt-free',
    needsIncome: false,
    blurb: 'Pay minimums on all. Extra dollars attack the highest APR debt — saves the most interest.',
    playbook: [
      'Rank your debts by interest rate — high to low.',
      'Pay minimums everywhere; extra cash always goes to the highest APR.',
      'When killed, roll that monthly payment into the next-highest.',
      'Labhly surfaces the priority card every month.',
    ],
  },
  {
    id: 'emergency-fund',
    emoji: '🛟',
    title: 'Emergency fund',
    sub: '3–6 months of expenses',
    colors: ['#10B981', '#059669'],
    horizon: '6–12 months',
    needsIncome: false,
    blurb: 'Build a savings cushion equal to 3–6 months of essential expenses before optimizing anything else.',
    playbook: [
      'Estimate your essential monthly outflow (rent + food + utilities + insurance).',
      'Multiply by 3 for minimum, 6 for comfort.',
      'Park the cushion in a high-yield savings account — untouchable unless emergency.',
      'Labhly tracks essentials from your ledger and nudges you toward the target.',
    ],
  },
  {
    id: 'pay-yourself-first',
    emoji: '💰',
    title: 'Pay yourself first',
    sub: 'Save before you spend',
    colors: ['#14B8A6', '#0D9488'],
    horizon: 'Monthly',
    needsIncome: true,
    blurb: 'Transfer savings the moment income lands — you never miss what you never see.',
    playbook: [
      'Set a % target (start with 10%, aim for 20%).',
      'Auto-transfer that amount to savings/investing the day your paycheck hits.',
      'Live on whatever remains — no spreadsheet needed.',
      'Labhly confirms the transfer fired and tallies your savings rate.',
    ],
  },
];

// ─── Insight computation ────────────────────────────────────────────────────

export type PlanInputs = {
  monthlyIncome: number;
  monthSpend: number; // current month total from ledger
  spendByCategory: Record<string, number>;
  liabilitiesTotal: number; // sum of card balances
  cards: Array<{ id: string; name: string; balance: number; apr?: number; limit?: number }>;
};

export type PlanInsight = {
  emoji: string;
  headline: string;
  body: string;
  chip?: string;
};

// Buckets used by the 50/30/20 rule. These map from our shared CATEGORIES.
const NEEDS_CATS = new Set([
  'GROCERIES', 'GAS', 'UTILITIES', 'RENT', 'INSURANCE', 'TRANSPORT', 'HEALTHCARE',
  'HOUSING', 'FUEL', 'PHARMACY', 'TRANSIT',
]);
const WANTS_CATS = new Set([
  'DINING', 'ENTERTAINMENT', 'SHOPPING', 'TRAVEL', 'SUBSCRIPTIONS', 'STREAMING',
  'HOBBIES', 'GAMING',
]);

export function computeInsight(
  id: FrameworkId,
  inputs: PlanInputs,
): PlanInsight | null {
  const { monthlyIncome, monthSpend, spendByCategory, liabilitiesTotal, cards } = inputs;

  switch (id) {
    case 'fifty-thirty-twenty': {
      if (monthlyIncome <= 0) return null;
      let needs = 0, wants = 0;
      for (const [cat, amt] of Object.entries(spendByCategory)) {
        const up = cat.toUpperCase();
        if (NEEDS_CATS.has(up)) needs += amt;
        else if (WANTS_CATS.has(up)) wants += amt;
      }
      const needsPct = Math.round((needs / monthlyIncome) * 100);
      const wantsPct = Math.round((wants / monthlyIncome) * 100);
      const savingsPct = Math.max(0, 100 - needsPct - wantsPct);
      if (wantsPct > 30) {
        return {
          emoji: '⚖️',
          headline: `Wants are ${wantsPct}% of income — target 30%`,
          body: `Needs ${needsPct}% · Wants ${wantsPct}% · Savings ${savingsPct}%. Trim ~$${Math.round((wantsPct - 30) * monthlyIncome / 100)} from dining & shopping to hit 50/30/20.`,
          chip: `${wantsPct}% wants`,
        };
      }
      return {
        emoji: '✅',
        headline: `On-plan: ${needsPct}/${wantsPct}/${savingsPct}`,
        body: 'Your split is within healthy 50/30/20 range. Keep it up — every % above 20 savings compounds.',
        chip: `${savingsPct}% saved`,
      };
    }

    case 'zero-based': {
      if (monthlyIncome <= 0) return null;
      const unallocated = Math.max(0, monthlyIncome - monthSpend);
      const pct = Math.round((unallocated / monthlyIncome) * 100);
      return {
        emoji: '📋',
        headline: `$${unallocated.toFixed(0)} unassigned this month`,
        body: pct > 5
          ? `${pct}% of income has no job yet — drop it into savings or debt paydown before month-end.`
          : 'Every dollar has a job. Your zero-based budget is balanced.',
        chip: `${pct}% free`,
      };
    }

    case 'envelope': {
      // Find the category closest to its cap (user hasn't set caps yet — we use historical average as cap).
      const entries = Object.entries(spendByCategory).sort((a, b) => b[1] - a[1]);
      if (!entries.length) return null;
      const [topCat, topAmt] = entries[0];
      return {
        emoji: '✉️',
        headline: `${topCat.toLowerCase()} envelope: $${topAmt.toFixed(0)} used`,
        body: 'Set a cap for this category in Planning to get mid-month warnings when you hit 80%.',
        chip: topCat.slice(0, 10),
      };
    }

    case 'debt-snowball': {
      if (!cards.length || liabilitiesTotal <= 0) return null;
      const target = [...cards].filter((c) => c.balance > 0).sort((a, b) => a.balance - b.balance)[0];
      if (!target) return null;
      return {
        emoji: '❄️',
        headline: `Snowball target: ${target.name}`,
        body: `Smallest balance at $${target.balance.toFixed(0)}. Throw every extra dollar here — quick win builds momentum.`,
        chip: `$${target.balance.toFixed(0)}`,
      };
    }

    case 'debt-avalanche': {
      const withApr = cards.filter((c) => c.balance > 0 && (c.apr ?? 0) > 0);
      if (!withApr.length) return null;
      const target = [...withApr].sort((a, b) => (b.apr! - a.apr!))[0];
      return {
        emoji: '🏔️',
        headline: `Avalanche target: ${target.name}`,
        body: `${target.apr}% APR on $${target.balance.toFixed(0)}. Extra payments here save the most interest.`,
        chip: `${target.apr}% APR`,
      };
    }

    case 'emergency-fund': {
      // Approx essentials = needs this month * 3 → 6.
      let essentials = 0;
      for (const [cat, amt] of Object.entries(spendByCategory)) {
        if (NEEDS_CATS.has(cat.toUpperCase())) essentials += amt;
      }
      if (essentials <= 0) return null;
      return {
        emoji: '🛟',
        headline: `Emergency-fund goal: $${(essentials * 3).toFixed(0)} – $${(essentials * 6).toFixed(0)}`,
        body: `Based on ~$${essentials.toFixed(0)}/mo in essentials. Park it in a HYSA — untouchable unless real emergency.`,
        chip: '3–6 mo',
      };
    }

    case 'pay-yourself-first': {
      if (monthlyIncome <= 0) return null;
      const recommended = Math.round(monthlyIncome * 0.2);
      return {
        emoji: '💰',
        headline: `Pay yourself $${recommended} this month`,
        body: '20% of take-home moved to savings/investing the day your paycheck hits. Live on the rest.',
        chip: '20%',
      };
    }
  }
  return null;
}
