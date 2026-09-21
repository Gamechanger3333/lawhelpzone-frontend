"use client";
// app/components/StatCard.jsx
//
// Shared "hero stat" card used across the client, lawyer and admin
// dashboards. Replaces the old flat white box (icon badge + number + label)
// with a colored gradient card that has real depth: a soft glow, a
// decorative blurred orb, and a glassy icon chip — so every dashboard reads
// as one modern, deliberately-designed surface instead of a wireframe.
import { useState, useEffect } from "react";

function Counter({ to = 0, duration = 700 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf, start;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return n.toLocaleString();
}

export default function StatCard({ label, value, icon: Icon, emoji, sub, gradient, trend, index = 0 }) {
  return (
    <div
      className="hero-stat-card"
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 20,
        padding: "22px 22px 20px",
        background: gradient,
        boxShadow: "0 10px 30px -8px rgba(15,23,42,0.28)",
        animation: `fd 0.5s ease ${index * 0.08}s both`,
        minHeight: 128,
      }}
    >
      {/* decorative glow orb */}
      <div style={{ position: "absolute", top: -30, right: -30, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.16)", filter: "blur(2px)" }} />
      <div style={{ position: "absolute", bottom: -40, right: 20, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />

      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.22)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: emoji ? 19 : undefined }}>
          {Icon ? <Icon size={20} style={{ color: "#fff" }} /> : emoji}
        </div>
        {trend && (
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.18)", borderRadius: 20, padding: "3px 8px" }}>
            {trend}
          </span>
        )}
      </div>

      <p style={{ position: "relative", margin: "16px 0 0", fontSize: 32, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-0.02em" }}>
        {typeof value === "number" ? <Counter to={value} /> : value}
      </p>
      <p style={{ position: "relative", margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{label}</p>
      {sub && <p style={{ position: "relative", margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{sub}</p>}
    </div>
  );
}
