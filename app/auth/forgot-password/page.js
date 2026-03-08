"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, CheckCircle2, Mail } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");
  const [orbs, setOrbs]       = useState([]);

  useEffect(() => {
    setOrbs([
      { w: 360, h: 360, top: -12, left: 52, color: "#1e3a6e" },
      { w: 260, h: 260, top: 62,  left: -6, color: "#1e40af" },
      { w: 200, h: 200, top: 28,  left: 70, color: "#1d4ed8" },
    ]);
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to send reset link"); setLoading(false); return; }
      setSent(true);
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-blue-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent focus:bg-white transition-all duration-200";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #e8effe 40%, #f0f6ff 100%)" }}
    >
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{ width: orb.w, height: orb.h, top: `${orb.top}%`, left: `${orb.left}%`, background: orb.color, opacity: 0.06, filter: "blur(72px)" }}
          animate={{ y: [0, i % 2 === 0 ? -22 : 22], x: [0, i % 2 === 0 ? 10 : -10] }}
          transition={{ duration: 7 + i * 1.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      ))}

      <motion.div className="w-full max-w-md relative z-10" variants={stagger} initial="hidden" animate="show">
        <AnimatePresence mode="wait">

          {/* ── Success ── */}
          {sent ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{   opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/70 p-10 text-center space-y-5"
              style={{ boxShadow: "0 24px 64px rgba(30,58,138,0.10)" }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2 shadow-xl"
                style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
              >
                <CheckCircle2 className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-xl font-bold text-slate-900">Check Your Email</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                If an account exists for <span className="font-semibold text-slate-700">{email}</span>,
                you&apos;ll receive a password reset link shortly.
              </p>
              <motion.button
                onClick={() => router.push("/auth/login")}
                whileHover={{ x: -2 }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline transition-colors"
                style={{ color: "#1e40af" }}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to login
              </motion.button>
            </motion.div>

          ) : (
            /* ── Form ── */
            <motion.div key="form" variants={stagger} initial="hidden" animate="show">
              <motion.div variants={fadeUp} className="text-center mb-8">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: -4 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-xl"
                  style={{ background: "linear-gradient(135deg, #1e3a8a, #1e40af)" }}
                >
                  <Mail className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Forgot Password</h1>
                <p className="text-slate-500 mt-1.5 text-sm">Enter your email to receive a reset link</p>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/70 p-8"
                style={{ boxShadow: "0 24px 64px rgba(30,58,138,0.10)" }}
              >
                <form onSubmit={handleSubmit} className="space-y-5">
                  <motion.div variants={fadeUp} className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
                    <input
                      id="email" type="email" required value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="you@example.com" className={inputCls}
                    />
                  </motion.div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -6, height: 0 }}
                        className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"
                      >
                        <p className="text-sm text-red-600 text-center font-medium">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div variants={fadeUp}>
                    <motion.button
                      type="submit" disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                      className="w-full h-11 flex items-center justify-center rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg, #1e40af, #1e3a8a)", boxShadow: "0 6px 24px rgba(30,58,138,0.25)" }}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                    </motion.button>
                  </motion.div>

                  <motion.p variants={fadeUp} className="text-center">
                    <motion.span
                      onClick={() => router.push("/auth/login")}
                      whileHover={{ x: -2 }}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold cursor-pointer hover:underline transition-colors"
                      style={{ color: "#1e40af" }}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to login
                    </motion.span>
                  </motion.p>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.p variants={fadeUp} className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} <span className="font-semibold text-blue-900">LawHelpZone</span> · All rights reserved
        </motion.p>
      </motion.div>
    </div>
  );
}