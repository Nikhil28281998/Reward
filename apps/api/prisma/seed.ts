import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Seed card products ───────────────────────────────────────────────────────
// A curated list of popular US rewards credit cards (v1).
// `categoryRates`, `redeemValues`, and `benefits` are JSON columns.

type CategoryRate = { category: string; multiplier: number; cap?: number };
type RedeemValue = { method: string; centsPerPoint: number };
type CardBenefit = { label: string; value?: string };

type CardProductSeed = {
  issuer: string;
  name: string;
  fullName: string;
  network: string;
  annualFee: number;
  signupBonus?: number;
  signupSpendReq?: number;
  signupMonths?: number;
  rewardCurrency: string;
  baseEarnRate: number;
  categoryRates: CategoryRate[];
  redeemValues: RedeemValue[];
  benefits: CardBenefit[];
  foreignTransFee?: number;
  creditScoreMin?: number;
  referralUrl?: string;
  gradient: string[];
};

const CARDS: CardProductSeed[] = [
  {
    issuer: 'Chase',
    name: 'Sapphire Preferred',
    fullName: 'Chase Sapphire Preferred® Card',
    network: 'VISA',
    annualFee: 95,
    signupBonus: 60000,
    signupSpendReq: 4000,
    signupMonths: 3,
    rewardCurrency: 'ULTIMATE_REWARDS',
    baseEarnRate: 1,
    categoryRates: [
      { category: 'travel', multiplier: 5 },
      { category: 'dining', multiplier: 3 },
      { category: 'streaming', multiplier: 3 },
      { category: 'groceries', multiplier: 3 },
    ],
    redeemValues: [
      { method: 'travel_portal', centsPerPoint: 1.25 },
      { method: 'transfer_partner', centsPerPoint: 2.0 },
      { method: 'cashback', centsPerPoint: 1.0 },
    ],
    benefits: [
      { label: 'No foreign transaction fees' },
      { label: 'Trip cancellation insurance' },
      { label: '$50 annual hotel credit (Chase travel)' },
    ],
    foreignTransFee: 0,
    creditScoreMin: 700,
    gradient: ['#1A56DB', '#1C64F2'],
  },
  {
    issuer: 'Chase',
    name: 'Freedom Unlimited',
    fullName: 'Chase Freedom Unlimited®',
    network: 'VISA',
    annualFee: 0,
    signupBonus: 20000,
    signupSpendReq: 500,
    signupMonths: 3,
    rewardCurrency: 'ULTIMATE_REWARDS',
    baseEarnRate: 1.5,
    categoryRates: [
      { category: 'travel', multiplier: 5 },
      { category: 'dining', multiplier: 3 },
      { category: 'drugstore', multiplier: 3 },
    ],
    redeemValues: [
      { method: 'cashback', centsPerPoint: 1.0 },
      { method: 'travel_portal', centsPerPoint: 1.0 },
    ],
    benefits: [{ label: 'No annual fee' }, { label: 'Purchase protection' }],
    gradient: ['#1A56DB', '#2563EB'],
  },
  {
    issuer: 'American Express',
    name: 'Gold Card',
    fullName: 'American Express® Gold Card',
    network: 'AMEX',
    annualFee: 325,
    signupBonus: 60000,
    signupSpendReq: 6000,
    signupMonths: 6,
    rewardCurrency: 'MEMBERSHIP_REWARDS',
    baseEarnRate: 1,
    categoryRates: [
      { category: 'dining', multiplier: 4 },
      { category: 'groceries', multiplier: 4, cap: 25000 },
      { category: 'travel', multiplier: 3 },
    ],
    redeemValues: [
      { method: 'transfer_partner', centsPerPoint: 2.0 },
      { method: 'travel_portal', centsPerPoint: 1.0 },
      { method: 'cashback', centsPerPoint: 0.6 },
    ],
    benefits: [
      { label: '$120 Uber Cash annually' },
      { label: '$120 dining credit annually' },
      { label: 'No foreign transaction fees' },
    ],
    foreignTransFee: 0,
    creditScoreMin: 720,
    gradient: ['#D4AF37', '#B8860B'],
  },
  {
    issuer: 'American Express',
    name: 'Platinum Card',
    fullName: 'The Platinum Card® from American Express',
    network: 'AMEX',
    annualFee: 695,
    signupBonus: 80000,
    signupSpendReq: 8000,
    signupMonths: 6,
    rewardCurrency: 'MEMBERSHIP_REWARDS',
    baseEarnRate: 1,
    categoryRates: [
      { category: 'travel', multiplier: 5 },
    ],
    redeemValues: [
      { method: 'transfer_partner', centsPerPoint: 2.0 },
      { method: 'travel_portal', centsPerPoint: 1.0 },
      { method: 'cashback', centsPerPoint: 0.6 },
    ],
    benefits: [
      { label: '$200 airline credit' },
      { label: '$200 hotel credit' },
      { label: 'Centurion Lounge access' },
      { label: 'Global Entry / TSA PreCheck credit' },
    ],
    foreignTransFee: 0,
    creditScoreMin: 720,
    gradient: ['#111827', '#374151'],
  },
  {
    issuer: 'Capital One',
    name: 'Venture X',
    fullName: 'Capital One Venture X Rewards Credit Card',
    network: 'VISA',
    annualFee: 395,
    signupBonus: 75000,
    signupSpendReq: 4000,
    signupMonths: 3,
    rewardCurrency: 'CAPITAL_ONE_MILES',
    baseEarnRate: 2,
    categoryRates: [
      { category: 'travel', multiplier: 10 },
      { category: 'dining', multiplier: 5 },
    ],
    redeemValues: [
      { method: 'travel_portal', centsPerPoint: 1.0 },
      { method: 'transfer_partner', centsPerPoint: 1.7 },
      { method: 'cashback', centsPerPoint: 1.0 },
    ],
    benefits: [
      { label: '$300 annual travel credit' },
      { label: 'Priority Pass lounge access' },
      { label: '10,000 bonus miles every anniversary' },
    ],
    foreignTransFee: 0,
    creditScoreMin: 720,
    gradient: ['#B45309', '#D97706'],
  },
  {
    issuer: 'Citi',
    name: 'Double Cash',
    fullName: 'Citi® Double Cash Card',
    network: 'MASTERCARD',
    annualFee: 0,
    signupBonus: 20000,
    signupSpendReq: 1500,
    signupMonths: 6,
    rewardCurrency: 'THANKYOU_POINTS',
    baseEarnRate: 2,
    categoryRates: [],
    redeemValues: [
      { method: 'cashback', centsPerPoint: 1.0 },
      { method: 'transfer_partner', centsPerPoint: 1.25 },
    ],
    benefits: [{ label: 'No annual fee' }, { label: '2% on every purchase' }],
    gradient: ['#B91C1C', '#DC2626'],
  },
  {
    issuer: 'Discover',
    name: 'it Cash Back',
    fullName: 'Discover it® Cash Back',
    network: 'DISCOVER',
    annualFee: 0,
    signupBonus: 0,
    signupSpendReq: 0,
    signupMonths: 0,
    rewardCurrency: 'CASHBACK',
    baseEarnRate: 1,
    categoryRates: [
      { category: 'rotating', multiplier: 5, cap: 1500 },
    ],
    redeemValues: [{ method: 'cashback', centsPerPoint: 1.0 }],
    benefits: [{ label: 'Cashback match first year' }, { label: 'No annual fee' }],
    gradient: ['#D97706', '#F59E0B'],
  },
  {
    issuer: 'Bank of America',
    name: 'Customized Cash Rewards',
    fullName: 'Bank of America® Customized Cash Rewards Credit Card',
    network: 'VISA',
    annualFee: 0,
    signupBonus: 20000,
    signupSpendReq: 1000,
    signupMonths: 3,
    rewardCurrency: 'CASHBACK',
    baseEarnRate: 1,
    categoryRates: [
      { category: 'dining', multiplier: 3 },
      { category: 'groceries', multiplier: 2 },
    ],
    redeemValues: [{ method: 'cashback', centsPerPoint: 1.0 }],
    benefits: [{ label: 'No annual fee' }],
    gradient: ['#1E3A8A', '#1D4ED8'],
  },
];

