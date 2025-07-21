// scripts/aiUtils.ts

/**
 * Checks if a given string is a valid Ethereum address.
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validates if a timestamp is above a reasonable threshold (after 2020).
 */
export function isValidTimestamp(ts: number): boolean {
  return Number.isInteger(ts) && ts > 1577836800; // Jan 1, 2020 UTC
}
