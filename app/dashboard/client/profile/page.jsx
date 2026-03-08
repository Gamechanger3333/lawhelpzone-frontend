"use client";
// ══════════════════════════════════════════════════════════════════════════════
// PROFILE PAGE — works for admin / client / lawyer  (auto-detects role)
// Place at:  app/dashboard/[role]/profile/page.jsx  (same file for all 3)
// ══════════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../../../../store/index";
import { updateProfile } from "../../../../store/slices/authSlice";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H   = () => ({ ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });
const HJ  = () => ({ "Content-Type": "application/json", ...H() });

const SPECS = ["Criminal Law","Family Law","Corporate Law","Property Law","Immigration Law","Tax Law","Labour Law","Civil Litigation","Intellectual Property","Banking & Finance Law","Constitutional Law","International Law","Environmental Law","Insurance Law","Medical / Health Law","Cyber Law","Human Rights Law","Arbitration & ADR"];
const LANGS = ["English","Urdu","Punjabi","Sindhi","Pashto","Balochi","Arabic","French"];
const COURTS= ["Supreme Court of Pakistan","Lahore High Court","Sindh High Court","Peshawar High Court","Balochistan High Court","Federal Shariat Court","District & Sessions Courts","Special Courts"];
const LEGAL_NEEDS = ["Property Dispute","Family Law / Divorce","Criminal Defense","Business / Contract Law","Labour / Employment","Immigration / Visa","Intellectual Property","Tax Matter","Cyber Crime","Other"];

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  const ok = type !== "error";
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, minWidth: 260, borderRadius: 14, padding: "14px 20px", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", animation: "tp 0.3s ease", background: ok ? "#f0fdf4" : "#fef2f2", border: `1px solid ${ok ? "#86efac" : "#fca5a5"}`, color: ok ? "#16a34a" : "#dc2626" }}>
      <span style={{ fontSize: 18 }}>{ok ? "✓" : "✕"}</span>{msg}
      <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", opacity: 0.5, fontSize: 18 }}>×</button>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={{ background: "var(--card-bg,#fff)", borderRadius: 20, border: "1px solid var(--border,#f1f5f9)", padding: "22px 24px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
      <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 800, color: "var(--text-h,#0f172a)", display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--label,#64748b)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
      {children}
      {hint && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>{hint}</p>}
    </div>
  );
}

function Inp({ value, onChange, placeholder, type = "text", disabled = false }) {
  return (
    <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border,#e2e8f0)", fontSize: 14, outline: "none", background: disabled ? "var(--disabled-bg,#f8fafc)" : "var(--input-bg,#fff)", color: disabled ? "#94a3b8" : "var(--text,#0f172a)", boxSizing: "border-box", transition: "border-color 0.15s" }}
      onFocus={e => !disabled && (e.target.style.borderColor = "#3b82f6")}
      onBlur={e => e.target.style.borderColor = "var(--border,#e2e8f0)"}
    />
  );
}

