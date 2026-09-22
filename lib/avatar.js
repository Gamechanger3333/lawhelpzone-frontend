// lib/avatar.js
//
// Wherever a user has no uploaded profile photo, the UI falls back to a real
// portrait photo instead of a flat colored circle. This is gender-aware: it
// uses the person's stored `gender` field when available, and otherwise
// falls back to a small list of common name patterns, so a lawyer named
// "Ayesha" or "Hina" doesn't end up with a man's photo (and vice versa) —
// a mismatch looks more fake than a plain initial would.
//
// Source: randomuser.me's public portrait CDN — stable, direct image URLs,
// no API key, split into men/ and women/ folders.

const FEMALE_HINTS = [
  "ayesha", "hina", "sara", "sarah", "zara", "mira", "amina", "maryam",
  "fatima", "khadija", "sana", "iqra", "areeba", "hira", "mahnoor",
  "nimra", "laiba", "eman", "aiza", "rabia", "sadia", "asma", "noor",
  "zainab", "mehwish", "sidra", "anum", "mariam", "kiran", "farah",
];

function firstNameToken(name) {
  return String(name || "").trim().split(/\s+/)[0]?.toLowerCase() || "";
}

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function guessGenderFolder(person) {
  const g = String(person.gender || "").trim().toLowerCase();
  if (g === "female" || g === "f") return "women";
  if (g === "male" || g === "m") return "men";

  const first = firstNameToken(person.name);
  if (first && FEMALE_HINTS.includes(first)) return "women";

  // Unknown — alternate deterministically rather than defaulting everyone
  // to the same gender.
  const seed = person._id || person.id || person.email || person.name || "guest";
  return hashSeed(String(seed)) % 2 === 0 ? "men" : "women";
}

/** Stable, gender-matched portrait URL for a given person. */
export function getPortraitUrl(person = {}) {
  const seed = person._id || person.id || person.email || person.name || "guest";
  const index = hashSeed(String(seed)) % 100;
  const folder = guessGenderFolder(person);
  return `https://randomuser.me/api/portraits/${folder}/${index}.jpg`;
}

/**
 * Picks the best available avatar source for a person:
 * 1. An explicitly uploaded photo (profileImage / avatar / photoUrl), if any.
 * 2. Otherwise a real, gender-matched portrait — never a bare initial.
 */
export function resolveAvatarUrl(person = {}) {
  const uploaded = person.profileImage || person.avatar || person.photoUrl;
  if (uploaded) return uploaded;
  return getPortraitUrl(person);
}