// ─── Seed demo data for the demo/admin user ──────────────────────────────────
// Idempotent: only inserts CardAccount + transactions + offers if the
// admin user has zero card accounts. So you can wipe with: DELETE FROM "CardAccount" WHERE …

const DEMO_EMAILS = ['admin@reward.app', 'admin@labhly.com', 'demo@labhly.com'];

const DEMO_CARDS_TO_LINK = [
  { issuer: 'Chase', name: 'Sapphire Preferred', last4: '4821', nickname: 'Travel pick',  creditLimit: 18000, currentBalance:  1340.27, statementBalance: 1340.27, rewardBalance: 84200 },
  { issuer: 'American Express', name: 'Gold Card', last4: '1009', nickname: 'Dining + grocery', creditLimit: 12000, currentBalance: 612.55, statementBalance: 612.55, rewardBalance: 51800 },
  { issuer: 'Capital One', name: 'Venture X', last4: '7732', nickname: 'Premium travel', creditLimit: 25000, currentBalance: 2480.10, statementBalance: 2480.10, rewardBalance: 132400 },
  { issuer: 'Citi', name: 'Double Cash', last4: '5560', nickname: 'Everything else', creditLimit: 9000, currentBalance: 287.43, statementBalance: 287.43, rewardBalance: 8740 },
];