function Txt({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border,#e2e8f0)", fontSize: 14, outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box", background: "var(--input-bg,#fff)", color: "var(--text,#0f172a)", transition: "border-color 0.15s" }}
      onFocus={e => (e.target.style.borderColor = "#3b82f6")}
      onBlur={e => e.target.style.borderColor = "var(--border,#e2e8f0)"}
    />
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button onClick={() => onChange(!value)}
        style={{ width: 48, height: 26, borderRadius: 13, background: value ? "#10b981" : "#e2e8f0", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 3, left: value ? 25 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.15)" }} />
      </button>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text,#0f172a)" }}>{label}</span>
      {value && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#f0fdf4", color: "#10b981" }}>Active</span>}
    </div>
  );
}

function TagSelector({ tags, selected, onChange, color = "#3b82f6", bg = "#eff6ff" }) {
  const toggle = (t) => onChange(selected.includes(t) ? selected.filter(x => x !== t) : [...selected, t]);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {tags.map(t => (
        <button key={t} onClick={() => toggle(t)}
          style={{ padding: "6px 13px", borderRadius: 20, border: `1px solid ${selected.includes(t) ? color : "var(--border,#e2e8f0)"}`, background: selected.includes(t) ? bg : "transparent", color: selected.includes(t) ? color : "var(--text-muted,#64748b)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
          {selected.includes(t) && "✓ "}{t}
        </button>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user, profile } = useAppSelector((s) => s.auth);
  const role = user?.role || profile?.role || "client";

  const [ready,    setReady]   = useState(false);
  const [saving,   setSaving]  = useState(false);
  const [toast,    setToast]   = useState(null);
  const [imgPrev,  setImgPrev] = useState(null);
  const [uploading,setUpl]     = useState(false);
  const fileRef = useRef(null);

  // ── common fields ──────────────────────────────────────────────
  const [name,        setName]        = useState("");
  const [phone,       setPhone]       = useState("");
  const [bio,         setBio]         = useState("");
  const [city,        setCity]        = useState("");
  const [country,     setCountry]     = useState("Pakistan");
  const [dob,         setDob]         = useState("");
  const [gender,      setGender]      = useState("");
  const [cnic,        setCnic]        = useState("");

  // ── lawyer fields ──────────────────────────────────────────────
  const [specs,       setSpecs]       = useState([]);
  const [barNo,       setBarNo]       = useState("");
  const [experience,  setExp]         = useState("");
  const [rate,        setRate]        = useState("");
  const [langs,       setLangs]       = useState([]);
  const [education,   setEdu]         = useState("");
  const [university,  setUni]         = useState("");
  const [gradYear,    setGradYear]    = useState("");
  const [courts,      setCourts]      = useState([]);
  const [available,   setAvail]       = useState(true);
  const [firm,        setFirm]        = useState("");
  const [firmAddress, setFirmAddr]    = useState("");
  const [linkedIn,    setLinkedIn]    = useState("");
  const [awards,      setAwards]      = useState("");
  const [publications,setPubs]        = useState("");
  const [consultFee,  setConsultFee]  = useState("");

  // ── client fields ──────────────────────────────────────────────
  const [legalNeeds,  setNeeds]       = useState([]);
  const [prefLang,    setPLang]       = useState("English");
  const [occupation,  setOccupation]  = useState("");
  const [emergency,   setEmergency]   = useState("");
  const [caseNotes,   setCaseNotes]   = useState("");

  // ── admin fields ───────────────────────────────────────────────
  const [department,  setDept]        = useState("");
  const [empId,       setEmpId]       = useState("");
  const [supervisor,  setSupervisor]  = useState("");

  /* ── load full profile from backend ──────────────────────────── */
  const loadProfile = async () => {
    if (!user) { setTimeout(() => setReady(true), 800); return; }
    try {
      const r = await fetch(`${API}/api/auth/me`, { credentials: "include", headers: HJ() });
      if (!r.ok) throw new Error();
      const d = await r.json();
      const u = d.user || d;

      setName(u.name || ""); setPhone(u.phone || u.phoneNumber || ""); setBio(u.bio || "");
      setCity(u.city || u.location || ""); setCountry(u.country || "Pakistan");
      setDob(u.dateOfBirth ? u.dateOfBirth.slice(0, 10) : "");
      setGender(u.gender || ""); setCnic(u.cnic || u.nationalId || "");
      setImgPrev(u.profileImage || null);

      if (u.role === "lawyer") {
        const lp = u.lawyerProfile || {};
        setSpecs(lp.specializations || []); setBarNo(lp.barNumber || "");
        setExp(lp.yearsOfExperience || ""); setRate(lp.hourlyRate || "");
        setLangs(lp.languages || []); setEdu(lp.education || "");
        setUni(lp.university || ""); setGradYear(lp.graduationYear || "");
        setCourts(lp.courts || []); setAvail(lp.isAvailable !== false);
        setFirm(lp.firmName || ""); setFirmAddr(lp.firmAddress || "");
        setLinkedIn(u.linkedIn || lp.linkedIn || "");
        setAwards(lp.awards || ""); setPubs(lp.publications || "");
        setConsultFee(lp.consultationFee || "");
      }
      if (u.role === "client") {
        setNeeds(u.legalNeeds || []); setPLang(u.preferredLanguage || "English");
        setOccupation(u.occupation || ""); setEmergency(u.emergencyContact || "");
        setCaseNotes(u.caseNotes || "");
      }
      if (u.role === "admin") {
        setDept(u.department || ""); setEmpId(u.employeeId || "");
        setSupervisor(u.supervisor || "");
      }
    } catch {}
    finally { setTimeout(() => setReady(true), 80); }
  };

  useEffect(() => { loadProfile(); }, [user?._id]);

  /* ── upload avatar ────────────────────────────────────────────── */
  const handleAvatar = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = "";
    setUpl(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r  = await fetch(`${API}/api/upload`, { method: "POST", headers: H(), body: fd, credentials: "include" });
      if (r.ok) { const d = await r.json(); setImgPrev(d.url || d.fileUrl); }
    } catch {} finally { setUpl(false); }
  };

  /* ── save ─────────────────────────────────────────────────────── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { name, phone, bio, city, country, dateOfBirth: dob, gender, cnic, profileImage: imgPrev };
      if (role === "lawyer") {
        body.lawyerProfile = {
          specializations: specs, barNumber: barNo, yearsOfExperience: Number(experience) || 0,
          hourlyRate: Number(rate) || 0, languages: langs, education, university, graduationYear: gradYear,
          courts, isAvailable: available, firmName: firm, firmAddress, linkedIn, awards, publications,
          consultationFee: Number(consultFee) || 0,
        };
      }
      if (role === "client") {
        body.legalNeeds = legalNeeds; body.preferredLanguage = prefLang;
        body.occupation = occupation; body.emergencyContact = emergency; body.caseNotes = caseNotes;
      }
      if (role === "admin") {
        body.department = department; body.employeeId = empId; body.supervisor = supervisor;
      }

      // try Redux dispatch first, fallback to direct API
      try {
        await dispatch(updateProfile(body)).unwrap();
      } catch {
        const r = await fetch(`${API}/api/auth/update-profile`, { method: "PUT", credentials: "include", headers: HJ(), body: JSON.stringify(body) });
        if (!r.ok) throw new Error("Failed");
      }
      setToast({ msg: "Profile saved successfully! ✓", type: "success" });
    } catch {
      setToast({ msg: "Failed to save — check connection", type: "error" });
    } finally { setSaving(false); }
  };

  const roleColor = { admin: "#ef4444", lawyer: "#10b981", client: "#3b82f6" }[role] || "#6366f1";
  const roleBg    = { admin: "#fef2f2", lawyer: "#f0fdf4", client: "#eff6ff" }[role] || "#f0f9ff";
  const roleLabel = { admin: "Administrator", lawyer: "Legal Counsel", client: "Client" }[role] || role;

  if (!ready) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, border: "3px solid var(--border,#e2e8f0)", borderTopColor: roleColor, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <style>{`
        @keyframes fd{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tp{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ opacity: ready ? 1 : 0, transition: "opacity 0.4s", animation: "fd 0.4s ease" }}>
        {/* ── Profile header card ──────────────────────────────── */}
        <div style={{ background: "var(--card-bg,#fff)", borderRadius: 24, border: "1px solid var(--border,#f1f5f9)", padding: "24px 28px", marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          {/* avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div onClick={() => fileRef.current?.click()} title="Click to change photo"
              style={{ width: 90, height: 90, borderRadius: "50%", overflow: "hidden", background: roleColor, color: "#fff", fontSize: 32, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `3px solid ${roleColor}`, position: "relative" }}>
              {imgPrev ? <img src={imgPrev} style={{ width: 90, height: 90, objectFit: "cover" }} alt="" /> : (name || "U").charAt(0).toUpperCase()}
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                <span style={{ fontSize: 22 }}>{uploading ? "⏳" : "📷"}</span>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display: "none" }} />
            <div style={{ position: "absolute", bottom: 2, right: 2, width: 20, height: 20, borderRadius: "50%", background: "#10b981", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 9, color: "#fff", fontWeight: 800 }}>✓</span>
            </div>
          </div>
          {/* info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--text-h,#0f172a)" }}>{name || "Your Profile"}</h2>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 20, background: roleBg, color: roleColor }}>{roleLabel}</span>
              {role === "lawyer" && available && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "#f0fdf4", color: "#10b981", border: "1px solid #86efac" }}>● Available</span>}
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "#64748b" }}>{user?.email}</p>
            {city && <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>📍 {city}{country && country !== "Pakistan" ? `, ${country}` : ", Pakistan"}</p>}
            {role === "lawyer" && specs.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                {specs.slice(0, 3).map(s => <span key={s} style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20, background: "#f0fdf4", color: "#10b981" }}>{s}</span>)}
                {specs.length > 3 && <span style={{ fontSize: 11, color: "#94a3b8", padding: "2px 0" }}>+{specs.length - 3} more</span>}
              </div>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", alignSelf: "flex-end" }}>Click avatar to change photo</p>
        </div>

        {/* ── Common: Personal Info ─────────────────────────────── */}
        <Section title="Personal Information" icon="👤">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Full Name"><Inp value={name} onChange={setName} placeholder="Your full name" /></Field>
            </div>
            <Field label="Email Address" hint="Cannot be changed — contact support">
              <Inp value={user?.email || ""} onChange={() => {}} disabled />
            </Field>
            <Field label="Phone Number">
              <Inp value={phone} onChange={setPhone} placeholder="+92 300 0000000" type="tel" />
            </Field>
            <Field label="Date of Birth">
              <Inp value={dob} onChange={setDob} type="date" />
            </Field>
            <Field label="Gender">
              <select value={gender} onChange={e => setGender(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border,#e2e8f0)", fontSize: 14, outline: "none", background: "var(--input-bg,#fff)", color: "var(--text,#0f172a)" }}>
                <option value="">Select gender</option>
                <option>Male</option><option>Female</option><option>Prefer not to say</option>
              </select>
            </Field>
            <Field label="City / Location">
              <Inp value={city} onChange={setCity} placeholder="Karachi, Lahore, Islamabad…" />
            </Field>
            <Field label="Country">
              <Inp value={country} onChange={setCountry} placeholder="Pakistan" />
            </Field>
            <Field label="CNIC / National ID" hint="Kept confidential — for verification only">
              <Inp value={cnic} onChange={setCnic} placeholder="35201-1234567-1" />
            </Field>
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Bio / About">
                <Txt value={bio} onChange={setBio} placeholder="Tell others about yourself — your background, experience, and what you can help with…" rows={3} />
              </Field>
            </div>
          </div>
        </Section>

        {/* ── LAWYER SECTIONS ──────────────────────────────────── */}
        {role === "lawyer" && (<>
          <Section title="Professional Details" icon="⚖️">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Bar Council / Enrollment Number"><Inp value={barNo} onChange={setBarNo} placeholder="e.g. KHC-2018-1234" /></Field>
              <Field label="Years of Experience"><Inp value={experience} onChange={setExp} placeholder="e.g. 8" type="number" /></Field>
              <Field label="Hourly Rate (PKR)"><Inp value={rate} onChange={setRate} placeholder="e.g. 5000" type="number" /></Field>
              <Field label="Consultation Fee (PKR)"><Inp value={consultFee} onChange={setConsultFee} placeholder="e.g. 2500" type="number" /></Field>
              <Field label="Law Firm / Organization"><Inp value={firm} onChange={setFirm} placeholder="Self-employed or firm name" /></Field>
              <Field label="Firm Address"><Inp value={firmAddress} onChange={setFirmAddr} placeholder="Office address" /></Field>
              <div style={{ gridColumn: "1/-1" }}>
                <Toggle value={available} onChange={setAvail} label="Currently available for new cases" />
              </div>
            </div>
          </Section>

          <Section title="Education & Qualifications" icon="🎓">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Degree / Qualification"><Inp value={education} onChange={setEdu} placeholder="e.g. LLB, LLM, Bar-at-Law" /></Field>
              <Field label="University / Institution"><Inp value={university} onChange={setUni} placeholder="e.g. University of Karachi" /></Field>
              <Field label="Graduation Year"><Inp value={gradYear} onChange={setGradYear} placeholder="e.g. 2015" type="number" /></Field>
              <Field label="LinkedIn Profile (Optional)"><Inp value={linkedIn} onChange={setLinkedIn} placeholder="https://linkedin.com/in/…" /></Field>
              <div style={{ gridColumn: "1/-1" }}>
                <Field label="Awards & Recognitions">
                  <Txt value={awards} onChange={setAwards} placeholder="List any notable awards, recognitions…" rows={2} />
                </Field>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <Field label="Publications & Articles">
                  <Txt value={publications} onChange={setPubs} placeholder="Published works, legal articles…" rows={2} />
                </Field>
              </div>
            </div>
          </Section>

          <Section title="Practice Areas" icon="📋">
            <Field label="Specializations (select all that apply)">
              <TagSelector tags={SPECS} selected={specs} onChange={setSpecs} color="#10b981" bg="#f0fdf4" />
            </Field>
            <Field label="Courts Practiced In">
              <TagSelector tags={COURTS} selected={courts} onChange={setCourts} color="#3b82f6" bg="#eff6ff" />
            </Field>
          </Section>

          <Section title="Languages" icon="🌐">
            <Field label="Languages Spoken">
              <TagSelector tags={LANGS} selected={langs} onChange={setLangs} color="#8b5cf6" bg="#f5f3ff" />
            </Field>
          </Section>
        </>)}

        {/* ── CLIENT SECTIONS ──────────────────────────────────── */}
        {role === "client" && (<>
          <Section title="Legal Needs & Preferences" icon="⚖️">
            <Field label="Type of Legal Help Needed (select all that apply)">
              <TagSelector tags={LEGAL_NEEDS} selected={legalNeeds} onChange={setNeeds} color="#3b82f6" bg="#eff6ff" />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 4 }}>
              <Field label="Preferred Language for Communication">
                <select value={prefLang} onChange={e => setPLang(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border,#e2e8f0)", fontSize: 14, outline: "none", background: "var(--input-bg,#fff)", color: "var(--text,#0f172a)" }}>
                  {LANGS.map(l => <option key={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="Occupation / Profession">
                <Inp value={occupation} onChange={setOccupation} placeholder="e.g. Business owner, Teacher…" />
              </Field>
              <Field label="Emergency Contact Number">
                <Inp value={emergency} onChange={setEmergency} placeholder="+92 300 0000000" type="tel" />
              </Field>
            </div>
            <Field label="Additional Notes for Lawyers" hint="Any extra context that might help your lawyer">
              <Txt value={caseNotes} onChange={setCaseNotes} placeholder="Describe your situation briefly…" rows={3} />
            </Field>
          </Section>
        </>)}

        {/* ── ADMIN SECTIONS ───────────────────────────────────── */}
        {role === "admin" && (<>
          <Section title="Administrative Details" icon="🛡️">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Department / Division"><Inp value={department} onChange={setDept} placeholder="e.g. Legal Operations, IT, HR…" /></Field>
              <Field label="Employee ID"><Inp value={empId} onChange={setEmpId} placeholder="e.g. ADM-001" /></Field>
              <Field label="Supervisor / Manager"><Inp value={supervisor} onChange={setSupervisor} placeholder="Supervisor's name" /></Field>
              <Field label="Access Level" hint="Managed by system — contact super-admin to change">
                <Inp value="Full Administrative Access" onChange={() => {}} disabled />
              </Field>
            </div>
          </Section>
        </>)}

        {/* ── Save bar ─────────────────────────────────────────── */}
        <div style={{ background: "var(--card-bg,#fff)", borderRadius: 20, border: "1px solid var(--border,#f1f5f9)", padding: "18px 24px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", flex: 1 }}>All changes are saved to your account immediately.</p>
          <button onClick={loadProfile}
            style={{ padding: "10px 22px", borderRadius: 12, border: "1px solid var(--border,#e2e8f0)", background: "transparent", color: "var(--text-muted,#64748b)", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
            Reset
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: "10px 28px", borderRadius: 12, border: "none", background: roleColor, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, opacity: saving ? 0.7 : 1, boxShadow: `0 4px 14px ${roleColor}40`, transition: "opacity 0.2s", display: "flex", alignItems: "center", gap: 8 }}>
            {saving ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Saving…</> : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}