"use client";
// ══════════════════════════════════════════════════════════════════════════════
// PROFILE PAGE — app/dashboard/[role]/profile/page.jsx
// Fully functional: loads via GET /api/auth/me, saves via PUT /api/auth/profile
// Avatar upload via POST /api/upload. Save/Reset per section.
// Theme-aware via CSS variables.
// ══════════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/store/index"
import {
  User, Briefcase, Lock, Camera, Save, RotateCcw,
  CheckCircle, AlertTriangle, X, Eye, EyeOff,
  MapPin, Phone, Mail, Globe, Linkedin, BookOpen,
  Star, Award, Languages, Scale, Shield,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const HJ  = () => ({ "Content-Type": "application/json", ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });
const H   = () => ({ ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });

/* ── Toast ──────────────────────────────────────────────────────────── */
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, borderRadius: 12, padding: "12px 18px", fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 8, animation: "fd 0.3s ease", background: type === "error" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${type === "error" ? "#fca5a5" : "#86efac"}`, color: type === "error" ? "#dc2626" : "#16a34a" }}>
      {type === "error" ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}{msg}
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 4, opacity: 0.5 }}><X size={13} /></button>
    </div>
  );
}

/* ── Input field ────────────────────────────────────────────────────── */
function Field({ label, value, onChange, type = "text", placeholder, icon: Icon, readOnly, span = 1 }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ gridColumn: span === 2 ? "span 2" : undefined }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted,#64748b)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
      <div style={{ position: "relative" }}>
        {Icon && <Icon size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted,#94a3b8)" }} />}
        <input
          type={type === "password" ? (show ? "text" : "password") : type}
          value={value || ""}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className="profile-input"
          style={{ width: "100%", padding: `10px 14px 10px ${Icon ? "32px" : "14px"}`, borderRadius: 10, border: "1px solid var(--border-color,#e2e8f0)", fontSize: 14, outline: "none", background: readOnly ? "var(--input-readonly,#f8fafc)" : "var(--input-bg,#fff)", color: "var(--text-primary,#0f172a)", boxSizing: "border-box", paddingRight: type === "password" ? 42 : 14, cursor: readOnly ? "default" : undefined }}
        />
        {type === "password" && !readOnly && (
          <button onClick={() => setShow(p => !p)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted,#94a3b8)", display: "flex" }}>
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Select field ───────────────────────────────────────────────────── */
function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted,#64748b)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
      <select value={value || ""} onChange={e => onChange(e.target.value)}
        className="profile-input"
        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border-color,#e2e8f0)", fontSize: 14, outline: "none", background: "var(--input-bg,#fff)", color: "var(--text-primary,#0f172a)" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ── Textarea field ─────────────────────────────────────────────────── */
function TextArea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div style={{ gridColumn: "span 2" }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted,#64748b)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
      <textarea value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="profile-input"
        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border-color,#e2e8f0)", fontSize: 14, outline: "none", background: "var(--input-bg,#fff)", color: "var(--text-primary,#0f172a)", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }}
      />
    </div>
  );
}

/* ── Tag input (comma-separated array) ─────────────────────────────── */
function TagInput({ label, value = [], onChange }) {
  const [input, setInput] = useState("");
  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) { onChange([...value, trimmed]); }
    setInput("");
  };
  const remove = (tag) => onChange(value.filter(t => t !== tag));
  return (
    <div style={{ gridColumn: "span 2" }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted,#64748b)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border-color,#e2e8f0)", background: "var(--input-bg,#fff)", minHeight: 44 }}>
        {value.map(tag => (
          <span key={tag} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: "#eff6ff", color: "#3b82f6", fontSize: 12, fontWeight: 700 }}>
            {tag}
            <button onClick={() => remove(tag)} style={{ background: "none", border: "none", cursor: "pointer", color: "#93c5fd", padding: 0, fontSize: 12, lineHeight: 1, display: "flex" }}>×</button>
          </span>
        ))}
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
          placeholder="Type and press Enter…"
          style={{ border: "none", outline: "none", fontSize: 13, background: "transparent", color: "var(--text-primary,#0f172a)", minWidth: 120, flex: 1 }}
        />
      </div>
    </div>
  );
}

/* ── Section wrapper ────────────────────────────────────────────────── */
function Section({ icon: Icon, title, subtitle, color, children, onSave, onReset, saving, dirty }) {
  return (
    <div style={{ background: "var(--card-bg,#fff)", borderRadius: 20, border: "1px solid var(--border-color,#f1f5f9)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", overflow: "hidden", marginBottom: 20, animation: "fd 0.4s ease both" }}>
      <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-color,#f1f5f9)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={18} style={{ color }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>{title}</h3>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted,#64748b)" }}>{subtitle}</p>
          </div>
          {dirty && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#fef3c7", color: "#d97706" }}>Unsaved</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onReset} title="Discard changes"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--border-color,#e2e8f0)", background: "transparent", color: "var(--text-muted,#64748b)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <RotateCcw size={13} /> Reset
          </button>
          <button onClick={onSave} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: color, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.7 : 1, boxShadow: `0 4px 12px ${color}40` }}>
            {saving ? <div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <Save size={13} />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { user } = useAppSelector(s => s.auth);
  const fileRef = useRef(null);

  const [original, setOriginal]     = useState(null);   // raw from server
  const [personal, setPersonal]     = useState({});
  const [lawyerP,  setLawyerP]      = useState({});
  const [clientP,  setClientP]      = useState({});
  const [pwForm,   setPwForm]       = useState({ currentPassword: "", password: "", confirmPassword: "" });
  const [saving,   setSaving]       = useState({});
  const [toast,    setToast]        = useState(null);
  const [loading,  setLoading]      = useState(true);
  const [avatarUp, setAvatarUp]     = useState(false);
  const [dirty,    setDirty]        = useState({});
  const [vis,      setVis]          = useState(false);

  const role = original?.role || user?.role || "client";

  const showToast = (msg, type = "success") => setToast({ msg, type });

  /* ── Fetch profile ────────────────────────────────────────────────── */
  const loadProfile = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/auth/me`, { credentials: "include", headers: HJ() });
      if (!r.ok) throw new Error("Failed");
      const d = await r.json();
      const u = d.user || d;
      setOriginal(u);
      setPersonal({
        name: u.name || "",
        phone: u.phone || "",
        bio: u.bio || "",
        city: u.city || "",
        country: u.country || "",
        address: u.address || "",
        dob: u.dob || "",
        gender: u.gender || "",
        nationalId: u.nationalId || "",
        profileImage: u.profileImage || "",
      });
      setLawyerP(u.lawyerProfile || {});
      setClientP(u.clientProfile || {});
    } catch { showToast("Failed to load profile", "error"); }
    finally { setLoading(false); setTimeout(() => setVis(true), 80); }
  };

  useEffect(() => { if (user) loadProfile(); }, [user]);

  /* ── Mark dirty ────────────────────────────────────────────────────── */
  const upPersonal = (key, val) => {
    setPersonal(p => ({ ...p, [key]: val }));
    setDirty(p => ({ ...p, personal: true }));
  };
  const upLawyer = (key, val) => {
    setLawyerP(p => ({ ...p, [key]: val }));
    setDirty(p => ({ ...p, lawyer: true }));
  };
  const upClient = (key, val) => {
    setClientP(p => ({ ...p, [key]: val }));
    setDirty(p => ({ ...p, client: true }));
  };

  /* ── Save personal ─────────────────────────────────────────────────── */
  const savePersonal = async () => {
    setSaving(p => ({ ...p, personal: true }));
    try {
      const r = await fetch(`${API}/api/auth/profile`, {
        method: "PUT", credentials: "include", headers: HJ(),
        body: JSON.stringify(personal),
      });
      if (!r.ok) throw new Error("Failed");
      const d = await r.json();
      setOriginal(d.user);
      setDirty(p => ({ ...p, personal: false }));
      showToast("Personal info saved!");
    } catch { showToast("Failed to save", "error"); }
    finally { setSaving(p => ({ ...p, personal: false })); }
  };

  /* ── Save role-specific ─────────────────────────────────────────────── */
  const saveRoleProfile = async (section) => {
    setSaving(p => ({ ...p, [section]: true }));
    const endpoint = section === "lawyer" ? `${API}/api/lawyers/profile` : `${API}/api/clients/profile`;
    try {
      const body = section === "lawyer" ? { ...personal, lawyerProfile: lawyerP } : { ...personal, clientProfile: clientP };
      const r = await fetch(endpoint, {
        method: "PUT", credentials: "include", headers: HJ(),
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Failed");
      const d = await r.json();
      setOriginal(d.user);
      setDirty(p => ({ ...p, [section]: false }));
      showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} profile saved!`);
    } catch { showToast("Failed to save", "error"); }
    finally { setSaving(p => ({ ...p, [section]: false })); }
  };

  /* ── Change password ────────────────────────────────────────────────── */
  const changePassword = async () => {
    if (pwForm.password !== pwForm.confirmPassword) {
      return showToast("Passwords do not match", "error");
    }
    if (pwForm.password.length < 8) {
      return showToast("Password must be at least 8 characters", "error");
    }
    setSaving(p => ({ ...p, password: true }));
    try {
      const r = await fetch(`${API}/api/auth/change-password`, {
        method: "POST", credentials: "include", headers: HJ(),
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, password: pwForm.password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Failed");
      setPwForm({ currentPassword: "", password: "", confirmPassword: "" });
      showToast("Password changed successfully!");
    } catch (e) { showToast(e.message || "Failed to change password", "error"); }
    finally { setSaving(p => ({ ...p, password: false })); }
  };

  /* ── Upload avatar ──────────────────────────────────────────────────── */
  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!file.type.startsWith("image/")) return showToast("Please select an image file", "error");
    setAvatarUp(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`${API}/api/upload`, { method: "POST", headers: H(), body: fd, credentials: "include" });
      if (!r.ok) throw new Error("Upload failed");
      const d = await r.json();
      const url = d.url || d.fileUrl;
      const pr = await fetch(`${API}/api/auth/profile`, {
        method: "PUT", credentials: "include", headers: HJ(),
        body: JSON.stringify({ profileImage: url }),
      });
      if (pr.ok) {
        setPersonal(p => ({ ...p, profileImage: url }));
        showToast("Avatar updated!");
      }
    } catch { showToast("Avatar upload failed", "error"); }
    finally { setAvatarUp(false); }
  };

  /* ── Reset sections ─────────────────────────────────────────────────── */
  const resetPersonal = () => {
    if (!original) return;
    setPersonal({ name: original.name || "", phone: original.phone || "", bio: original.bio || "", city: original.city || "", country: original.country || "", address: original.address || "", dob: original.dob || "", gender: original.gender || "", nationalId: original.nationalId || "", profileImage: original.profileImage || "" });
    setDirty(p => ({ ...p, personal: false }));
    showToast("Changes discarded");
  };
  const resetLawyer = () => { setLawyerP(original?.lawyerProfile || {}); setDirty(p => ({ ...p, lawyer: false })); showToast("Changes discarded"); };
  const resetClient = () => { setClientP(original?.clientProfile || {}); setDirty(p => ({ ...p, client: false })); showToast("Changes discarded"); };
  const resetPassword = () => { setPwForm({ currentPassword: "", password: "", confirmPassword: "" }); };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 14 }}>
      <div style={{ width: 40, height: 40, border: "3px solid var(--border-color,#e2e8f0)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "var(--text-muted,#64748b)", fontSize: 14, margin: 0 }}>Loading profile…</p>
    </div>
  );

  const avatarLetter = (personal.name || user?.email || "U").charAt(0).toUpperCase();
  const roleColor    = { admin: "#ef4444", lawyer: "#10b981", client: "#3b82f6" }[role] || "#6366f1";

  return (
    <>
      <style>{`
        @keyframes fd{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        :root{--input-readonly:#f8fafc;}
        .dark{--input-readonly:#0f172a;}
        .profile-input:focus{border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,0.1)!important;}
        .profile-input{transition:border-color 0.15s,box-shadow 0.15s;}
        .avatar-btn:hover .avatar-overlay{opacity:1!important;}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display: "none" }} />

      <div style={{ maxWidth: 860, margin: "0 auto", opacity: vis ? 1 : 0, transition: "opacity 0.4s" }}>

        {/* ── Avatar hero card ─────────────────────────────────────────── */}
        <div style={{ background: "var(--card-bg,#fff)", borderRadius: 20, border: "1px solid var(--border-color,#f1f5f9)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", padding: "28px 28px", marginBottom: 20, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", animation: "fd 0.4s ease" }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button className="avatar-btn" onClick={() => fileRef.current?.click()} disabled={avatarUp}
              style={{ width: 88, height: 88, borderRadius: "50%", background: roleColor, color: "#fff", fontSize: 32, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${roleColor}40`, cursor: "pointer", overflow: "hidden", position: "relative" }}>
              {personal.profileImage
                ? <img src={personal.profileImage} style={{ width: 88, height: 88, objectFit: "cover" }} alt="" />
                : avatarLetter}
              <div className="avatar-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s", borderRadius: "50%" }}>
                {avatarUp ? <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.5)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <Camera size={20} color="#fff" />}
              </div>
            </button>
            <div style={{ position: "absolute", bottom: 2, right: 2, width: 20, height: 20, borderRadius: "50%", background: "#10b981", border: "3px solid var(--card-bg,#fff)" }} />
          </div>
          {/* Info */}
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>{personal.name || "Your Name"}</h2>
            <p style={{ margin: "4px 0", fontSize: 14, color: "var(--text-muted,#64748b)" }}>{original?.email}</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: `${roleColor}18`, color: roleColor, textTransform: "capitalize" }}>{role}</span>
              {original?.emailVerified && <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "#f0fdf4", color: "#10b981" }}>✓ Verified</span>}
              {personal.city && <span style={{ fontSize: 12, color: "var(--text-muted,#94a3b8)", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} />{personal.city}{personal.country ? `, ${personal.country}` : ""}</span>}
            </div>
          </div>
          <button onClick={() => fileRef.current?.click()}
            style={{ padding: "10px 18px", borderRadius: 12, background: "var(--input-bg,#f8fafc)", border: "1px solid var(--border-color,#e2e8f0)", color: "var(--text-primary,#374151)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Camera size={14} /> Change Photo
          </button>
        </div>

        {/* ── Personal Info ─────────────────────────────────────────────── */}
        <Section icon={User} title="Personal Information" subtitle="Basic details visible on your profile"
          color="#3b82f6" onSave={savePersonal} onReset={resetPersonal} saving={saving.personal} dirty={dirty.personal}>
          <Field label="Full Name"    value={personal.name}      onChange={v => upPersonal("name", v)}      icon={User}   placeholder="Your full name" />
          <Field label="Phone"        value={personal.phone}     onChange={v => upPersonal("phone", v)}     icon={Phone}  type="tel" placeholder="+1 234 567 8900" />
          <Field label="City"         value={personal.city}      onChange={v => upPersonal("city", v)}      icon={MapPin} placeholder="City" />
          <Field label="Country"      value={personal.country}   onChange={v => upPersonal("country", v)}   icon={Globe}  placeholder="Country" />
          <Field label="Address"      value={personal.address}   onChange={v => upPersonal("address", v)}   icon={MapPin} placeholder="Street address" />
          <Field label="Date of Birth" value={personal.dob}      onChange={v => upPersonal("dob", v)}       type="date" />
          <SelectField label="Gender" value={personal.gender} onChange={v => upPersonal("gender", v)}
            options={[{ value: "", label: "Prefer not to say" }, { value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }]} />
          <Field label="National ID"  value={personal.nationalId} onChange={v => upPersonal("nationalId", v)} icon={Shield} placeholder="ID number" />
          <TextArea label="Bio" value={personal.bio} onChange={v => upPersonal("bio", v)} placeholder="Tell others about yourself…" rows={3} />
        </Section>

        {/* ── Lawyer Profile ──────────────────────────────────────────────── */}
        {role === "lawyer" && (
          <Section icon={Scale} title="Lawyer Profile" subtitle="Professional details displayed to clients"
            color="#10b981" onSave={() => saveRoleProfile("lawyer")} onReset={resetLawyer} saving={saving.lawyer} dirty={dirty.lawyer}>
            <Field label="Bar Number"        value={lawyerP.barNumber}         onChange={v => upLawyer("barNumber", v)}         icon={Award}     placeholder="BAR-12345" />
            <Field label="Bar Council"       value={lawyerP.barCouncil}        onChange={v => upLawyer("barCouncil", v)}        icon={Award}     placeholder="State Bar" />
            <Field label="Jurisdiction"      value={lawyerP.jurisdiction}      onChange={v => upLawyer("jurisdiction", v)}      icon={Globe}     placeholder="Federal / State" />
            <Field label="Years of Experience" value={lawyerP.yearsOfExperience} onChange={v => upLawyer("yearsOfExperience", Number(v))} type="number" min={0} placeholder="5" />
            <Field label="Hourly Rate (USD)" value={lawyerP.hourlyRate}        onChange={v => upLawyer("hourlyRate", Number(v))} type="number" min={0} placeholder="150" />
            <Field label="Consultation Fee"  value={lawyerP.consultationFee}   onChange={v => upLawyer("consultationFee", Number(v))} type="number" min={0} placeholder="50" />
            <Field label="Office Address"    value={lawyerP.officeAddress}     onChange={v => upLawyer("officeAddress", v)}     icon={MapPin}    placeholder="Office location" />
            <Field label="Website"           value={lawyerP.website}           onChange={v => upLawyer("website", v)}           icon={Globe}     placeholder="https://yoursite.com" />
            <Field label="LinkedIn"          value={lawyerP.linkedIn}          onChange={v => upLawyer("linkedIn", v)}          icon={Linkedin}  placeholder="linkedin.com/in/…" />
            <Field label="University"        value={lawyerP.university}        onChange={v => upLawyer("university", v)}        icon={BookOpen}  placeholder="Harvard Law School" />
            <Field label="Graduation Year"   value={lawyerP.graduationYear}    onChange={v => upLawyer("graduationYear", v)}    icon={BookOpen}  placeholder="2015" />
            <TextArea label="Professional Bio" value={lawyerP.bio} onChange={v => upLawyer("bio", v)} placeholder="Describe your legal expertise…" rows={3} />
            <TagInput label="Specializations" value={lawyerP.specializations || []} onChange={v => upLawyer("specializations", v)} />
            <TagInput label="Languages" value={lawyerP.languages || []} onChange={v => upLawyer("languages", v)} />
            <TagInput label="Courts" value={lawyerP.courts || []} onChange={v => upLawyer("courts", v)} />
          </Section>
        )}

        {/* ── Client Profile ──────────────────────────────────────────────── */}
        {role === "client" && (
          <Section icon={User} title="Client Profile" subtitle="Additional details to help match you with lawyers"
            color="#8b5cf6" onSave={() => saveRoleProfile("client")} onReset={resetClient} saving={saving.client} dirty={dirty.client}>
            <Field label="Occupation"         value={clientP.occupation}         onChange={v => upClient("occupation", v)}         placeholder="Software Engineer" />
            <Field label="Employer"           value={clientP.employer}           onChange={v => upClient("employer", v)}           placeholder="Company name" />
            <Field label="Annual Income"      value={clientP.income}             onChange={v => upClient("income", v)}             placeholder="e.g. $50,000" />
            <Field label="Emergency Contact"  value={clientP.emergencyContact}   onChange={v => upClient("emergencyContact", v)}   icon={Phone} placeholder="+1 234 567 8900" />
            <SelectField label="Preferred Language" value={clientP.preferredLanguage || "English"} onChange={v => upClient("preferredLanguage", v)}
              options={["English","Arabic","Spanish","French","Urdu","Chinese","Hindi"].map(l => ({ value: l, label: l }))} />
            <TagInput label="Legal Needs" value={clientP.legalNeeds || []} onChange={v => upClient("legalNeeds", v)} />
            <TextArea label="Notes" value={clientP.notes} onChange={v => upClient("notes", v)} placeholder="Any additional context for lawyers…" />
          </Section>
        )}

        {/* ── Admin Profile ────────────────────────────────────────────────── */}
        {role === "admin" && (
          <Section icon={Shield} title="Admin Details" subtitle="Administrative role information"
            color="#ef4444" onSave={savePersonal} onReset={resetPersonal} saving={saving.personal} dirty={dirty.personal}>
            <Field label="Department"   value={original?.department  || ""} onChange={v => setPersonal(p => ({...p, department: v}))}   placeholder="Legal Operations" />
            <Field label="Employee ID"  value={original?.employeeId  || ""} onChange={v => setPersonal(p => ({...p, employeeId: v}))}   placeholder="EMP-001" />
            <Field label="Supervisor"   value={original?.supervisor  || ""} onChange={v => setPersonal(p => ({...p, supervisor: v}))}   placeholder="Manager name" />
          </Section>
        )}

        {/* ── Account Security ─────────────────────────────────────────────── */}
        <div style={{ background: "var(--card-bg,#fff)", borderRadius: 20, border: "1px solid var(--border-color,#f1f5f9)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", overflow: "hidden", marginBottom: 20, animation: "fd 0.6s ease both" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-color,#f1f5f9)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Lock size={18} style={{ color: "#ef4444" }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-heading,#0f172a)" }}>Change Password</h3>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted,#64748b)" }}>Update your account password</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={resetPassword}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--border-color,#e2e8f0)", background: "transparent", color: "var(--text-muted,#64748b)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <RotateCcw size={13} /> Clear
              </button>
              <button onClick={changePassword} disabled={saving.password || !pwForm.password}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: pwForm.password ? "#ef4444" : "var(--input-bg,#f1f5f9)", color: pwForm.password ? "#fff" : "var(--text-muted,#94a3b8)", border: "none", fontSize: 13, fontWeight: 700, cursor: pwForm.password ? "pointer" : "not-allowed", opacity: saving.password ? 0.7 : 1, transition: "all 0.15s" }}>
                {saving.password ? <div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <Lock size={13} />}
                {saving.password ? "Updating…" : "Update Password"}
              </button>
            </div>
          </div>
          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <Field label="Current Password" value={pwForm.currentPassword} onChange={v => setPwForm(p => ({...p, currentPassword: v}))} type="password" placeholder="••••••••" icon={Lock} />
              <Field label="New Password"     value={pwForm.password}        onChange={v => setPwForm(p => ({...p, password: v}))}        type="password" placeholder="Min 8 characters" icon={Lock} />
              <Field label="Confirm Password" value={pwForm.confirmPassword} onChange={v => setPwForm(p => ({...p, confirmPassword: v}))} type="password" placeholder="Repeat new password" icon={Lock} />
            </div>
            {pwForm.password && pwForm.confirmPassword && pwForm.password !== pwForm.confirmPassword && (
              <p style={{ margin: "10px 0 0", fontSize: 12, color: "#ef4444", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                <AlertTriangle size={12} /> Passwords do not match
              </p>
            )}
            {pwForm.password && pwForm.password.length < 8 && (
              <p style={{ margin: "10px 0 0", fontSize: 12, color: "#f59e0b", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                <AlertTriangle size={12} /> Password must be at least 8 characters
              </p>
            )}
          </div>
        </div>

        {/* Account info (read-only) */}
        <div style={{ background: "var(--card-bg,#fff)", borderRadius: 20, border: "1px solid var(--border-color,#f1f5f9)", padding: "20px 24px", animation: "fd 0.7s ease both" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--text-heading,#0f172a)" }}>Account Information</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {[
              { label: "Email",       value: original?.email },
              { label: "Role",        value: original?.role },
              { label: "Member Since",value: original?.createdAt ? new Date(original.createdAt).toLocaleDateString() : "—" },
              { label: "Email Status", value: original?.emailVerified ? "✓ Verified" : "⚠ Unverified" },
              { label: "Last Login",  value: original?.lastLogin ? new Date(original.lastLogin).toLocaleString() : "—" },
              { label: "Account ID",  value: original?._id?.slice(-8) },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: "12px 14px", borderRadius: 12, background: "var(--input-bg,#f8fafc)", border: "1px solid var(--border-color,#f1f5f9)" }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "var(--text-muted,#94a3b8)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
                <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 600, color: "var(--text-heading,#0f172a)" }}>{value || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}