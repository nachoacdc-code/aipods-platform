/**
 * Client-side encryption using Web Crypto API.
 * The encryption key is generated in the browser and stored in IndexedDB.
 * It NEVER leaves the client — AIpods cannot decrypt user data server-side.
 */

const DB_NAME = 'aipods_keystore';
const STORE_NAME = 'keys';
const KEY_ID = 'master_key';
const ALGO = 'AES-GCM';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getOrCreateKey(): Promise<CryptoKey> {
  const db = await openDB();

  const existing = await new Promise<CryptoKey | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(KEY_ID);
    req.onsuccess = () => resolve(req.result as CryptoKey | undefined);
    req.onerror = () => reject(req.error);
  });

  if (existing) return existing;

  const key = await crypto.subtle.generateKey(
    { name: ALGO, length: 256 },
    false, // not extractable — cannot be exported from browser
    ['encrypt', 'decrypt'],
  );

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(key, KEY_ID);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  return key;
}

export async function encryptBlob(data: ArrayBuffer): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    data,
  );

  return { encrypted, iv };
}

export async function decryptBlob(encrypted: ArrayBuffer, iv: Uint8Array): Promise<ArrayBuffer> {
  const key = await getOrCreateKey();

  return crypto.subtle.decrypt(
    { name: ALGO, iv: iv as unknown as BufferSource },
    key,
    encrypted,
  );
}

/**
 * Pack encrypted data + IV into a single ArrayBuffer for storage.
 * Format: [12 bytes IV][encrypted data]
 */
export function packEncrypted(encrypted: ArrayBuffer, iv: Uint8Array): ArrayBuffer {
  const packed = new Uint8Array(iv.byteLength + encrypted.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(encrypted), iv.byteLength);
  return packed.buffer;
}

/**
 * Unpack a stored blob back into IV + encrypted data.
 */
export function unpackEncrypted(packed: ArrayBuffer): { encrypted: ArrayBuffer; iv: Uint8Array } {
  const arr = new Uint8Array(packed);
  const iv = arr.slice(0, 12);
  const encrypted = arr.slice(12).buffer;
  return { encrypted, iv };
}
