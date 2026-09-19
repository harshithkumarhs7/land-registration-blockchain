/**
 * Computes deterministic SHA-256 hash client-side using native Web Crypto API
 */
export async function calculateFileSha256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Truncates an Ethereum address e.g. 0xf39F...2266
 */
export function formatAddress(address?: string | null): string {
  if (!address) return 'Not Connected';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Truncates a blockchain transaction hash e.g. 0x4f12...8912a
 */
export function formatTxHash(hash?: string | null): string {
  if (!hash) return 'N/A';
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

/**
 * Formats ISO date string nicely
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
