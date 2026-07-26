// AES-256-GCM field encryption utility (for OAuth tokens and secrets)
export async function encryptField(value: string, hexKey: string): Promise<string> {
  const keyBytes = hexToBytes(hexKey)
  const key = await crypto.subtle.importKey(
    'raw', keyBytes.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, ['encrypt']
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(value))
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return btoa(String.fromCharCode(...combined))
}

export async function decryptField(encrypted: string, hexKey: string): Promise<string> {
  if (!encrypted) return ''
  try {
    const combined = new Uint8Array(
      atob(encrypted).split('').map(c => c.charCodeAt(0))
    )
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)
    const keyBytes = hexToBytes(hexKey)
    const key = await crypto.subtle.importKey(
      'raw', keyBytes.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, ['decrypt']
    )
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
    return new TextDecoder().decode(decrypted)
  } catch (err) {
    // Return plain text fallback if token was unencrypted or key changed
    return encrypted
  }
}

function hexToBytes(hex: string): Uint8Array {
  const paddedHex = hex.length % 2 === 0 ? hex : '0' + hex
  const bytes = new Uint8Array(paddedHex.length / 2)
  for (let i = 0; i < paddedHex.length; i += 2) {
    bytes[i / 2] = parseInt(paddedHex.slice(i, i + 2), 16)
  }
  return bytes
}
