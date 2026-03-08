"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "../../../store/index";
import { registerUser } from "../../../store/slices/authSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Shield, Users, Briefcase, CheckCircle2 } from "lucide-react";

const ROLES = [
  { value: "admin",  label: "Admin",  icon: Shield,   gradient: "linear-gradient(135deg, #1e3a8a, #1e40af)", selectedBg: "#eff6ff", selectedBorder: "#1e40af" },
  { value: "client", label: "Client", icon: Users,    gradient: "linear-gradient(135deg, #1e40af, #2563eb)", selectedBg: "#eff6ff", selectedBorder: "#1e40af" },
  { value: "lawyer", label: "Lawyer", icon: Briefcase,gradient: "linear-gradient(135deg, #1e3a8a, #1e40af)", selectedBg: "#eff6ff", selectedBorder: "#1e40af" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = { show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } };
const ORBS = [
  { w: 380, h: 380, top: -12, left: 58, color: "#1e3a6e" },
  { w: 280, h: 280, top: 62,  left: -6, color: "#1e40af" },
  { w: 210, h: 210, top: 25,  left: 72, color: "#1d4ed8" },
  { w: 180, h: 180, top: 74,  left: 10, color: "#1e3a6e" },
];

export default function SignUpPage() {
  const router   = useRouter();
  const dispatch = useAppDispatch();

  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirmPassword: "", role: "client",
  });
  const [errors,       setErrors]       = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [success,      setSuccess]      = useState(false);
  const [orbs,         setOrbs]         = useState([]);

  useEffect(() => { setOrbs(ORBS); }, []);

  const validate = () => {
    const e = {};
    if (!form.fullName || form.fullName.trim().length < 2)
      e.fullName = "Full Name must be at least 2 characters";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
      e.email = "Invalid email address";
    if (!form.password || form.password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setGeneralError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }

    setLoading(true);

    // ── Dispatch to Redux so the store is populated BEFORE navigation ──
    const result = await dispatch(registerUser(form));

    if (registerUser.rejected.match(result)) {
      setGeneralError(result.payload || "Sign up failed");
      setLoading(false);
      return;
    }

    // Show success briefly, then navigate directly to dashboard
    setSuccess(true);
    const role = result.payload?.role;
    setTimeout(() => {
      if      (role === "admin")  router.push("/dashboard/admin");
      else if (role === "lawyer") router.push("/dashboard/lawyer");
      else                        router.push("/dashboard/client");
    }, 1000);

    setLoading(false);
  };

  const inputCls = (field) =>
    `w-full h-11 px-4 rounded-xl border text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent focus:bg-white transition-all duration-200 ${
      errors[field]
        ? "border-red-400 bg-red-50 text-slate-800"
        : "border-slate-200 bg-slate-50 hover:border-blue-300 text-slate-800"
    }`;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #e8effe 40%, #f0f6ff 100%)" }}
    >
      {orbs.map((orb, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ width: orb.w, height: orb.h, top: `${orb.top}%`, left: `${orb.left}%`, background: orb.color, opacity: 0.06, filter: "blur(72px)" }}
          animate={{ y: [0, i % 2 === 0 ? -24 : 24], x: [0, i % 2 === 0 ? 12 : -12] }}
          transition={{ duration: 7 + i * 1.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      ))}

      <motion.div className="w-full max-w-md relative z-10" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="text-center mb-8">
          <motion.div whileHover={{ scale: 1.08, rotate: 4 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-xl"
            style={{ background: "linear-gradient(135deg, #1e3a8a, #1e40af)", boxShadow: "0 12px 40px -8px rgba(30,58,138,0.4)" }}>
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Account</h1>
          <p className="text-slate-500 mt-1.5 text-sm">Choose your role and get started</p>
        </motion.div>

        <motion.div variants={fadeUp}
          className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/70 p-8 relative overflow-hidden"
          style={{ boxShadow: "0 24px 64px rgba(30,58,138,0.10)" }}>

          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm rounded-3xl z-20">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-xl"
                  style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </motion.div>
                <p className="text-lg font-bold text-slate-800">Account created!</p>
                <p className="text-sm text-slate-500 mt-1">Taking you to your dashboard…</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <motion.div variants={fadeUp} className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Select your role</label>
              <div className="grid grid-cols-3 gap-3">
                {ROLES.map(({ value: rv, label, icon: Icon, gradient, selectedBg, selectedBorder }, idx) => {
                  const selected = form.role === rv;
                  return (
                    <motion.button key={rv} type="button"
                      onClick={() => setForm({ ...form, role: rv })}
                      whileHover={{ y: -2, scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + idx * 0.07, duration: 0.35, ease: "easeOut" }}
                      style={{ background: selected ? selectedBg : "#ffffff", borderColor: selected ? selectedBorder : "#e2e8f0", borderWidth: 2, borderStyle: "solid", borderRadius: 16, padding: "14px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, cursor: "pointer", transition: "all 0.2s", boxShadow: selected ? "0 4px 16px rgba(30,58,138,0.12)" : "none" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: selected ? gradient : "linear-gradient(135deg, #f1f5f9, #e2e8f0)", transition: "all 0.3s" }}>
                        <Icon style={{ width: 20, height: 20, color: selected ? "#fff" : "#94a3b8", transition: "color 0.3s" }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: selected ? "#1e3a8a" : "#94a3b8", transition: "color 0.2s" }}>{label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Full Name */}
            <motion.div variants={fadeUp} className="space-y-1.5">
              <label htmlFor="fullName" className="text-sm font-semibold text-slate-700">Full Name</label>
              <input id="fullName" name="fullName" type="text" value={form.fullName} onChange={handleChange} placeholder="John Doe" className={inputCls("fullName")} />
              <AnimatePresence>{errors.fullName && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-500 font-medium">{errors.fullName}</motion.p>}</AnimatePresence>
            </motion.div>

            {/* Email */}
            <motion.div variants={fadeUp} className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputCls("email")} />
              <AnimatePresence>{errors.email && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-500 font-medium">{errors.email}</motion.p>}</AnimatePresence>
            </motion.div>

            {/* Password */}
            <motion.div variants={fadeUp} className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} placeholder="••••••••" className={`${inputCls("password")} pr-11`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-700 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <AnimatePresence>{errors.password && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-500 font-medium">{errors.password}</motion.p>}</AnimatePresence>
            </motion.div>

            {/* Confirm Password */}
            <motion.div variants={fadeUp} className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" className={inputCls("confirmPassword")} />
              <AnimatePresence>{errors.confirmPassword && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-500 font-medium">{errors.confirmPassword}</motion.p>}</AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {generalError && (
                <motion.div initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -6, height: 0 }} className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  <p className="text-sm text-red-600 text-center font-medium">{generalError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={fadeUp}>
              <motion.button type="submit" disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full h-11 flex items-center justify-center rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #1e40af, #1e3a8a)", boxShadow: "0 6px 24px rgba(30,58,138,0.25)" }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
              </motion.button>
            </motion.div>

            <motion.p variants={fadeUp} className="text-center text-sm text-slate-500 pt-1">
              Already have an account?{" "}
              <span onClick={() => router.push("/auth/login")} className="font-semibold cursor-pointer hover:underline transition-colors" style={{ color: "#1e40af" }}>Sign in</span>
            </motion.p>
          </form>
        </motion.div>

        <motion.p variants={fadeUp} className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} <span className="font-semibold text-blue-900">LawHelpZone</span> · All rights reserved
        </motion.p>
      </motion.div>
    </div>
  );
}