const PAYOUT_THRESHOLD_INR = 1000;
const DAYS_AFTER_QUARTER = 45;

function endOfCurrentQuarter(from = new Date()) {
  const year = from.getUTCFullYear();
  const month = from.getUTCMonth();
  const quarterEndMonth = month < 3 ? 2 : month < 6 ? 5 : month < 9 ? 8 : 11;
  return new Date(Date.UTC(year, quarterEndMonth + 1, 0, 23, 59, 59, 999));
}

export function nextPayoutDate(from = new Date()) {
  const quarterEnd = endOfCurrentQuarter(from);
  const payout = new Date(quarterEnd);
  payout.setUTCDate(payout.getUTCDate() + DAYS_AFTER_QUARTER);
  return payout;
}

export function royaltyFacts(book) {
  if (!book) {
    return {
      hasBook: false,
      nextPayoutDate: nextPayoutDate().toISOString().slice(0, 10),
      belowThreshold: false,
      neverPaid: false,
      inProduction: false,
    };
  }

  const pending = book.royaltyPending ?? 0;
  const inProduction = !book.mrp || String(book.status).startsWith('In Production');
  return {
    hasBook: true,
    nextPayoutDate: nextPayoutDate().toISOString().slice(0, 10),
    belowThreshold: !inProduction && pending > 0 && pending < PAYOUT_THRESHOLD_INR,
    neverPaid: !inProduction && pending > 0 && !book.lastRoyaltyPayoutDate,
    inProduction,
    payoutThresholdInr: PAYOUT_THRESHOLD_INR,
  };
}
