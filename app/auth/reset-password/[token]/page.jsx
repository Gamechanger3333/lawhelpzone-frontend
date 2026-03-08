"use client";

// Place at:  app/auth/reset-password/[token]/page.jsx

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff, KeyRound, CheckCircle2, XCircle } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = { show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token  = params?.token;

  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [orbs, setOrbs]                 = useState([]);

  useEffect(() => {
    setOrbs([
      { w: 360, h: 360, top: -12, left: 55, color: "#1e3a6e" },
      { w: 280, h: 280, top: 60,  left: -6, color: "#1e40af" },
      { w: 200, h: 200, top: 25,  left: 72, color: "#1d4ed8" },
    ]);
    if (!token) router.replace("/auth/forgot-password");
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const strength = !password ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Fair", "Strong"][strength];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-emerald-500"][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token)              { setError("Invalid reset link."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm){ setError("Passwords do not match"); return; }

    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API_URL}/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Reset failed. Link may have expired."); setLoading(false); return; }
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (hasErr) =>
    `w-full h-11 px-4 pr-11 rounded-xl border ${
      hasErr ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50 hover:border-blue-300"
    } text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent focus:bg-white transition-all duration-200`;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #e8effe 40%, #f0f6ff 100%)" }}
    >
      {orbs.map((orb, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ width: orb.w, height: orb.h, top: `${orb.top}%`, left: `${orb.left}%`, background: orb.color, opacity: 0.06, filter: "blur(72px)" }}
          animate={{ y: [0, i % 2 === 0 ? -22 : 22], x: [0, i % 2 === 0 ? 10 : -10] }}
          transition={{ duration: 7 + i * 1.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      ))}

      <motion.div className="w-full max-w-md relative z-10" variants={stagger} initial="hidden" animate="show">

        <motion.div variants={fadeUp} className="text-center mb-8">
          <motion.div whileHover={{ scale: 1.08, rotate: 4 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-xl"
            style={{ background: "linear-gradient(135deg, #1e3a8a, #1e40af)" }}>
            <KeyRound className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Set New Password</h1>
          <p className="text-slate-500 mt-1.5 text-sm">Choose a strong new password</p>
        </motion.div>

        <motion.div variants={fadeUp}
          className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/70 p-8 relative overflow-hidden"
          style={{ boxShadow: "0 24px 64px rgba(30,58,138,0.10)" }}>

          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm rounded-3xl z-20">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl mb-4"
                  style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </motion.div>
                <p className="text-lg font-bold text-slate-800">Password Updated!</p>
                <p className="text-sm text-slate-500 mt-1">Redirecting to sign in…</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <motion.div variants={fadeUp} className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700">New Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? "text" : "password"}
                  value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••" className={inputCls(false)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-700 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((level) => (
                      <div key={level} className="flex-1 h-1 rounded-full bg-slate-200 overflow-hidden">
                        <motion.div className={`h-full ${strength >= level ? strengthColor : ""}`}
                          initial={{ width: 0 }} animate={{ width: strength >= level ? "100%" : "0%" }}
                          transition={{ duration: 0.3 }} />
                      </div>
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${
                    strength === 1 ? "text-red-500" : strength === 2 ? "text-amber-500" : "text-emerald-600"
                  }`}>{strengthLabel}</p>
                </motion.div>
              )}
            </motion.div>

            {/* Confirm */}
            <motion.div variants={fadeUp} className="space-y-1.5">
              <label htmlFor="confirm" className="text-sm font-semibold text-slate-700">Confirm Password</label>
              <div className="relative">
                <input id="confirm" type={showConfirm ? "text" : "password"}
                  value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                  placeholder="••••••••" className={inputCls(!!error && error.includes("match"))} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-700 transition-colors">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={fadeUp}>
              <motion.button type="submit" disabled={loading || !token}
                whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full h-11 flex items-center justify-center rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #1e40af, #1e3a8a)", boxShadow: "0 6px 24px rgba(30,58,138,0.25)" }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>

        <motion.p variants={fadeUp} className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} <span className="font-semibold text-blue-900">LawHelpZone</span> · All rights reserved
        </motion.p>
      </motion.div>
    </div>
  );
}