// SHA-256 helpers built on the browser's Web Crypto API.
// Hashes are always returned as 0x-prefixed lowercase hex (32 bytes) so the same format
// is used for registration and verification, and fits a Solidity bytes32.
//
// NOTE: a matching hash proves the file contents are unchanged. It does NOT prove the
// original invoice was genuine.

const toHex = (buffer) =>
  "0x" +
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export async function hashFile(file) {
  const buffer = await file.arrayBuffer();
  return toHex(await crypto.subtle.digest("SHA-256", buffer));
}

export async function hashText(text) {
  const buffer = new TextEncoder().encode(text);
  return toHex(await crypto.subtle.digest("SHA-256", buffer));
}

export const hashesMatch = (a, b) => a?.toLowerCase() === b?.toLowerCase();
