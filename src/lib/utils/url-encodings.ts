export class URLSafeUUIDShortener {
  // Strictly URL-safe characters
  // Only using: 0-9, a-z, A-Z, and hyphen
  private static readonly URL_SAFE_CHARS =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  /**
   * Converts a hex string to a URL-safe compact representation
   * @param hexStr Hex string to compress
   * @returns URL-safe compressed string
   */
  private static compressHex(hexStr: string): string {
    const base = this.URL_SAFE_CHARS.length;
    let num = BigInt(0); // Using BigInt for precise large number handling

    // Convert hex to a single large number
    for (let i = 0; i < hexStr.length; i++) {
      num = num * BigInt(16) + BigInt(parseInt(hexStr[i], 16));
    }

    // Convert to URL-safe representation
    if (num === BigInt(0)) return this.URL_SAFE_CHARS[0];

    let compressed = "";
    while (num > BigInt(0)) {
      compressed = this.URL_SAFE_CHARS[Number(num % BigInt(base))] + compressed;
      num = num / BigInt(base);
    }

    return compressed;
  }

  /**
   * Decompresses the URL-safe representation back to hex
   * @param compressed Compressed string
   * @returns Hex string
   */
  private static decompressToHex(compressed: string): string {
    const base = this.URL_SAFE_CHARS.length;
    let num = BigInt(0);

    // Convert compressed string back to a number
    for (const char of compressed) {
      const index = this.URL_SAFE_CHARS.indexOf(char);
      if (index === -1) throw new Error("Invalid compressed character");
      num = num * BigInt(base) + BigInt(index);
    }

    // Convert number back to hex
    const hex = num.toString(16);
    return hex.padStart(32, "0");
  }

  /**
   * Encodes a full UUID to a URL-safe compact string
   * @param uuid Full UUID string
   * @returns URL-safe compact representation
   */
  static encode(uuid: string): string {
    // Remove hyphens and convert to lowercase
    const hexStr = uuid.replace(/-/g, "").toLowerCase();
    return this.compressHex(hexStr);
  }

  /**
   * Decodes a URL-safe compact string back to full UUID
   * @param shortUuid Compact UUID string
   * @returns Full UUID string
   */
  static decode(shortUuid: string): string {
    // Convert back to hex
    const hexStr = this.decompressToHex(shortUuid);

    // Insert hyphens to restore UUID format
    return [
      hexStr.slice(0, 8),
      hexStr.slice(8, 12),
      hexStr.slice(12, 16),
      hexStr.slice(16, 20),
      hexStr.slice(20),
    ].join("-");
  }
}
