import crypto from 'crypto';

export class HashUtil {
  /**
   * Generates a deterministic SHA-256 hash (hex string) from a buffer.
   */
  static sha256Buffer(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generates a deterministic SHA-256 hash (hex string) from string content.
   */
  static sha256String(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  }

  /**
   * Formats a hex string into a bytes32 0x-prefixed hex string for smart contract calls.
   */
  static toBytes32(hexString: string): string {
    const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
    return `0x${cleanHex.padEnd(64, '0').slice(0, 64)}`;
  }

  /**
   * Validates if a submitted hash matches an expected hash (timing-safe comparison).
   */
  static verifyHash(actualHash: string, expectedHash: string): boolean {
    const actualBuf = Buffer.from(actualHash.toLowerCase(), 'utf8');
    const expectedBuf = Buffer.from(expectedHash.toLowerCase(), 'utf8');

    if (actualBuf.length !== expectedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(actualBuf, expectedBuf);
  }

  /**
   * Generates a secure random 32-byte cryptographic hex nonce.
   */
  static generateNonce(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
