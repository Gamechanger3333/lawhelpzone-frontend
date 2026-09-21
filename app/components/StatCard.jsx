"use client";
// app/components/StatCard.jsx
//
// Shared "hero stat" card used across the client, lawyer and admin
// dashboards. Deliberately restrained: a white card, a single muted accent
// color (left bar + icon chip), serious typography. No candy gradients, no
// floating bubble decorations — this is a legal-services dashboard, not a
// game HUD.
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

export default function StatCard({ label, value, icon: Icon, emoji, sub, accent = "#1e3a5f", trend, index = 0 }) {
  return (
    <div
      className="hero-stat-card"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        background: "#fff",
        border: "1px solid #e6e9ef",
        borderLeft: `4px solid ${accent}`,
        borderRadius: 12,
        padding: "18px 20px",
        boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
        animation: `fd 0.4s ease ${index * 0.06}s both`,
        minHeight: 108,
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 9, background: accent, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: emoji ? 18 : undefined,
      }}>
        {Icon ? <Icon size={19} style={{ color: "#fff" }} /> : emoji}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6 }}>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#0f172a", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
            {typeof value === "number" ? <Counter to={value} /> : value}
          </p>
          {trend && <span style={{ fontSize: 10.5, fontWeight: 600, color: "#94a3b8", whiteSpace: "nowrap" }}>{trend}</span>}
        </div>
        <p style={{ margin: "3px 0 0", fontSize: 12.5, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</p>
        {sub && <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#94a3b8" }}>{sub}</p>}
      </div>
    </div>
  );
}
