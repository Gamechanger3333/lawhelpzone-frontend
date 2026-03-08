"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Shield } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const ORBS = [
  { w: 380, h: 380, top: -12, left: 58, color: "#1e3a6e" },
  { w: 280, h: 280, top: 62,  left: -6, color: "#1e40af" },
  { w: 210, h: 210, top: 22,  left: 70, color: "#1d4ed8" },
  { w: 180, h: 180, top: 74,  left: 10, color: "#1e3a6e" },
];

const btnStyle = {
  background:  "linear-gradient(135deg, #1e40af, #1e3a8a)",
  boxShadow:   "0 6px 24px rgba(30,58,138,0.25)",
};

export default function VerifyEmailPage() {
  const { token } = useParams();
  const router    = useRouter();

  const [status,    setStatus]    = useState("verifying");
  const [message,   setMessage]   = useState("");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("No verification token found."); return; }

    const verify = async () => {
      try {
        const res  = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/verify-email/${token}`
        );
        const data = await res.json();
        if (data.success) { setStatus("success"); setMessage(data.message || "Email verified successfully!"); }
        else              { setStatus("error");   setMessage(data.message || "Verification failed. The link may have expired."); }
      } catch {
        setStatus("error"); setMessage("Something went wrong. Please try again.");
      }
    };
    verify();
  }, [token]);

  useEffect(() => {
    if (status !== "success") return;
    if (countdown === 0)      { router.push("/auth/login"); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #e8effe 40%, #f0f6ff 100%)" }}
    >
      {ORBS.map((orb, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ width: orb.w, height: orb.h, top: `${orb.top}%`, left: `${orb.left}%`, background: orb.color, opacity: 0.06, filter: "blur(72px)" }}
          animate={{ y: [0, i % 2 === 0 ? -24 : 24], x: [0, i % 2 === 0 ? 12 : -12] }}
          transition={{ duration: 7 + i * 1.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      ))}

      <motion.div className="w-full max-w-md relative z-10" variants={stagger} initial="hidden" animate="show">

        {/* Logo */}
        <motion.div variants={fadeUp} className="text-center mb-8">
          <motion.div whileHover={{ scale: 1.08, rotate: 4 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-xl"
            style={{ background: "linear-gradient(135deg, #1e3a8a, #1e40af)" }}>
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Email Verification</h1>
          <p className="text-slate-500 mt-1.5 text-sm">Confirming your account</p>
        </motion.div>

        {/* Card */}
        <motion.div variants={fadeUp}
          className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/70 p-8 text-center"
          style={{ boxShadow: "0 24px 64px rgba(30,58,138,0.10)" }}>

          {/* Verifying */}
          {status === "verifying" && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
              <motion.div variants={fadeUp} className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "#eff6ff" }}>
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1e40af" }} />
                </div>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-lg font-semibold text-slate-900">Verifying your email…</motion.h2>
              <motion.p  variants={fadeUp} className="text-sm text-slate-500">Please wait a moment.</motion.p>
            </motion.div>
          )}

          {/* Success */}
          {status === "success" && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
              <motion.div variants={fadeUp} className="flex justify-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 14 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "#f0fdf4" }}>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </motion.div>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-lg font-semibold text-slate-900">Email Verified!</motion.h2>
              <motion.p  variants={fadeUp} className="text-sm text-slate-500">{message}</motion.p>
              <motion.p  variants={fadeUp} className="text-xs text-slate-400">
                Redirecting to login in <span className="font-semibold" style={{ color: "#1e40af" }}>{countdown}s</span>…
              </motion.p>
              <motion.button variants={fadeUp}
                whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/auth/login")}
                className="w-full h-11 flex items-center justify-center rounded-xl text-sm font-semibold text-white transition-all"
                style={btnStyle}>
                Go to Login Now
              </motion.button>
            </motion.div>
          )}

          {/* Error */}
          {status === "error" && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
              <motion.div variants={fadeUp} className="flex justify-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 14 }}
                  className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-500" />
                </motion.div>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-lg font-semibold text-slate-900">Verification Failed</motion.h2>
              <motion.p  variants={fadeUp} className="text-sm text-slate-500">{message}</motion.p>
              <motion.div variants={fadeUp} className="flex flex-col gap-2 pt-1">
                <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/auth/login")}
                  className="w-full h-11 flex items-center justify-center rounded-xl text-sm font-semibold text-white transition-all"
                  style={btnStyle}>
                  Back to Login
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/auth/resend-verification")}
                  className="w-full h-11 flex items-center justify-center rounded-xl text-sm font-semibold border transition-all"
                  style={{ color: "#1e40af", borderColor: "#bfdbfe" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  Resend Verification Email
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>

        <motion.p variants={fadeUp} className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} <span className="font-semibold text-blue-900">LawHelpZone</span> · All rights reserved
        </motion.p>
      </motion.div>
    </div>
  );
}