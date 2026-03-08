"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "../../../store/index";
import { loginUser } from "../../../store/slices/authSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export default function LoginPage() {
  const router   = useRouter();
  const dispatch = useAppDispatch();

  const [form, setForm]               = useState({ email: "", password: "" });
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [orbs, setOrbs]               = useState([]);

  useEffect(() => {
    setOrbs([
      { w: 400, h: 400, top: -15, left: 55,  color: "#1e3a6e" },
      { w: 300, h: 300, top: 60,  left: -8,  color: "#1e40af" },
      { w: 220, h: 220, top: 20,  left: 68,  color: "#1d4ed8" },
      { w: 180, h: 180, top: 75,  left: 10,  color: "#1e3a6e" },
    ]);
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // ── Dispatch to Redux so the store is populated BEFORE navigation ──
    const result = await dispatch(loginUser(form));

    if (loginUser.rejected.match(result)) {
      setError(result.payload || "Login failed");
      setLoading(false);
      return;
    }

    // Redux store now has user — navigate immediately
    const role = result.payload?.role;
    if      (role === "admin")  router.push("/dashboard/admin");
    else if (role === "client") router.push("/dashboard/client");
    else if (role === "lawyer") router.push("/dashboard/lawyer");
    else                        router.push("/");

    setLoading(false);
  };

  const inputCls = (hasErr) =>
    `w-full h-11 px-4 rounded-xl border ${
      hasErr
        ? "border-red-400 bg-red-50"
        : "border-slate-200 bg-slate-50 hover:border-blue-300"
    } text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent focus:bg-white transition-all duration-200`;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #e8effe 40%, #f0f6ff 100%)" }}
    >
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: orb.w, height: orb.h,
            top: `${orb.top}%`, left: `${orb.left}%`,
            background: orb.color, opacity: 0.06, filter: "blur(72px)",
          }}
          animate={{ y: [0, i % 2 === 0 ? -24 : 24], x: [0, i % 2 === 0 ? 12 : -12] }}
          transition={{ duration: 7 + i * 1.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      ))}

      <motion.div className="w-full max-w-md relative z-10" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="text-center mb-8">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 4 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-xl"
            style={{ background: "linear-gradient(135deg, #1e3a8a, #1e40af)" }}
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 mt-1.5 text-sm">Sign in to your account</p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/70 p-8"
          style={{ boxShadow: "0 24px 64px rgba(30, 58, 138, 0.10)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">

            <motion.div variants={fadeUp} className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</label>
              <input
                id="email" name="email" type="email" required
                value={form.email} onChange={handleChange}
                placeholder="you@example.com"
                className={inputCls(false)}
              />
            </motion.div>

            <motion.div variants={fadeUp} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
                <span
                  onClick={() => router.push("/auth/forgot-password")}
                  className="text-xs font-medium cursor-pointer transition-colors"
                  style={{ color: "#1e40af" }}
                  onMouseEnter={e => e.target.style.color = "#1e3a8a"}
                  onMouseLeave={e => e.target.style.color = "#1e40af"}
                >
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <input
                  id="password" name="password" required
                  type={showPassword ? "text" : "password"}
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••"
                  className={`${inputCls(false)} pr-11`}
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0,  height: "auto" }}
                  exit={{   opacity: 0, y: -6,  height: 0 }}
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
              </motion.button>
            </motion.div>

            <motion.p variants={fadeUp} className="text-center text-sm text-slate-500 pt-1">
              Don&apos;t have an account?{" "}
              <span
                onClick={() => router.push("/auth/signup")}
                className="font-semibold cursor-pointer transition-colors hover:underline"
                style={{ color: "#1e40af" }}
              >
                Sign up
              </span>
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