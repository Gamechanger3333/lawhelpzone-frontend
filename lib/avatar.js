// lib/avatar.js
//
// Wherever a user has no uploaded profile photo, the UI used to fall back to
// a flat colored circle with a single letter. That's the "drawing box" /
// wireframe feel — it never looks like a real person.
//
// This gives a real, photographic portrait instead. It's deterministic: the
// same person (same seed — their _id, or failing that, email/name) always
// gets the same photo, so it doesn't flicker between renders or reloads.
// No API key, no backend change required — just a stable public image URL.

/**
 * Returns a stable portrait-photo URL for a given seed (id, email, or name).
 * Same seed -> same photo, every time.
 */
export function getPortraitUrl(seed, size = 200) {
  const safeSeed = encodeURIComponent(String(seed || "guest"));
  return `https://i.pravatar.cc/${size}?u=${safeSeed}`;
}

/**
 * Picks the best available avatar source for a person:
 * 1. An explicitly uploaded photo (profileImage / avatar / photoUrl), if any.
 * 2. Otherwise a real, consistent generated portrait — never a bare initial.
 */
export function resolveAvatarUrl(person = {}, size = 200) {
  const uploaded = person.profileImage || person.avatar || person.photoUrl;
  if (uploaded) return uploaded;
  const seed = person._id || person.id || person.email || person.name || "guest";
  return getPortraitUrl(seed, size);
}
