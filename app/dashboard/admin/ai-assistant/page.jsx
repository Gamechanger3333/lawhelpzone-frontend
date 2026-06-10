"use client";
// Admin AI Assistant — Full Platform Intelligence Dashboard
// Features: Platform Insights, AI Chat with live data, Case Classifier, Document Analyzer

import { useState, useEffect, useRef } from "react";
import {
  Bot, Sparkles, BarChart3, FileText, Search, AlertCircle,
  Loader2, CheckCircle, RefreshCw, TrendingUp, Users, Briefcase,
  Scale, Shield, Send, MessageSquare, Copy, Check, Zap,
  ChevronDown, ChevronUp, Brain,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H   = () => ({ "Content-Type": "application/json", ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });

const NAVY  = "#0A1A3F";
const RED   = "#ef4444";

const css = `
  @keyframes fd { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes chatDot {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40%            { transform: scale(1);   opacity: 1; }
  }
  .ai-btn { transition: all 0.18s; cursor: pointer; }
  .ai-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(239,68,68,0.22) !important; }
  .tab-btn { transition: all 0.15s; cursor: pointer; border: none; }
  .ai-input {
    width:100%; padding:10px 14px; border-radius:10px;
    border:1px solid var(--border, #e2e8f0); font-size:14px; outline:none;
    box-sizing:border-box; font-family:inherit;
    background: var(--card-bg, #fff);
    color: var(--text-primary, #374151);
    transition: border-color 0.15s;
  }
  .ai-input:focus { border-color: #ef4444; }
  .ai-input::placeholder { color: var(--text-muted, #94a3b8); }
  .stat-card { transition: all 0.2s; }
  .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
  .chat-msg-user { background: ${RED}; color: #fff; border-radius: 14px 14px 4px 14px; }
  .chat-msg-ai { background: var(--bg, #f1f5f9); color: var(--text-primary, #374151); border-radius: 14px 14px 14px 4px; }
  .section-row { transition: background 0.12s; cursor: pointer; }
  .section-row:hover { background: rgba(239,68,68,0.04) !important; }
`;

// ── Copy Button ────────────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button className="tab-btn" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:7, border:"1px solid var(--border,#e2e8f0)", background:"var(--card-bg,#fff)", fontSize:11, fontWeight:600, color:"var(--text-muted,#64748b)", cursor:"pointer" }}>
      {copied ? <><Check size={10} style={{ color:"#16a34a" }} /> Copied</> : <><Copy size={10} /> Copy</>}
    </button>
  );
}

