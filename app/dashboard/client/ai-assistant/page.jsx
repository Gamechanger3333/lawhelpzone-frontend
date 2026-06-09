"use client";
// Client AI Assistant Page — Case Classifier + Document Analyzer
// Dark mode fully supported via CSS variables

import { useState } from "react";
import {
  Bot, Sparkles, FileText, Search, AlertCircle,
  Loader2, CheckCircle, ChevronDown, ChevronUp,
  Zap, Shield, Copy, Check,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H   = () => ({ "Content-Type": "application/json", ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });

const NAVY = "#0A1A3F";

const css = `
  @keyframes fd { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
  @keyframes spin { to { transform: rotate(360deg) } }
  .ai-btn { transition: all 0.18s; cursor: pointer; }
  .ai-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(10,26,63,0.18) !important; }
  .tab-btn { transition: all 0.15s; cursor: pointer; border: none; }
  .section-row { transition: background 0.12s; cursor: pointer; }
  .section-row:hover { background: rgba(10,26,63,0.04) !important; }
  .copy-btn:hover { opacity:0.8; }
  .ai-input {
    width:100%; padding:10px 14px; border-radius:10px;
    border:1px solid var(--border, #e2e8f0); font-size:14px; outline:none;
    box-sizing:border-box; font-family:inherit;
    background: var(--card-bg, #fff);
    color: var(--text-primary, #374151);
  }
  .ai-input::placeholder { color: var(--text-muted, #94a3b8); }
  .ai-card {
    background: var(--bg, #f8fafc);
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 12px;
    padding: 14px 16px;
  }
  .ai-card-white {
    background: var(--card-bg, #fff);
    border: 1px solid var(--border-light, #f1f5f9);
    border-radius: 10px;
    padding: 12px 14px;
  }
  .section-header-btn {
    width:100%; display:flex; align-items:center; justify-content:space-between;
    padding:11px 16px; background:transparent; font-size:13px; font-weight:700;
    color: var(--text-heading, #0f172a); text-align:left;
    border: none; cursor: pointer;
  }
  .section-content {
    padding: 0 16px 12px; border-top: 1px solid var(--border, #e2e8f0);
    padding-top:10px; display:flex; flex-direction:column; gap:6px;
  }
`;

const URGENCY = {
  low:    { bg: "#f0fdf4", color: "#16a34a", label: "Low" },
  medium: { bg: "#fffbeb", color: "#d97706", label: "Medium" },
  high:   { bg: "#fff7ed", color: "#ea580c", label: "High" },
  urgent: { bg: "#fef2f2", color: "#dc2626", label: "Urgent" },
};
const COMPLEXITY = {
  simple:   { color: "#16a34a" },
  moderate: { color: "#d97706" },
  complex:  { color: "#dc2626" },
};

// ── Case Classifier ────────────────────────────────────────────────────────────
function CaseClassifier() {
  const [form, setForm]     = useState({ title: "", description: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState("");

  const classify = async () => {
    if (!form.title.trim() || !form.description.trim()) return setError("Title and description are required.");
    if (form.description.length < 20) return setError("Description too short — add more detail.");
    setError(""); setLoad(true); setResult(null);
    try {
      const res  = await fetch(`${API}/api/ai/classify-case`, { method:"POST", headers:H(), credentials:"include", body:JSON.stringify(form) });
      const data = await res.json();
      if (data.success) setResult(data.classification);
      else setError(data.message || "Classification failed. Try again.");
    } catch { setError("Connection error. Please try again."); }
    finally { setLoad(false); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted,#64748b)", marginBottom:6, letterSpacing:"0.06em", textTransform:"uppercase" }}>Case Title</label>
        <input className="ai-input" placeholder="e.g. Wrongful termination from employer"
          value={form.title} onChange={e => setForm(f => ({ ...f, title:e.target.value }))} />
      </div>
      <div>
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted,#64748b)", marginBottom:6, letterSpacing:"0.06em", textTransform:"uppercase" }}>Describe Your Legal Issue</label>
        <textarea className="ai-input" style={{ minHeight:110, resize:"vertical", lineHeight:1.6 }}
          placeholder="Describe your situation in detail..."
          value={form.description} onChange={e => setForm(f => ({ ...f, description:e.target.value }))} />
        <p style={{ margin:"4px 0 0", fontSize:11, color:"var(--text-muted,#94a3b8)" }}>{form.description.length} characters</p>
      </div>

      {error && (
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#dc2626" }}>
          <AlertCircle size={14} />{error}
        </div>
      )}

      <button className="ai-btn" onClick={classify} disabled={loading}
        style={{ padding:"12px 0", borderRadius:12, background:NAVY, color:"#fff", border:"none", fontWeight:700, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 14px rgba(10,26,63,0.25)", opacity:loading?0.7:1 }}>
        {loading ? <><Loader2 size={16} style={{ animation:"spin 1s linear infinite" }} /> Analyzing...</> : <><Sparkles size={16} /> Classify My Case</>}
      </button>

      {result && (
        <div style={{ background:"var(--bg,#f8fafc)", borderRadius:16, padding:20, border:"1px solid var(--border,#e2e8f0)", animation:"fd 0.4s ease", display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:700, color:"#16a34a" }}>
            <CheckCircle size={15} /> AI Classification Complete
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              { label:"Legal Category",     value:result.category },
              { label:"Recommended Lawyer", value:result.recommendedSpecialization },
            ].map(({ label, value }) => (
              <div key={label} className="ai-card-white">
                <p style={{ margin:"0 0 3px", fontSize:10, color:"var(--text-muted,#94a3b8)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</p>
                <p style={{ margin:0, fontSize:13, fontWeight:700, color:"var(--text-heading,"+NAVY+")" }}>{value}</p>
              </div>
            ))}
            <div className="ai-card-white">
              <p style={{ margin:"0 0 6px", fontSize:10, color:"var(--text-muted,#94a3b8)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>Urgency</p>
              <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:URGENCY[result.urgency]?.bg||"#f1f5f9", color:URGENCY[result.urgency]?.color||"#374151" }}>
                {URGENCY[result.urgency]?.label || result.urgency}
              </span>
            </div>
            <div className="ai-card-white">
              <p style={{ margin:"0 0 3px", fontSize:10, color:"var(--text-muted,#94a3b8)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>Complexity</p>
              <p style={{ margin:0, fontSize:13, fontWeight:700, color:COMPLEXITY[result.estimatedComplexity]?.color||"#374151", textTransform:"capitalize" }}>{result.estimatedComplexity}</p>
            </div>
          </div>

          <div className="ai-card-white">
            <p style={{ margin:"0 0 5px", fontSize:10, color:"var(--text-muted,#94a3b8)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>Case Summary</p>
            <p style={{ margin:0, fontSize:13, color:"var(--text-primary,#374151)", lineHeight:1.7 }}>{result.summary}</p>
          </div>

          {result.keyIssues?.length > 0 && (
            <div className="ai-card-white">
              <p style={{ margin:"0 0 8px", fontSize:10, color:"var(--text-muted,#94a3b8)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>Key Issues</p>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {result.keyIssues.map((issue, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:"var(--text-primary,#374151)" }}>
                    <span style={{ width:18, height:18, borderRadius:"50%", background:"#eff6ff", color:"#3b82f6", fontSize:10, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>{i+1}</span>
                    {issue}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.suggestedNextStep && (
            <div style={{ background:"#eff6ff", borderRadius:10, padding:"12px 14px", border:"1px solid #bfdbfe", display:"flex", alignItems:"flex-start", gap:8 }}>
              <Zap size={13} style={{ color:"#3b82f6", flexShrink:0, marginTop:1 }} />
              <p style={{ margin:0, fontSize:13, color:"#1e40af", lineHeight:1.6 }}><strong>Next Step:</strong> {result.suggestedNextStep}</p>
            </div>
          )}
          <p style={{ margin:0, fontSize:11, color:"var(--text-muted,#94a3b8)", fontStyle:"italic" }}>⚠️ AI classification is a suggestion only — final categorization may differ after lawyer review.</p>
        </div>
      )}
    </div>
  );
}

// ── Copy Button ────────────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button className="copy-btn tab-btn" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:7, border:"1px solid var(--border,#e2e8f0)", background:"var(--card-bg,#fff)", fontSize:11, fontWeight:600, color:"var(--text-muted,#64748b)", cursor:"pointer" }}>
      {copied ? <><Check size={10} style={{ color:"#16a34a" }} /> Copied</> : <><Copy size={10} /> Copy</>}
    </button>
  );
}

// ── Document Analyzer ─────────────────────────────────────────────────────────
function DocumentAnalyzer() {
  const [fileName, setName] = useState("");
  const [text, setText]     = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState("");
  const [open, setOpen]     = useState({ keyPoints:true, parties:true, importantDates:true, warnings:true });
  const toggle = k => setOpen(o => ({ ...o, [k]:!o[k] }));

  const analyze = async () => {
    if (!text.trim() || text.length < 50) return setError("Paste at least 50 characters of document text.");
    setError(""); setLoad(true); setResult(null);
    try {
      const res  = await fetch(`${API}/api/ai/analyze-document`, { method:"POST", headers:H(), credentials:"include", body:JSON.stringify({ text, fileName:fileName||"document" }) });
      const data = await res.json();
      if (data.success) {
        setResult(data.analysis);
        // Reset all sections to open when new result arrives
        setOpen({ keyPoints:true, parties:true, importantDates:true, warnings:true });
      } else {
        setError(data.message || "Analysis failed. Try again.");
      }
    } catch { setError("Connection error. Please try again."); }
    finally { setLoad(false); }
  };

  // Sections are computed from result at render time (not stale)
  const sections = result ? [
    { key:"keyPoints",      label:"📋 Key Points",       items: Array.isArray(result.keyPoints)      ? result.keyPoints      : [] },
    { key:"parties",        label:"👥 Parties Involved",  items: Array.isArray(result.parties)        ? result.parties        : [] },
    { key:"importantDates", label:"📅 Important Dates",   items: Array.isArray(result.importantDates) ? result.importantDates : [] },
    { key:"warnings",       label:"⚠️ Warnings",          items: Array.isArray(result.warnings)       ? result.warnings       : [] },
  ] : [];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted,#64748b)", marginBottom:6, letterSpacing:"0.06em", textTransform:"uppercase" }}>Document Name (optional)</label>
        <input className="ai-input" placeholder="e.g. Employment Contract, Rental Agreement"
          value={fileName} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted,#64748b)", marginBottom:6, letterSpacing:"0.06em", textTransform:"uppercase" }}>Paste Document Text</label>
        <textarea className="ai-input" style={{ minHeight:130, resize:"vertical", lineHeight:1.6 }}
          placeholder="Paste your legal document text here. AI will extract key information, identify parties, flag important dates, and highlight potential warnings..."
          value={text} onChange={e => setText(e.target.value)} />
        <p style={{ margin:"4px 0 0", fontSize:11, color:"var(--text-muted,#94a3b8)" }}>{text.length} characters (max 3,000 analyzed)</p>
      </div>

      {error && (
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#dc2626" }}>
          <AlertCircle size={14} />{error}
        </div>
      )}

      <button className="ai-btn" onClick={analyze} disabled={loading}
        style={{ padding:"12px 0", borderRadius:12, background:NAVY, color:"#fff", border:"none", fontWeight:700, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 14px rgba(10,26,63,0.25)", opacity:loading?0.7:1 }}>
        {loading ? <><Loader2 size={16} style={{ animation:"spin 1s linear infinite" }} /> Analyzing document...</> : <><FileText size={16} /> Analyze Document</>}
      </button>

      {result && (
        <div style={{ display:"flex", flexDirection:"column", gap:10, animation:"fd 0.4s ease" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:700, color:"#16a34a" }}>
            <CheckCircle size={15} /> Analysis Complete
          </div>

          {/* Summary card */}
          <div className="ai-card">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <p style={{ margin:0, fontSize:10, color:"var(--text-muted,#94a3b8)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>Document Summary</p>
                <span style={{ fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:20, background:"#eff6ff", color:"#3b82f6" }}>{result.documentType}</span>
              </div>
              <CopyBtn text={result.summary} />
            </div>
            <p style={{ margin:0, fontSize:13, color:"var(--text-primary,#374151)", lineHeight:1.7 }}>{result.summary}</p>
          </div>

          {/* Collapsible sections */}
          {sections.map(({ key, label, items }) =>
            items.length > 0 ? (
              <div key={key} style={{ background:"var(--bg,#f8fafc)", borderRadius:12, border:"1px solid var(--border,#e2e8f0)", overflow:"hidden" }}>
                <button className="section-row section-header-btn" onClick={() => toggle(key)}>
                  <span>{label}</span>
                  {open[key] ? <ChevronUp size={13} style={{ color:"var(--text-muted,#94a3b8)" }} /> : <ChevronDown size={13} style={{ color:"var(--text-muted,#94a3b8)" }} />}
                </button>
                {open[key] && (
                  <div className="section-content">
                    {items.map((item, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:"var(--text-primary,#374151)", lineHeight:1.6 }}>
                        <span style={{ color:"#3b82f6", flexShrink:0, marginTop:2 }}>•</span>{item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null
          )}

          {result.recommendedAction && (
            <div style={{ background:"#eff6ff", borderRadius:10, padding:"12px 14px", border:"1px solid #bfdbfe", display:"flex", alignItems:"flex-start", gap:8 }}>
              <Zap size={13} style={{ color:"#3b82f6", flexShrink:0, marginTop:1 }} />
              <p style={{ margin:0, fontSize:13, color:"#1e40af", lineHeight:1.6 }}><strong>Recommended Action:</strong> {result.recommendedAction}</p>
            </div>
          )}
          <p style={{ margin:0, fontSize:11, color:"var(--text-muted,#94a3b8)", fontStyle:"italic" }}>⚠️ AI analysis is for informational purposes only. Always have a qualified lawyer review legal documents.</p>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ClientAiAssistantPage() {
  const [tab, setTab] = useState("classify");
  const tabs = [
    { id:"classify", label:"Case Classifier",   icon:Search   },
    { id:"document", label:"Document Analyzer", icon:FileText },
  ];

  return (
    <div style={{ maxWidth:740, margin:"0 auto", padding:"28px 24px", animation:"fd 0.5s ease" }}>
      <style>{css}</style>

      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <div style={{ width:42, height:42, borderRadius:13, background:NAVY, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(10,26,63,0.25)" }}>
          <Bot size={20} style={{ color:"#fff" }} />
        </div>
        <div>
          <h1 style={{ margin:0, fontSize:21, fontWeight:800, color:"var(--text-heading,#0f172a)" }}>AI Legal Tools</h1>
          <p style={{ margin:0, fontSize:12, color:"var(--text-muted,#64748b)" }}>Powered by Google Gemini</p>
        </div>
      </div>

      <div style={{ display:"flex", alignItems:"flex-start", gap:10, background:"#fffbeb", border:"1px solid #fde68a", borderRadius:12, padding:"11px 14px", marginBottom:20 }}>
        <Shield size={13} style={{ color:"#d97706", flexShrink:0, marginTop:1 }} />
        <p style={{ margin:0, fontSize:12, color:"#92400e", lineHeight:1.6 }}>
          <strong>Disclaimer:</strong> AI provides informational assistance only and does not constitute legal advice. Always consult a qualified lawyer for your specific situation.
        </p>
      </div>

      <div style={{ display:"flex", background:"var(--bg,#f1f5f9)", borderRadius:12, padding:4, marginBottom:20 }}>
        {tabs.map(({ id, label, icon:Icon }) => (
          <button key={id} className="tab-btn" onClick={() => setTab(id)}
            style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"9px 0", borderRadius:9, fontSize:13, fontWeight:700,
              background: tab===id ? "var(--card-bg,#fff)" : "transparent",
              color: tab===id ? NAVY : "var(--text-muted,#64748b)",
              boxShadow: tab===id ? "0 1px 6px rgba(0,0,0,0.08)" : "none",
            }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      <div style={{ background:"var(--card-bg,#fff)", borderRadius:18, border:"1px solid var(--border,#e2e8f0)", padding:"22px 24px", boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
        {tab==="classify" && <CaseClassifier />}
        {tab==="document" && <DocumentAnalyzer />}
      </div>
    </div>
  );
}