type Tx = { d: number; desc: string; merchant: string; amount: number; cat: string; cardIdx: number; reward: number };
// d = days ago. Mix across 60 days, last4 indicates which card (index into DEMO_CARDS_TO_LINK)
const DEMO_TRANSACTIONS: Tx[] = [
  { d: 1,  desc: 'STARBUCKS #4421',          merchant: 'Starbucks',     amount:  6.85,  cat: 'dining',     cardIdx: 1, reward: 27 },
  { d: 1,  desc: 'WHOLE FOODS MKT',          merchant: 'Whole Foods',   amount: 84.12,  cat: 'groceries',  cardIdx: 1, reward: 336 },
  { d: 2,  desc: 'UBER TRIP',                merchant: 'Uber',          amount: 18.40,  cat: 'transit',    cardIdx: 0, reward: 18 },
  { d: 2,  desc: 'NETFLIX.COM',              merchant: 'Netflix',       amount: 22.99,  cat: 'streaming',  cardIdx: 0, reward: 68 },
  { d: 3,  desc: 'CHIPOTLE 1842',            merchant: 'Chipotle',      amount: 14.20,  cat: 'dining',     cardIdx: 1, reward: 56 },
  { d: 3,  desc: 'SHELL OIL',                merchant: 'Shell',         amount: 47.30,  cat: 'gas',        cardIdx: 3, reward: 94 },
  { d: 4,  desc: 'TRADER JOES',              merchant: "Trader Joe's",  amount: 62.55,  cat: 'groceries',  cardIdx: 1, reward: 250 },
  { d: 5,  desc: 'DELTA AIR LINES',          merchant: 'Delta',         amount: 412.00, cat: 'travel',     cardIdx: 2, reward: 4120 },
  { d: 5,  desc: 'AIRBNB INC',               merchant: 'Airbnb',        amount: 286.50, cat: 'travel',     cardIdx: 2, reward: 2865 },
  { d: 6,  desc: 'AMAZON.COM*MK',            merchant: 'Amazon',        amount:  39.99, cat: 'online_shopping', cardIdx: 3, reward: 80 },
  { d: 7,  desc: 'SWEETGREEN',               merchant: 'Sweetgreen',    amount:  17.85, cat: 'dining',     cardIdx: 1, reward: 71 },
  { d: 8,  desc: 'SPOTIFY USA',              merchant: 'Spotify',       amount:  11.99, cat: 'streaming',  cardIdx: 0, reward: 35 },
  { d: 9,  desc: 'COSTCO WHSE',              merchant: 'Costco',        amount: 142.18, cat: 'wholesale',  cardIdx: 3, reward: 284 },
  { d: 10, desc: 'CHEVRON 0021',             merchant: 'Chevron',       amount:  52.40, cat: 'gas',        cardIdx: 3, reward: 105 },
  { d: 11, desc: 'TARGET 00012',             merchant: 'Target',        amount:  68.22, cat: 'groceries',  cardIdx: 3, reward: 136 },
  { d: 12, desc: 'APPLE.COM/BILL',           merchant: 'Apple',         amount:   9.99, cat: 'streaming',  cardIdx: 0, reward: 30 },
  { d: 13, desc: 'OLIVE GARDEN',             merchant: 'Olive Garden',  amount:  72.18, cat: 'dining',     cardIdx: 1, reward: 289 },
  { d: 14, desc: 'HILTON GARDEN INN',        merchant: 'Hilton',        amount: 218.00, cat: 'hotel',      cardIdx: 2, reward: 2180 },
  { d: 15, desc: 'LYFT *RIDE',               merchant: 'Lyft',          amount:  21.50, cat: 'transit',    cardIdx: 0, reward: 21 },
  { d: 16, desc: 'CVS PHARMACY',             merchant: 'CVS',           amount:  18.45, cat: 'drugstore',  cardIdx: 0, reward: 55 },
  { d: 18, desc: 'WALMART SUPERCENTER',      merchant: 'Walmart',       amount:  58.40, cat: 'groceries',  cardIdx: 3, reward: 117 },
  { d: 20, desc: 'PANERA BREAD',             merchant: 'Panera',        amount:  16.75, cat: 'dining',     cardIdx: 1, reward: 67 },
  { d: 22, desc: 'AMERICAN AIRLINES',        merchant: 'American',      amount: 348.00, cat: 'airfare',    cardIdx: 0, reward: 1740 },
  { d: 24, desc: 'EXXON MOBIL',              merchant: 'Exxon',         amount:  44.10, cat: 'gas',        cardIdx: 3, reward: 88 },
  { d: 26, desc: 'DOORDASH*MCDONALDS',       merchant: 'DoorDash',      amount:  22.15, cat: 'dining',     cardIdx: 1, reward: 88 },
  { d: 28, desc: 'AMC THEATRES',             merchant: 'AMC',           amount:  34.00, cat: 'entertainment', cardIdx: 0, reward: 34 },
  { d: 30, desc: 'TST*RAMEN HOUSE',          merchant: 'Ramen House',   amount:  31.40, cat: 'dining',     cardIdx: 1, reward: 125 },
  { d: 33, desc: 'MARRIOTT HOTELS',          merchant: 'Marriott',      amount: 412.00, cat: 'hotel',      cardIdx: 2, reward: 4120 },
  { d: 36, desc: 'ALDI #88',                 merchant: 'Aldi',          amount:  44.20, cat: 'groceries',  cardIdx: 1, reward: 176 },
  { d: 40, desc: 'SHELL OIL',                merchant: 'Shell',         amount:  58.20, cat: 'gas',        cardIdx: 3, reward: 116 },
  { d: 45, desc: 'UBER EATS',                merchant: 'Uber Eats',     amount:  28.40, cat: 'dining',     cardIdx: 1, reward: 113 },
  { d: 50, desc: 'YOUTUBE PREMIUM',          merchant: 'YouTube',       amount:  13.99, cat: 'streaming',  cardIdx: 0, reward: 41 },
  { d: 55, desc: 'KAYAK.COM',                merchant: 'Kayak',         amount: 184.00, cat: 'travel',     cardIdx: 2, reward: 1840 },
];

