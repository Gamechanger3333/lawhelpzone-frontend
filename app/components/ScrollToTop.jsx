"use client";
// app/components/ScrollToTop.jsx
//
// A floating "back to top" button, shown site-wide once the user has
// scrolled down a page. Sits just below the AI chat bubble (bottom: 80,
// right: 20) so the two never overlap.
import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      title="Back to top"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 45,
        width: 42,
        height: 42,
        borderRadius: "50%",
        border: "none",
        background: "#0A1A3F",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 6px 18px rgba(10,26,63,0.35)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.8)",
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.25s ease, transform 0.25s ease",
      }}
    >
      <ArrowUp size={19} />
    </button>
  );
}
