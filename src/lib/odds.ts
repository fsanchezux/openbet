/** Decimal odds from a probability in % (e.g. 25 → 4.00). */
export function oddsFromProbability(prob: number): number {
  if (!prob || prob <= 0) return 0;
  return Math.round((100 / prob) * 100) / 100;
}

export function formatOdds(o: number): string {
  return o.toFixed(2);
}