const DEMO_OFFERS = [
  { merchant: 'Sweetgreen',    cat: 'dining',     type: 'CASHBACK' as const, value: 15, vt: 'PERCENTAGE' as const, display: '15% back' },
  { merchant: 'United',        cat: 'travel',     type: 'POINTS_BONUS' as const, value: 5000, vt: 'FIXED' as const, display: '+5,000 pts' },
  { merchant: 'Whole Foods',   cat: 'groceries',  type: 'STATEMENT_CREDIT' as const, value: 10, vt: 'FIXED' as const, display: '$10 back on $50' },
  { merchant: 'Spotify',       cat: 'streaming',  type: 'STATEMENT_CREDIT' as const, value: 5, vt: 'FIXED' as const, display: '$5 statement credit' },
  { merchant: 'Hilton',        cat: 'hotel',      type: 'POINTS_BONUS' as const, value: 10000, vt: 'FIXED' as const, display: '10K pts on stay' },
  { merchant: 'Amazon',        cat: 'online_shopping', type: 'CASHBACK' as const, value: 8, vt: 'PERCENTAGE' as const, display: '8% back' },
];

async function seedDemoUserData() {
  for (const email of DEMO_EMAILS) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`  ⓘ  user ${email} not found — skipping demo data`);
      continue;
    }

    const existingCount = await prisma.cardAccount.count({ where: { userId: user.id } });
    if (existingCount > 0) {
      console.log(`  ⓘ  ${email} already has ${existingCount} cards — skipping demo data`);
      continue;
    }

    console.log(`\n🪄 Seeding demo data for ${email}…`);
    const cardAccountIds: string[] = [];

    for (const link of DEMO_CARDS_TO_LINK) {
      const product = await prisma.cardProduct.findFirst({
        where: { issuer: link.issuer, name: link.name },
      });
      if (!product) {
        console.log(`     ⚠ product not found: ${link.issuer} ${link.name}`);
        cardAccountIds.push('');
        continue;
      }

      const account = await prisma.cardAccount.create({
        data: {
          userId: user.id,
          cardProductId: product.id,
          last4: link.last4,
          nickname: link.nickname,
          creditLimit: new Prisma.Decimal(link.creditLimit),
          currentBalance: new Prisma.Decimal(link.currentBalance),
          statementBalance: new Prisma.Decimal(link.statementBalance),
          availableCredit: new Prisma.Decimal(link.creditLimit - link.currentBalance),
          rewardBalance: link.rewardBalance,
          statementClosingDay: 15,
          paymentDueDay: 10,
          openedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365),
        },
      });
      cardAccountIds.push(account.id);
      console.log(`     ✓ linked: ${link.issuer} ${link.name} (•••${link.last4})`);
    }

    let txCount = 0;
    for (const tx of DEMO_TRANSACTIONS) {
      const cardId = cardAccountIds[tx.cardIdx];
      if (!cardId) continue;
      const date = new Date(Date.now() - tx.d * 24 * 60 * 60 * 1000);
      await prisma.transactionCanonical.create({
        data: {
          cardAccountId: cardId,
          date,
          description: tx.desc,
          amount: new Prisma.Decimal(tx.amount),
          category: tx.cat,
          merchantName: tx.merchant,
          isCredit: false,
          rewardEarned: tx.reward,
        },
      });
      txCount++;
    }
    console.log(`     ✓ ${txCount} transactions seeded`);
  }

  // Seed shared offers (no user link required)
  const offerCount = await prisma.offer.count();
  if (offerCount === 0) {
    console.log(`\n🎁 Seeding ${DEMO_OFFERS.length} offers…`);
    const inThirty = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    for (const o of DEMO_OFFERS) {
      await prisma.offer.create({
        data: {
          merchantName: o.merchant,
          merchantCategory: o.cat,
          offerType: o.type,
          value: new Prisma.Decimal(o.value),
          valueType: o.vt,
          displayValue: o.display,
          activationRequired: false,
          startDate: new Date(),
          endDate: inThirty,
        },
      });
    }
  } else {
    console.log(`  ⓘ  ${offerCount} offers already exist — skipping`);
  }
}