// ── Platform Insights Panel ────────────────────────────────────────────────────
function PlatformInsights() {
  const [data, setData]   = useState(null);
  const [loading, setL]   = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setL(true); setError("");
    try {
      const r = await fetch(`${API}/api/ai/platform-insights`, { headers: H(), credentials: "include" });
      const d = await r.json();
      if (d.success) setData(d);
      else setError(d.message || "Failed to load insights");
    } catch { setError("Connection error. Please try again."); }
    finally { setL(false); }
  };

  useEffect(() => { load(); }, []);

  const stats = data?.stats;
  const ins   = data?.insights;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Stats grid */}
      {stats && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10, animation:"fd 0.4s ease" }}>
          {[
            { l:"Total Users",    v:stats.totalUsers,     icon:Users,    c:"#ef4444", bg:"#fef2f2" },
            { l:"Lawyers",        v:stats.totalLawyers,   icon:Briefcase,c:"#10b981", bg:"#f0fdf4" },
            { l:"Clients",        v:stats.totalClients,   icon:Users,    c:"#3b82f6", bg:"#eff6ff" },
            { l:"Total Cases",    v:stats.totalCases,     icon:Scale,    c:"#8b5cf6", bg:"#f5f3ff" },
            { l:"Open Cases",     v:stats.openCases,      icon:TrendingUp,c:"#f59e0b",bg:"#fffbeb" },
            { l:"This Month",     v:stats.thisMonthCases, icon:BarChart3, c:"#06b6d4", bg:"#ecfeff" },
          ].map(({ l, v, icon: Icon, c, bg }) => (
            <div key={l} className="stat-card" style={{ background:"var(--card-bg,#fff)", borderRadius:14, padding:"14px 16px", border:"1px solid var(--border-light,#f1f5f9)", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ width:32, height:32, borderRadius:9, background:bg, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:8 }}>
                <Icon size={15} style={{ color:c }} />
              </div>
              <p style={{ margin:0, fontSize:24, fontWeight:800, color:"var(--text-heading,#0f172a)", lineHeight:1 }}>{v ?? "—"}</p>
              <p style={{ margin:"4px 0 0", fontSize:11, color:"var(--text-muted,#64748b)" }}>{l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      {loading && (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"20px 0", color:"var(--text-muted,#64748b)", fontSize:13 }}>
          <Loader2 size={16} style={{ animation:"spin 1s linear infinite", color:RED }} />
          Generating AI insights…
        </div>
      )}

      {error && (
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#dc2626" }}>
          <AlertCircle size={14} />{error}
          <button onClick={load} style={{ marginLeft:"auto", background:"none", border:"none", color:RED, cursor:"pointer", fontSize:11, fontWeight:700 }}>Retry</button>
        </div>
      )}

      {ins && (
        <div style={{ display:"flex", flexDirection:"column", gap:12, animation:"fd 0.4s ease" }}>
          {/* Health score */}
          <div style={{ background:`linear-gradient(135deg, ${NAVY} 0%, #1e3a5f 100%)`, borderRadius:16, padding:"18px 20px", color:"#fff" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <Brain size={18} style={{ color:"#93c5fd" }} />
                <span style={{ fontSize:13, fontWeight:700, color:"#e2e8f0" }}>Platform Health Score</span>
              </div>
              <div style={{ fontSize:28, fontWeight:800, color:"#fff" }}>{ins.healthScore}<span style={{ fontSize:14, color:"#93c5fd" }}>/100</span></div>
            </div>
            <div style={{ background:"rgba(255,255,255,0.12)", borderRadius:6, height:6, overflow:"hidden" }}>
              <div style={{ height:"100%", borderRadius:6, width:`${ins.healthScore}%`, background: ins.healthScore >= 80 ? "#4ade80" : ins.healthScore >= 60 ? "#fbbf24" : "#f87171", transition:"width 1s ease" }} />
            </div>
            <p style={{ margin:"10px 0 0", fontSize:13, color:"#cbd5e1", lineHeight:1.5 }}>{ins.headline}</p>
          </div>

          {/* Insights & alerts */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {ins.insights?.length > 0 && (
              <div style={{ background:"var(--card-bg,#fff)", borderRadius:14, padding:"14px 16px", border:"1px solid var(--border,#e2e8f0)" }}>
                <p style={{ margin:"0 0 10px", fontSize:12, fontWeight:700, color:"var(--text-muted,#64748b)", textTransform:"uppercase", letterSpacing:"0.06em" }}>💡 Insights</p>
                {ins.insights.map((item, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:12, color:"var(--text-primary,#374151)", marginBottom:6, lineHeight:1.5 }}>
                    <span style={{ color:"#3b82f6", flexShrink:0, marginTop:2 }}>•</span>{item}
                  </div>
                ))}
              </div>
            )}
            {ins.alerts?.length > 0 && (
              <div style={{ background:"#fffbeb", borderRadius:14, padding:"14px 16px", border:"1px solid #fde68a" }}>
                <p style={{ margin:"0 0 10px", fontSize:12, fontWeight:700, color:"#92400e", textTransform:"uppercase", letterSpacing:"0.06em" }}>⚠️ Alerts</p>
                {ins.alerts.map((item, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:12, color:"#78350f", marginBottom:6, lineHeight:1.5 }}>
                    <span style={{ color:"#f59e0b", flexShrink:0, marginTop:2 }}>•</span>{item}
                  </div>
                ))}
              </div>
            )}
          </div>

          {ins.recommendations?.length > 0 && (
            <div style={{ background:"#f0fdf4", borderRadius:14, padding:"14px 16px", border:"1px solid #bbf7d0" }}>
              <p style={{ margin:"0 0 10px", fontSize:12, fontWeight:700, color:"#166534", textTransform:"uppercase", letterSpacing:"0.06em" }}>✅ Recommendations</p>
              {ins.recommendations.map((item, i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:12, color:"#14532d", marginBottom:6, lineHeight:1.5 }}>
                  <span style={{ color:"#16a34a", flexShrink:0, marginTop:2, fontWeight:700 }}>{i+1}.</span>{item}
                </div>
              ))}
            </div>
          )}

          {ins.clientLawyerRatio && (
            <div style={{ background:"#eff6ff", borderRadius:12, padding:"12px 16px", border:"1px solid #bfdbfe", fontSize:13, color:"#1e40af", lineHeight:1.6 }}>
              <strong>Client/Lawyer Ratio:</strong> {ins.clientLawyerRatio}
            </div>
          )}
        </div>
      )}

      <button className="ai-btn" onClick={load} disabled={loading}
        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"11px 0", borderRadius:12, background:loading?"#e2e8f0":RED, color:loading?"#94a3b8":"#fff", border:"none", fontWeight:700, fontSize:13, boxShadow:loading?"none":"0 4px 14px rgba(239,68,68,0.3)" }}>
        <RefreshCw size={14} style={{ animation:loading?"spin 1s linear infinite":"none" }} />
        {loading ? "Refreshing…" : "Refresh Insights"}
      </button>
    </div>
  );
}

