/**
 * cryptoUtils.js
 * ------------------------------------------------------------------
 * Cifrado simétrico del lado del cliente (AES-256-GCM) usando la API
 * nativa del navegador (window.crypto.subtle). No depende de librerías
 * externas (no usa crypto-js), reduciendo superficie de ataque.
 *
 * Firebase / Firestore NUNCA reciben la clave ni el texto plano: solo
 * reciben la salida de encryptData(), que es Base64 ilegible.
 * ------------------------------------------------------------------
 */

const PBKDF2_ITERATIONS = 250000; // Coste de derivación (mitiga fuerza bruta)
const SALT_BYTES = 16;
const IV_BYTES = 12; // Tamaño recomendado de IV para AES-GCM

function bufToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuf(b64) {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

/**
 * Deriva una clave AES-256 a partir de la clave maestra (texto) + una sal
 * aleatoria, usando PBKDF2-SHA256. La sal se guarda junto al ciphertext,
 * así que no hace falta recordarla.
 */
async function deriveKey(secretKey, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(secretKey),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Cifra un texto (o cualquier valor serializable) con la clave maestra.
 * Formato de salida (todo en un único string Base64):
 *   [ salt(16 bytes) | iv(12 bytes) | ciphertext+tag ]
 *
 * @param {string|number} text
 * @param {string} secretKey - Clave maestra del usuario (nunca se envía a la nube)
 * @returns {Promise<string>} Base64 listo para guardar en Firestore
 */
async function encryptData(text, secretKey) {
    if (text === null || text === undefined || text === '') return text;
    if (!secretKey) throw new Error('cryptoUtils: falta secretKey para cifrar.');

    const plaintext = typeof text === 'string' ? text : JSON.stringify(text);
    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const key = await deriveKey(secretKey, salt);

    const cipherBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(plaintext)
    );

    const combined = new Uint8Array(salt.length + iv.length + cipherBuffer.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(cipherBuffer), salt.length + iv.length);

    return bufToBase64(combined.buffer);
}

/**
 * Descifra un valor generado por encryptData(). Si la clave es incorrecta
 * o el dato está corrupto, AES-GCM lo detecta (falla la verificación de
 * integridad) y devolvemos un marcador en vez de datos basura.
 *
 * @param {string} ciphertext - Valor Base64 leído de Firestore
 * @param {string} secretKey
 * @returns {Promise<string>}
 */
async function decryptData(ciphertext, secretKey) {
    if (ciphertext === null || ciphertext === undefined || ciphertext === '') return ciphertext;
    if (!secretKey) throw new Error('cryptoUtils: falta secretKey para descifrar.');

    try {
        const combined = base64ToBuf(ciphertext);
        const salt = combined.slice(0, SALT_BYTES);
        const iv = combined.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
        const data = combined.slice(SALT_BYTES + IV_BYTES);

        const key = await deriveKey(secretKey, salt);
        const plainBuffer = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
        return new TextDecoder().decode(plainBuffer);
    } catch (err) {
        console.error('cryptoUtils: no se pudo descifrar (clave incorrecta o dato corrupto).', err);
        return '🔒 [cifrado]';
    }
}

/**
 * Azúcar sintáctico para campos numéricos (peso, altura, calorías...).
 * Cifra convirtiendo a string; al leer, convierte de vuelta a number.
 */
async function encryptNumber(value, secretKey) {
    if (value === null || value === undefined) return null;
    return encryptData(String(value), secretKey);
}

async function decryptNumber(ciphertext, secretKey) {
    const txt = await decryptData(ciphertext, secretKey);
    const num = parseFloat(txt);
    return Number.isNaN(num) ? txt : num;
}

// Exponer en window para poder usarlo desde app.js sin módulos ES (mismo
// patrón <script> que usa el resto de tu app, compatible con firebase-compat).
window.cryptoUtils = { encryptData, decryptData, encryptNumber, decryptNumber };
