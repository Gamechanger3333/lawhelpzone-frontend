// lib/images.js
//
// Real, freely-licensed photography (Unsplash License — free for commercial
// and personal use, no permission needed) used as section backgrounds across
// the site, in place of the old flat colors / cartoon illustrations. Kept in
// one place so any page can reuse the same set consistently.
//
// Credits (not required by the license, kept here for reference only):
//  - gavel:      Wesley Tingey
//  - lawBooks:   Mark Weaver
//  - courthouse: Adam Michael Szuscik
//  - handshake:  Cytonn Photography

const base = "https://images.unsplash.com";
const q = (id, w = 1600) => `${base}/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const LEGAL_IMAGES = {
  gavel:      q("photo-1555374018-13a8994ab246"),
  lawBooks:   q("photo-1511128250269-e45d82f3893e"),
  courthouse: q("photo-1629754041155-94ca3085e8d8"),
  handshake:  q("photo-1521790797524-b2497295b8a0"),
};
