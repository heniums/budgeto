import type { TransactionData } from '../api/transactions';

/**
 * Finds the paired transaction for a transfer leg.
 * A pair is: same description, opposite amount sign, timestamp within 2 seconds.
 */
export function findTransferPair(
  tx: TransactionData,
  allTransactions: TransactionData[],
): TransactionData | null {
  const txTime = new Date(tx.createdAt).getTime();
  const txAmount = Number(tx.amount);

  return (
    allTransactions.find((other) => {
      if (other.id === tx.id) return false;
      if (other.description !== tx.description) return false;
      if (tx.description === '') return false;

      const otherAmount = Number(other.amount);
      // Opposite signs: one positive, one negative
      if (!(txAmount > 0 && otherAmount < 0) && !(txAmount < 0 && otherAmount > 0))
        return false;

      // Within 2-second window
      const otherTime = new Date(other.createdAt).getTime();
      return Math.abs(txTime - otherTime) < 2000;
    }) ?? null
  );
}
