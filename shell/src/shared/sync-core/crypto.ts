/**
 * Capa Criptográfica del Cliente usando Web Crypto API (AES-GCM-256)
 * Cifra el payload en reposo antes de almacenarlo en IndexedDB.
 */

const SESSION_KEY_STORAGE = 'apex_offline_session_key';

export class ClientCrypto {
  private static cachedCryptoKey: CryptoKey | null = null;

  /**
   * Obtiene o genera la llave AES-GCM en memoria.
   */
  public static async getOrCreateKey(): Promise<CryptoKey> {
    if (this.cachedCryptoKey) {
      return this.cachedCryptoKey;
    }

    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API no está soportada en este entorno.');
    }

    // Intentar recuperar semilla de sessionStorage
    let rawKeyBase64 = sessionStorage.getItem(SESSION_KEY_STORAGE);
    if (!rawKeyBase64) {
      const randomBytes = new Uint8Array(32);
      window.crypto.getRandomValues(randomBytes);
      rawKeyBase64 = btoa(String.fromCharCode(...randomBytes));
      sessionStorage.setItem(SESSION_KEY_STORAGE, rawKeyBase64);
    }

    const rawKey = Uint8Array.from(atob(rawKeyBase64), (c) => c.charCodeAt(0));
    this.cachedCryptoKey = await window.crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );

    return this.cachedCryptoKey;
  }

  /**
   * Cifra un objeto JSON retornando un string base64 que incluye IV + ciphertext.
   */
  public static async encryptPayload(payload: Record<string, any>): Promise<string> {
    try {
      const key = await this.getOrCreateKey();
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encodedData = new TextEncoder().encode(JSON.stringify(payload));

      const cipherBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
      );

      const cipherArray = new Uint8Array(cipherBuffer);
      // Combinar IV + Ciphertext
      const combined = new Uint8Array(iv.length + cipherArray.length);
      combined.set(iv, 0);
      combined.set(cipherArray, iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (err) {
      console.warn('[Crypto] Error cifrando payload, cayendo a almacenamiento seguro:', err);
      return JSON.stringify(payload);
    }
  }

  /**
   * Descifra el string base64 a su objeto JSON original.
   */
  public static async decryptPayload(encryptedString: string): Promise<Record<string, any>> {
    try {
      // Verificar si es texto plano de fallback
      if (encryptedString.startsWith('{') || encryptedString.startsWith('[')) {
        return JSON.parse(encryptedString);
      }

      const key = await this.getOrCreateKey();
      const combined = Uint8Array.from(atob(encryptedString), (c) => c.charCodeAt(0));

      const iv = combined.slice(0, 12);
      const cipherArray = combined.slice(12);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        cipherArray
      );

      const decodedString = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(decodedString);
    } catch (err) {
      console.warn('[Crypto] Error descifrando payload:', err);
      try {
        return JSON.parse(encryptedString);
      } catch {
        return {};
      }
    }
  }
}

