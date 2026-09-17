// Blockchain adapter placeholder.
// Do not credit deposits based on user-submitted txids.
// Implement provider-specific verification here (TRON/EVM/BTC) before changing wallet balances.

export async function verifyDeposit({ asset, txid, expectedAddress, expectedAmount }) {
  throw new Error("Blockchain verification adapter is not configured yet.");
}