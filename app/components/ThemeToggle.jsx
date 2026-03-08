"use client";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Read saved preference
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved === "dark" || (!saved && prefersDark);
    setDark(isDark);
    applyTheme(isDark);
  }, []);

  const applyTheme = (isDark) => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  };

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    applyTheme(next);
  };

  if (!mounted) return <div style={{ width: 52, height: 28, borderRadius: 14, background: "#e2e8f0" }} />;

  return (
    <button
      onClick={toggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: 52, height: 28, borderRadius: 14,
        background: dark ? "#3b82f6" : "#e2e8f0",
        border: "none", cursor: "pointer",
        position: "relative", transition: "background 0.3s",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: dark ? 27 : 3,
        width: 22, height: 22, borderRadius: "50%",
        background: "#fff",
        transition: "left 0.3s",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
      }}>
        {dark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