async function main() {
  console.log('🌱 Seeding card products…');
  for (const card of CARDS) {
    const existing = await prisma.cardProduct.findFirst({
      where: { issuer: card.issuer, name: card.name },
    });

    const data = {
      issuer: card.issuer,
      name: card.name,
      fullName: card.fullName,
      network: card.network,
      annualFee: new Prisma.Decimal(card.annualFee),
      signupBonus: card.signupBonus,
      signupSpendReq: card.signupSpendReq != null ? new Prisma.Decimal(card.signupSpendReq) : null,
      signupMonths: card.signupMonths,
      rewardCurrency: card.rewardCurrency,
      baseEarnRate: new Prisma.Decimal(card.baseEarnRate),
      categoryRates: card.categoryRates as unknown as Prisma.InputJsonValue,
      redeemValues: card.redeemValues as unknown as Prisma.InputJsonValue,
      benefits: card.benefits as unknown as Prisma.InputJsonValue,
      foreignTransFee: new Prisma.Decimal(card.foreignTransFee ?? 0),
      creditScoreMin: card.creditScoreMin,
      referralUrl: card.referralUrl,
      gradient: card.gradient,
    };

    if (existing) {
      await prisma.cardProduct.update({ where: { id: existing.id }, data });
      console.log(`  ↻  updated: ${card.issuer} — ${card.name}`);
    } else {
      await prisma.cardProduct.create({ data });
      console.log(`  ✓  created: ${card.issuer} — ${card.name}`);
    }
  }
  console.log(`\n✅ Seeded ${CARDS.length} card products.`);

  await seedDemoUserData();
  console.log(`\n✨ Done.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
