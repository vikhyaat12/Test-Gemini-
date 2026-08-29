import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

async function verifyPassword(password, stored) {
  const parts = stored.split("$");
  // parts[0] is "scrypt", parts[1] is salt, parts[2] is hash
  const salt = parts[1];
  const hash = parts[2];
  if (!salt || !hash) return false;
  const derived = await scryptAsync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

const adminHash = "scrypt$32947424c2c0266ad39c1e6b49a3b747$13558144f7b4dc502c70a6e6d4e8f2fa26c3a4d09981c70f2ec49248e0fa1225e26d46ccde3a68982277db05b0a28b90f9f7f3f060ddb7d4091d33abdc8875cf";

const res = await verifyPassword("QueensCare#Admin2026", adminHash);
console.log("Password verify result:", res);