// ── Admin AI Chat ──────────────────────────────────────────────────────────────
function AdminAiChat() {
  const [history, setHistory] = useState([]);
  const [input, setInput]   = useState("");
  const [loading, setL]     = useState(false);
  const [error, setError]   = useState("");
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [history, loading]);

  const SUGGESTED = [
    "How many users registered this month?",
    "What's the ratio of clients to lawyers?",
    "How many cases are currently open?",
    "Give me a platform performance summary",
    "Are there any concerning trends?",
    "How can I improve lawyer engagement?",
  ];

  const send = async (msg) => {
    const text = (msg || input).trim();
    if (!text || loading) return;
    setHistory(h => [...h, { role:"user", content:text }]);
    setInput(""); setError(""); setL(true);
    try {
      const r = await fetch(`${API}/api/ai/admin-chat`, {
        method:"POST", headers:H(), credentials:"include",
        body: JSON.stringify({ message:text, history:history.slice(-8) }),
      });
      const d = await r.json();
      if (d.success) setHistory(h => [...h, { role:"assistant", content:d.reply }]);
      else { setError(d.message || "Request failed. Please try again."); setHistory(h => h.slice(0,-1)); }
    } catch { setError("Connection error. Please try again."); setHistory(h => h.slice(0,-1)); }
    finally { setL(false); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:520 }}>
      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"12px 0", display:"flex", flexDirection:"column", gap:10 }}>
        {history.length === 0 && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, paddingTop:16 }}>
            <div style={{ width:52, height:52, borderRadius:"50%", background:"#fef3c7", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Brain size={26} style={{ color:"#f59e0b" }} />
            </div>
            <p style={{ margin:0, fontSize:14, fontWeight:700, color:"var(--text-heading,#0f172a)", textAlign:"center" }}>Admin Intelligence</p>
            <p style={{ margin:0, fontSize:12, color:"var(--text-muted,#64748b)", textAlign:"center", lineHeight:1.6, maxWidth:280 }}>
              I have real-time access to your platform data. Ask me anything about users, cases, statistics, or operations.
            </p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, justifyContent:"center" }}>
              {SUGGESTED.map(s => (
                <button key={s} onClick={() => send(s)}
                  style={{ padding:"5px 11px", borderRadius:20, border:"1px solid #fde68a", background:"#fffbeb", fontSize:11, color:"#92400e", cursor:"pointer", fontWeight:500 }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((msg, i) => (
          <div key={i} style={{ display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{ width:26, height:26, borderRadius:"50%", background:"#fef3c7", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginRight:8, marginTop:2 }}>
                <Brain size={13} style={{ color:"#f59e0b" }} />
              </div>
            )}
            <div style={{
              maxWidth:"78%", padding:"10px 14px",
              borderRadius:msg.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",
              background:msg.role==="user"?NAVY:"var(--bg,#f1f5f9)",
              color:msg.role==="user"?"#fff":"var(--text-primary,#374151)",
              fontSize:13, lineHeight:1.65, wordBreak:"break-word", whiteSpace:"pre-wrap",
            }}>
              {msg.content}
              {msg.role === "assistant" && <CopyBtn text={msg.content} />}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:26, height:26, borderRadius:"50%", background:"#fef3c7", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Brain size={13} style={{ color:"#f59e0b" }} />
            </div>
            <div style={{ padding:"10px 14px", borderRadius:"14px 14px 14px 4px", background:"var(--bg,#f1f5f9)", display:"flex", gap:4, alignItems:"center" }}>
              {[0,1,2].map(i => (
                <span key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#94a3b8", animation:"chatDot 1.2s ease infinite", animationDelay:`${i*0.2}s`, display:"inline-block" }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"9px 12px", fontSize:12, color:"#dc2626" }}>
            <AlertCircle size={12} />{error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ borderTop:"1px solid var(--border,#f1f5f9)", paddingTop:12 }}>
        {history.length > 0 && (
          <button onClick={() => { setHistory([]); setError(""); }} style={{ fontSize:11, color:"#94a3b8", background:"none", border:"none", cursor:"pointer", marginBottom:8, fontWeight:600 }}>
            ↩ Clear conversation
          </button>
        )}
        <div style={{ display:"flex", gap:8 }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about platform stats, users, cases, trends..."
            rows={2}
            className="ai-input"
            style={{ flex:1, resize:"none", lineHeight:1.5 }}
            disabled={loading}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            style={{ width:44, height:44, borderRadius:12, background:input.trim()&&!loading?RED:"#e2e8f0", border:"none", cursor:input.trim()&&!loading?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, alignSelf:"flex-end", transition:"background 0.15s" }}>
            {loading ? <Loader2 size={16} style={{ color:"#94a3b8", animation:"spin 1s linear infinite" }} /> : <Send size={16} style={{ color:input.trim()?"#fff":"#94a3b8" }} />}
          </button>
        </div>
        <p style={{ margin:"6px 0 0", fontSize:10, color:"#94a3b8", textAlign:"center" }}>⚡ Uses live platform data — answers reflect current state</p>
      </div>
    </div>
  );
}

// ── Case Classifier (Admin version) ───────────────────────────────────────────
function CaseClassifier() {
  const [form, setForm]     = useState({ title:"", description:"" });
  const [result, setResult] = useState(null);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState("");

  const URGENCY = {
    low:    { bg:"#f0fdf4", color:"#16a34a", label:"Low" },
    medium: { bg:"#fffbeb", color:"#d97706", label:"Medium" },
    high:   { bg:"#fff7ed", color:"#ea580c", label:"High" },
    urgent: { bg:"#fef2f2", color:"#dc2626", label:"Urgent" },
  };
  const COMPLEXITY = { simple:{ color:"#16a34a" }, moderate:{ color:"#d97706" }, complex:{ color:"#dc2626" } };

  const classify = async () => {
    if (!form.title.trim() || !form.description.trim()) return setError("Title and description are required.");
    if (form.description.length < 20) return setError("Description too short — add more detail.");
    setError(""); setLoad(true); setResult(null);
    try {
      const r = await fetch(`${API}/api/ai/classify-case`, { method:"POST", headers:H(), credentials:"include", body:JSON.stringify(form) });
      const d = await r.json();
      if (d.success) setResult(d.classification);
      else setError(d.message || "Classification failed. Try again.");
    } catch { setError("Connection error. Please try again."); }
    finally { setLoad(false); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted,#64748b)", marginBottom:6, letterSpacing:"0.06em", textTransform:"uppercase" }}>Case Title</label>
        <input className="ai-input" placeholder="e.g. Wrongful termination from employer" value={form.title} onChange={e => setForm(f => ({ ...f, title:e.target.value }))} />
      </div>
      <div>
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted,#64748b)", marginBottom:6, letterSpacing:"0.06em", textTransform:"uppercase" }}>Describe the Legal Issue</label>
        <textarea className="ai-input" style={{ minHeight:100, resize:"vertical", lineHeight:1.6 }} placeholder="Describe the situation in detail..." value={form.description} onChange={e => setForm(f => ({ ...f, description:e.target.value }))} />
        <p style={{ margin:"4px 0 0", fontSize:11, color:"var(--text-muted,#94a3b8)" }}>{form.description.length} characters</p>
      </div>

      {error && (
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#dc2626" }}>
          <AlertCircle size={14} />{error}
        </div>
      )}

      <button className="ai-btn" onClick={classify} disabled={loading}
        style={{ padding:"12px 0", borderRadius:12, background:RED, color:"#fff", border:"none", fontWeight:700, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 14px rgba(239,68,68,0.3)", opacity:loading?0.7:1 }}>
        {loading ? <><Loader2 size={16} style={{ animation:"spin 1s linear infinite" }} /> Analyzing...</> : <><Sparkles size={16} /> Classify Case</>}
      </button>

      {result && (
        <div style={{ background:"var(--bg,#f8fafc)", borderRadius:16, padding:20, border:"1px solid var(--border,#e2e8f0)", animation:"fd 0.4s ease", display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:700, color:"#16a34a" }}>
            <CheckCircle size={15} /> Classification Complete
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[{ label:"Legal Category", value:result.category }, { label:"Recommended Lawyer", value:result.recommendedSpecialization }].map(({ label, value }) => (
              <div key={label} style={{ background:"var(--card-bg,#fff)", borderRadius:10, padding:"12px 14px", border:"1px solid var(--border-light,#f1f5f9)" }}>
                <p style={{ margin:"0 0 3px", fontSize:10, color:"var(--text-muted,#94a3b8)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</p>
                <p style={{ margin:0, fontSize:13, fontWeight:700, color:"var(--text-heading,"+NAVY+")" }}>{value}</p>
              </div>
            ))}
            <div style={{ background:"var(--card-bg,#fff)", borderRadius:10, padding:"12px 14px", border:"1px solid var(--border-light,#f1f5f9)" }}>
              <p style={{ margin:"0 0 6px", fontSize:10, color:"var(--text-muted,#94a3b8)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>Urgency</p>
              <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:URGENCY[result.urgency]?.bg||"#f1f5f9", color:URGENCY[result.urgency]?.color||"#374151" }}>
                {URGENCY[result.urgency]?.label || result.urgency}
              </span>
            </div>
            <div style={{ background:"var(--card-bg,#fff)", borderRadius:10, padding:"12px 14px", border:"1px solid var(--border-light,#f1f5f9)" }}>
              <p style={{ margin:"0 0 3px", fontSize:10, color:"var(--text-muted,#94a3b8)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>Complexity</p>
              <p style={{ margin:0, fontSize:13, fontWeight:700, color:COMPLEXITY[result.estimatedComplexity]?.color||"#374151", textTransform:"capitalize" }}>{result.estimatedComplexity}</p>
            </div>
          </div>
          <div style={{ background:"var(--card-bg,#fff)", borderRadius:10, padding:"12px 14px", border:"1px solid var(--border-light,#f1f5f9)" }}>
            <p style={{ margin:"0 0 5px", fontSize:10, color:"var(--text-muted,#94a3b8)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>Case Summary</p>
            <p style={{ margin:0, fontSize:13, color:"var(--text-primary,#374151)", lineHeight:1.7 }}>{result.summary}</p>
          </div>
          {result.suggestedNextStep && (
            <div style={{ background:"#eff6ff", borderRadius:10, padding:"12px 14px", border:"1px solid #bfdbfe", display:"flex", alignItems:"flex-start", gap:8 }}>
              <Zap size={13} style={{ color:"#3b82f6", flexShrink:0, marginTop:1 }} />
              <p style={{ margin:0, fontSize:13, color:"#1e40af", lineHeight:1.6 }}><strong>Next Step:</strong> {result.suggestedNextStep}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Document Analyzer (Admin version) ─────────────────────────────────────────
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
      const r = await fetch(`${API}/api/ai/analyze-document`, { method:"POST", headers:H(), credentials:"include", body:JSON.stringify({ text, fileName:fileName||"document" }) });
      const d = await r.json();
      if (d.success) { setResult(d.analysis); setOpen({ keyPoints:true, parties:true, importantDates:true, warnings:true }); }
      else setError(d.message || "Analysis failed. Try again.");
    } catch { setError("Connection error. Please try again."); }
    finally { setLoad(false); }
  };

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
        <input className="ai-input" placeholder="e.g. Terms of Service, User Agreement" value={fileName} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted,#64748b)", marginBottom:6, letterSpacing:"0.06em", textTransform:"uppercase" }}>Paste Document Text</label>
        <textarea className="ai-input" style={{ minHeight:120, resize:"vertical", lineHeight:1.6 }} placeholder="Paste document text here..." value={text} onChange={e => setText(e.target.value)} />
        <p style={{ margin:"4px 0 0", fontSize:11, color:"var(--text-muted,#94a3b8)" }}>{text.length} characters (max 3,000 analyzed)</p>
      </div>

      {error && (
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#dc2626" }}>
          <AlertCircle size={14} />{error}
        </div>
      )}

      <button className="ai-btn" onClick={analyze} disabled={loading}
        style={{ padding:"12px 0", borderRadius:12, background:RED, color:"#fff", border:"none", fontWeight:700, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 14px rgba(239,68,68,0.3)", opacity:loading?0.7:1 }}>
        {loading ? <><Loader2 size={16} style={{ animation:"spin 1s linear infinite" }} /> Analyzing...</> : <><FileText size={16} /> Analyze Document</>}
      </button>

      {result && (
        <div style={{ display:"flex", flexDirection:"column", gap:10, animation:"fd 0.4s ease" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:700, color:"#16a34a" }}>
            <CheckCircle size={15} /> Analysis Complete
          </div>
          <div style={{ background:"var(--bg,#f8fafc)", borderRadius:12, padding:"14px 16px", border:"1px solid var(--border,#e2e8f0)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <p style={{ margin:0, fontSize:10, color:"var(--text-muted,#94a3b8)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>Document Summary</p>
                <span style={{ fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:20, background:"#fef2f2", color:RED }}>{result.documentType}</span>
              </div>
              <CopyBtn text={result.summary} />
            </div>
            <p style={{ margin:0, fontSize:13, color:"var(--text-primary,#374151)", lineHeight:1.7 }}>{result.summary}</p>
          </div>
          {sections.map(({ key, label, items }) => items.length > 0 ? (
            <div key={key} style={{ background:"var(--bg,#f8fafc)", borderRadius:12, border:"1px solid var(--border,#e2e8f0)", overflow:"hidden" }}>
              <button className="section-row" onClick={() => toggle(key)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 16px", background:"transparent", fontSize:13, fontWeight:700, color:"var(--text-heading,#0f172a)", border:"none", cursor:"pointer" }}>
                <span>{label}</span>
                {open[key] ? <ChevronUp size={13} style={{ color:"var(--text-muted,#94a3b8)" }} /> : <ChevronDown size={13} style={{ color:"var(--text-muted,#94a3b8)" }} />}
              </button>
              {open[key] && (
                <div style={{ padding:"0 16px 12px", borderTop:"1px solid var(--border,#e2e8f0)", paddingTop:10, display:"flex", flexDirection:"column", gap:6 }}>
                  {items.map((item, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:"var(--text-primary,#374151)", lineHeight:1.6 }}>
                      <span style={{ color:RED, flexShrink:0, marginTop:2 }}>•</span>{item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null)}
          {result.recommendedAction && (
            <div style={{ background:"#eff6ff", borderRadius:10, padding:"12px 14px", border:"1px solid #bfdbfe", display:"flex", alignItems:"flex-start", gap:8 }}>
              <Zap size={13} style={{ color:"#3b82f6", flexShrink:0, marginTop:1 }} />
              <p style={{ margin:0, fontSize:13, color:"#1e40af", lineHeight:1.6 }}><strong>Recommended Action:</strong> {result.recommendedAction}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function AdminAiAssistantPage() {
  const [tab, setTab] = useState("insights");

  const tabs = [
    { id:"insights",  label:"Platform Insights", icon:BarChart3     },
    { id:"chat",      label:"AI Chat",            icon:MessageSquare },
    { id:"classify",  label:"Case Classifier",    icon:Search        },
    { id:"document",  label:"Doc Analyzer",       icon:FileText      },
  ];

  return (
    <div style={{ maxWidth:860, margin:"0 auto", padding:"28px 24px", animation:"fd 0.5s ease" }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <div style={{ width:46, height:46, borderRadius:14, background:RED, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(239,68,68,0.35)" }}>
          <Brain size={22} style={{ color:"#fff" }} />
        </div>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:"var(--text-heading,#0f172a)" }}>Admin AI Command Center</h1>
          <p style={{ margin:0, fontSize:12, color:"var(--text-muted,#64748b)" }}>Powered by Google Gemini · Real-time platform intelligence</p>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:10, background:"#fef3c7", border:"1px solid #fde68a", borderRadius:12, padding:"11px 14px", marginBottom:20 }}>
        <Sparkles size={14} style={{ color:"#d97706", flexShrink:0, marginTop:1 }} />
        <p style={{ margin:0, fontSize:12, color:"#92400e", lineHeight:1.6 }}>
          <strong>Platform-Aware AI:</strong> The AI Assistant and Insights tab have live access to your platform's data — user counts, case statistics, and activity trends. The Chat feature can answer questions using real-time numbers.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", background:"var(--bg,#f1f5f9)", borderRadius:14, padding:4, marginBottom:20, gap:2 }}>
        {tabs.map(({ id, label, icon:Icon }) => (
          <button key={id} className="tab-btn" onClick={() => setTab(id)}
            style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"9px 6px", borderRadius:10, fontSize:12, fontWeight:700,
              background: tab===id ? "var(--card-bg,#fff)" : "transparent",
              color: tab===id ? RED : "var(--text-muted,#64748b)",
              boxShadow: tab===id ? "0 1px 6px rgba(0,0,0,0.08)" : "none",
            }}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background:"var(--card-bg,#fff)", borderRadius:18, border:"1px solid var(--border,#e2e8f0)", padding:"22px 24px", boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
        {tab === "insights"  && <PlatformInsights />}
        {tab === "chat"      && <AdminAiChat />}
        {tab === "classify"  && <CaseClassifier />}
        {tab === "document"  && <DocumentAnalyzer />}
      </div>
    </div>
  );
}
