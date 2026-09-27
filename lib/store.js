import crypto from "crypto";
import fs from "fs";
import path from "path";

const USERS_FILE = path.join("/tmp", "secureid-users.json");

export const TICKET_TTL = 20 * 60; // seconds
export const MAX_ATTEMPTS = 3;

export const OTP_SECRET = process.env.OTP_SECRET || "dev-only-otp-secret-change-me";
export const SESSION_SECRET = process.env.SESSION_SECRET || "dev-only-session-secret-change-me";


function b64url(input) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(input) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}



export function signToken(payload, secret, expiresInSeconds) {
  const header = { alg: "HS256", typ: "JWT" };
  const body = { ...payload, exp: Date.now() + expiresInSeconds * 1000 };
  const headerPart = b64url(JSON.stringify(header));
  const bodyPart = b64url(JSON.stringify(body));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${headerPart}.${bodyPart}`)
    .digest("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${headerPart}.${bodyPart}.${signature}`;
}

export function verifyToken(token, secret) {
  if (!token || token.split(".").length !== 3) return null;
  const [headerPart, bodyPart, signature] = token.split(".");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${headerPart}.${bodyPart}`)
    .digest("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  const body = JSON.parse(b64urlDecode(bodyPart));
  if (Date.now() > body.exp) return null;
  return body;
}



export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const check = crypto.scryptSync(password, salt, 64).toString("hex");
  const hashBuf = Buffer.from(hash);
  const checkBuf = Buffer.from(check);
  return hashBuf.length === checkBuf.length && crypto.timingSafeEqual(hashBuf, checkBuf);
}
export function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch {
    return [];
  }
}

export function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function findUserByEmail(email) {
  return readUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer) {
  let bits = "";
  for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");
  let output = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    output += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  const remainder = bits.length % 5;
  if (remainder) {
    const chunk = bits.slice(bits.length - remainder).padEnd(5, "0");
    output += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  return output;
}

function base32Decode(str) {
  const clean = str.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const char of clean) {
    bits += BASE32_ALPHABET.indexOf(char).toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function generateTotpSecret() {
  return base32Encode(crypto.randomBytes(20));
}

function hotp(secretBase32, counter) {
  const key = base32Decode(secretBase32);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(binCode % 1000000).padStart(6, "0");
}

export function totp(secretBase32, forTimeMs = Date.now(), stepSeconds = 30) {
  const counter = Math.floor(forTimeMs / 1000 / stepSeconds);
  return hotp(secretBase32, counter);
}

export function verifyTotp(secretBase32, token, windowSteps = 1, stepSeconds = 30) {
  const now = Date.now();
  for (let errorWindow = -windowSteps; errorWindow <= windowSteps; errorWindow++) {
    const candidate = totp(secretBase32, now + errorWindow * stepSeconds * 1000, stepSeconds);
    if (candidate === token) return true;
  }
  return false;
}

export function buildOtpauthUri(secretBase32, accountEmail) {
  const label = encodeURIComponent(`SecureID:${accountEmail}`);
  return `otpauth://totp/${label}?secret=${secretBase32}&issuer=SecureID&digits=6&period=30`;
}

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

export function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}
export { generateOtp };

export function timingSafeEqualHex(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}
