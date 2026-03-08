"use client";
// app/dashboard/client/cases/page.jsx
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../../../store/index";
import {
  Scale, Plus, Search, RefreshCw, MessageSquare, Video,
  CheckCircle, AlertTriangle, X, FileText,
} from "lucide-react";

const API  = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok  = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const hdrs = () => ({ "Content-Type": "application/json", ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });
const CATS = ["Criminal Law","Family Law","Business Law","Real Estate","Personal Injury","Estate Planning","Employment Law","Tax Law","Immigration","Civil Rights","IP Law","Other"];

const STATUS = {
  open:          { l:"Open",        c:"#3b82f6", b:"#eff6ff" },
  "in-progress": { l:"In Progress", c:"#f59e0b", b:"#fffbeb" },
  closed:        { l:"Closed",      c:"#10b981", b:"#f0fdf4" },
  rejected:      { l:"Rejected",    c:"#ef4444", b:"#fef2f2" },
};

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position:"fixed",bottom:24,right:24,zIndex:9999,background:type==="error"?"#fef2f2":"#f0fdf4",border:`1px solid ${type==="error"?"#fca5a5":"#86efac"}`,color:type==="error"?"#dc2626":"#16a34a",borderRadius:12,padding:"12px 18px",fontSize:14,fontWeight:600,display:"flex",alignItems:"center",gap:8,boxShadow:"0 8px 32px rgba(0,0,0,0.12)" }}>
      {type==="error"?<AlertTriangle size={16}/>:<CheckCircle size={16}/>}{msg}
      <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",marginLeft:4,opacity:0.5 }}><X size={13}/></button>
    </div>
  );
}

function NewCaseModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title:"",description:"",category:"Criminal Law",location:"",country:"Pakistan",budget:"",deadline:"",urgency:"medium" });
  const [loading, setL] = useState(false);
  const [error, setE]   = useState("");
  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const inp = { width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid var(--border-color,#e2e8f0)",fontSize:14,outline:"none",boxSizing:"border-box",background:"var(--card-bg,#fff)",color:"var(--text-primary,#0f172a)" };
  const lbl = { display:"block",fontSize:12,fontWeight:700,color:"var(--text-muted,#64748b)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em" };

  const submit = async () => {
    if (!form.title || !form.description) return setE("Title and description are required");
    setL(true); setE("");
    try {
      const r = await fetch(`${API}/api/cases`, { method:"POST",credentials:"include",headers:hdrs(),body:JSON.stringify({...form,budget:parseFloat(form.budget)||0}) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message||"Failed");
      onCreated(d.case||d);
    } catch(e) { setE(e.message); }
    finally { setL(false); }
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"var(--card-bg,#fff)",borderRadius:24,width:"100%",maxWidth:560,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.25)",animation:"mIn 0.3s ease",border:"1px solid var(--border-color,#e2e8f0)" }}>
        <style>{`@keyframes mIn{from{transform:scale(0.95) translateY(20px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}`}</style>
        <div style={{ padding:"24px 28px",borderBottom:"1px solid var(--border-color,#f1f5f9)",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"var(--card-bg,#fff)",borderRadius:"24px 24px 0 0",zIndex:1 }}>
          <div>
            <h2 style={{ margin:0,fontSize:20,fontWeight:800,color:"var(--text-heading,#0f172a)" }}>📋 Create New Case</h2>
            <p style={{ margin:"4px 0 0",fontSize:13,color:"var(--text-muted,#64748b)" }}>Post your legal issue to find the right lawyer</p>
          </div>
          <button onClick={onClose} style={{ background:"var(--input-bg,#f1f5f9)",border:"none",borderRadius:10,padding:10,cursor:"pointer",display:"flex",color:"var(--text-muted,#64748b)" }}><X size={18}/></button>
        </div>
        <div style={{ padding:"24px 28px",display:"flex",flexDirection:"column",gap:16 }}>
          <div><label style={lbl}>Case Title *</label><input style={inp} placeholder="e.g. Contract Dispute with Employer" value={form.title} onChange={set("title")}/></div>
          <div><label style={lbl}>Description *</label><textarea style={{...inp,minHeight:90,resize:"vertical"}} placeholder="Describe your legal issue…" value={form.description} onChange={set("description")}/></div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            <div><label style={lbl}>Category</label><select style={inp} value={form.category} onChange={set("category")}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
            <div><label style={lbl}>Urgency</label><select style={inp} value={form.urgency} onChange={set("urgency")}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            <div><label style={lbl}>Location</label><input style={inp} placeholder="City, Province" value={form.location} onChange={set("location")}/></div>
            <div><label style={lbl}>Country</label><input style={inp} value={form.country} onChange={set("country")}/></div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            <div><label style={lbl}>Budget (PKR)</label><input style={inp} type="number" placeholder="50000" value={form.budget} onChange={set("budget")}/></div>
            <div><label style={lbl}>Deadline</label><input style={inp} type="date" value={form.deadline} onChange={set("deadline")}/></div>
          </div>
          {error&&<p style={{ color:"#dc2626",fontSize:13,background:"#fef2f2",padding:"10px 14px",borderRadius:8,margin:0 }}>{error}</p>}
          <button onClick={submit} disabled={loading}
            style={{ padding:14,borderRadius:12,background:loading?"#94a3b8":"#0A1A3F",color:"#fff",border:"none",fontWeight:700,fontSize:15,cursor:loading?"not-allowed":"pointer",transition:"all 0.15s" }}>
            {loading?"Creating…":"Create Case"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProposalsModal({ c, onClose, onAccepted }) {
  const router  = useRouter();
  const [loading, setL] = useState(false);

  const accept = async (lawyerId) => {
    setL(lawyerId);
    try {
      const r = await fetch(`${API}/api/cases/${c._id}/accept`, { method:"POST",credentials:"include",headers:hdrs(),body:JSON.stringify({lawyerId}) });
      if (r.ok) { onAccepted(c._id, lawyerId); onClose(); }
    } catch {}
    finally { setL(false); }
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"var(--card-bg,#fff)",borderRadius:20,width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.2)",animation:"mIn 0.3s ease",border:"1px solid var(--border-color,#e2e8f0)" }}>
        <style>{`@keyframes mIn{from{transform:scale(0.95) translateY(16px);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        <div style={{ padding:"20px 24px",borderBottom:"1px solid var(--border-color,#f1f5f9)",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"var(--card-bg,#fff)" }}>
          <h3 style={{ margin:0,fontSize:17,fontWeight:800,color:"var(--text-heading,#0f172a)" }}>Proposals — {c.title}</h3>
          <button onClick={onClose} style={{ background:"var(--input-bg,#f1f5f9)",border:"none",borderRadius:8,padding:8,cursor:"pointer",display:"flex",color:"var(--text-muted,#64748b)" }}><X size={16}/></button>
        </div>
        <div style={{ padding:"16px 24px",display:"flex",flexDirection:"column",gap:12 }}>
          {(!c.proposals||c.proposals.length===0) ? (
            <div style={{ textAlign:"center",padding:"40px 0" }}>
              <p style={{ color:"var(--text-muted,#94a3b8)",fontSize:14 }}>No proposals yet. Lawyers will be notified!</p>
            </div>
          ) : c.proposals.map((p,i) => (
            <div key={i} style={{ background:"var(--input-bg,#f8fafc)",borderRadius:14,padding:16,border:"1px solid var(--border-color,#f1f5f9)" }}>
              <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:10 }}>
                <div style={{ width:40,height:40,borderRadius:"50%",background:"#10b981",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800 }}>
                  {(p.lawyerId?.name||"L").charAt(0)}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0,fontSize:14,fontWeight:700,color:"var(--text-heading,#0f172a)" }}>{p.lawyerId?.name||"Lawyer"}</p>
                  <p style={{ margin:"2px 0 0",fontSize:12,color:"var(--text-muted,#64748b)" }}>{p.submittedAt?new Date(p.submittedAt).toLocaleDateString():""}</p>
                </div>
                {p.fee>0&&<span style={{ fontSize:14,fontWeight:700,color:"#10b981" }}>{p.fee.toLocaleString()} PKR</span>}
              </div>
              {p.message&&<p style={{ margin:"0 0 12px",fontSize:13,color:"var(--text-muted,#475569)",lineHeight:1.6 }}>{p.message}</p>}
              <div style={{ display:"flex",gap:8 }}>
                {c.status==="open"&&(
                  <button onClick={()=>accept(p.lawyerId?._id||p.lawyerId)} disabled={!!loading}
                    style={{ flex:1,padding:10,borderRadius:10,background:"#10b981",color:"#fff",border:"none",fontWeight:700,fontSize:13,cursor:"pointer" }}>
                    {loading===(p.lawyerId?._id||p.lawyerId)?"Accepting…":"Accept Proposal ✓"}
                  </button>
                )}
                <button onClick={()=>router.push(`/dashboard/client/messages?contact=${p.lawyerId?._id||p.lawyerId}`)}
                  style={{ padding:"10px 14px",borderRadius:10,background:"#eff6ff",color:"#3b82f6",border:"none",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:5 }}>
                  <MessageSquare size={13}/> Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ClientCasesPage() {
  const router = useRouter();
  const { user } = useAppSelector(s => s.auth);

  const [cases,    setCases]   = useState([]);
  const [loading,  setL]       = useState(true);
  const [search,   setSearch]  = useState("");
  const [statusF,  setSF]      = useState("all");
  const [showNew,  setNew]     = useState(false);
  const [propCase, setPC]      = useState(null);
  const [toast,    setToast]   = useState(null);
  const [vis,      setVis]     = useState(false);

  const load = useCallback(async () => {
    setL(true);
    try {
      const r = await fetch(`${API}/api/cases?mine=true&limit=50`, { credentials:"include", headers:hdrs() });
      const d = await r.json();
      setCases(Array.isArray(d)?d:(d.cases||[]));
    } catch {}
    finally { setL(false); setTimeout(()=>setVis(true),60); }
  }, []);

  useEffect(() => { load(); }, []);

  const filtered = cases.filter(c => {
    const q = search.toLowerCase();
    return (statusF==="all"||c.status===statusF) && (!q||(c.title||"").toLowerCase().includes(q));
  });

  const counts = { all:cases.length, open:cases.filter(c=>c.status==="open").length, "in-progress":cases.filter(c=>c.status==="in-progress").length, closed:cases.filter(c=>c.status==="closed").length };

  if (loading) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",minHeight:400 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:36,height:36,border:"3px solid var(--border-color,#e2e8f0)",borderTopColor:"#3b82f6",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
    </div>
  );

  return (
    <div style={{ maxWidth:1000,margin:"0 auto",opacity:vis?1:0,transition:"opacity 0.4s" }}>
      <style>{`@keyframes fd{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.ch{transition:background 0.12s}.ch:hover{background:var(--conv-hover,#f8fafc)!important}`}</style>
      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      {showNew&&<NewCaseModal onClose={()=>setNew(false)} onCreated={c=>{setCases(p=>[c,...p]);setNew(false);setToast({msg:"Case created!",type:"success"});}}/>}
      {propCase&&<ProposalsModal c={propCase} onClose={()=>setPC(null)} onAccepted={(cid,lid)=>{setCases(p=>p.map(c=>c._id===cid?{...c,status:"in-progress",assignedLawyerId:lid}:c));setPC(null);setToast({msg:"Proposal accepted!",type:"success"});}}/>}

      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12 }}>
        <div>
          <h1 style={{ margin:0,fontSize:24,fontWeight:800,color:"var(--text-heading,#0f172a)" }}>My Cases</h1>
          <p style={{ margin:"4px 0 0",color:"var(--text-muted,#64748b)",fontSize:14 }}>{cases.length} total cases</p>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={load} style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:10,border:"1px solid var(--border-color,#e2e8f0)",background:"var(--card-bg,#fff)",color:"var(--text-muted,#64748b)",fontSize:13,fontWeight:600,cursor:"pointer" }}>
            <RefreshCw size={14}/> Refresh
          </button>
          <button onClick={()=>setNew(true)} style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:10,background:"#0A1A3F",color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer" }}>
            <Plus size={14}/> New Case
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
        {[["all","All"],["open","Open"],["in-progress","In Progress"],["closed","Closed"]].map(([v,l]) => (
          <button key={v} onClick={()=>setSF(v)}
            style={{ padding:"7px 16px",borderRadius:20,border:`1px solid ${statusF===v?"#0A1A3F":"var(--border-color,#e2e8f0)"}`,background:statusF===v?"#0A1A3F":"transparent",color:statusF===v?"#fff":"var(--text-muted,#64748b)",fontSize:13,fontWeight:600,cursor:"pointer" }}>
            {l} <span style={{ opacity:0.6,fontSize:11 }}>({counts[v]||0})</span>
          </button>
        ))}
        <div style={{ position:"relative",flex:1,maxWidth:260,marginLeft:"auto" }}>
          <Search size={13} style={{ position:"absolute",left:10,top:9,color:"#94a3b8" }}/>
          <input style={{ width:"100%",padding:"8px 12px 8px 30px",borderRadius:10,border:"1px solid var(--border-color,#e2e8f0)",fontSize:13,outline:"none",background:"var(--card-bg,#fff)",color:"var(--text-primary,#0f172a)",boxSizing:"border-box" }}
            placeholder="Search cases…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>

      {/* Case list */}
      {filtered.length === 0 ? (
        <div style={{ background:"var(--card-bg,#fff)",borderRadius:20,border:"1px solid var(--border-color,#f1f5f9)",padding:"60px 24px",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
          <FileText size={40} style={{ color:"var(--border-color,#e2e8f0)",display:"block",margin:"0 auto 12px" }}/>
          <p style={{ color:"var(--text-muted,#94a3b8)",fontWeight:600,margin:"0 0 16px" }}>No cases yet</p>
          <button onClick={()=>setNew(true)} style={{ padding:"10px 24px",borderRadius:10,background:"#0A1A3F",color:"#fff",border:"none",fontWeight:700,fontSize:13,cursor:"pointer" }}>Create Your First Case</button>
        </div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {filtered.map((c,i) => {
            const s = STATUS[c.status] || STATUS.open;
            const proposals = c.proposals?.length||0;
            return (
              <div key={c._id} className="ch" style={{ background:"var(--card-bg,#fff)",borderRadius:16,border:"1px solid var(--border-color,#f1f5f9)",padding:"16px 20px",boxShadow:"0 2px 8px rgba(0,0,0,0.04)",animation:`fd 0.3s ease ${i*0.04}s both` }}>
                <div style={{ display:"flex",alignItems:"flex-start",gap:14 }}>
                  <div style={{ width:44,height:44,borderRadius:12,background:s.b,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    <Scale size={18} style={{ color:s.c }}/>
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4 }}>
                      <p style={{ margin:0,fontSize:15,fontWeight:700,color:"var(--text-heading,#0f172a)" }}>{c.title}</p>
                      <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:s.b,color:s.c }}>{s.l}</span>
                      {c.urgency==="high"&&<span style={{ fontSize:11,fontWeight:700,color:"#ef4444",background:"#fef2f2",padding:"3px 8px",borderRadius:20 }}>⚡ High</span>}
                    </div>
                    <p style={{ margin:"0 0 8px",fontSize:13,color:"var(--text-muted,#64748b)" }}>{c.description?.slice(0,100)}{c.description?.length>100?"…":""}</p>
                    <div style={{ display:"flex",gap:10,flexWrap:"wrap",fontSize:12,color:"#94a3b8" }}>
                      {c.category&&<span>📁 {c.category}</span>}
                      {c.location&&<span>📍 {c.location}</span>}
                      {c.budget>0&&<span>💰 {c.budget.toLocaleString()} PKR</span>}
                      <span>📅 {new Date(c.createdAt||Date.now()).toLocaleDateString()}</span>
                    </div>
                    {/* Assigned lawyer */}
                    {c.assignedLawyerId&&(
                      <div style={{ marginTop:10,display:"flex",alignItems:"center",gap:8,background:"#f0fdf4",borderRadius:10,padding:"8px 12px",flexWrap:"wrap" }}>
                        <div style={{ width:28,height:28,borderRadius:"50%",background:"#10b981",color:"#fff",fontSize:12,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center" }}>
                          {(c.assignedLawyerId.name||"L").charAt(0)}
                        </div>
                        <span style={{ fontSize:13,fontWeight:600,color:"#14532d" }}>{c.assignedLawyerId.name||"Your Lawyer"}</span>
                        <div style={{ display:"flex",gap:6,marginLeft:"auto" }}>
                          <button onClick={()=>router.push(`/dashboard/client/messages?contact=${c.assignedLawyerId._id||c.assignedLawyerId}`)}
                            style={{ display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:8,background:"#10b981",color:"#fff",border:"none",fontSize:11,fontWeight:700,cursor:"pointer" }}>
                            <MessageSquare size={11}/> Message
                          </button>
                          <button onClick={()=>router.push(`/dashboard/client/video-calls?contact=${c.assignedLawyerId._id||c.assignedLawyerId}`)}
                            style={{ display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:8,background:"#fff",color:"#10b981",border:"1px solid #86efac",fontSize:11,fontWeight:700,cursor:"pointer" }}>
                            <Video size={11}/> Call
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Proposals button */}
                    {proposals>0&&c.status==="open"&&(
                      <button onClick={()=>setPC(c)}
                        style={{ marginTop:8,padding:"6px 14px",borderRadius:20,background:"#fffbeb",color:"#f59e0b",border:"1px solid #fde68a",fontSize:12,fontWeight:700,cursor:"pointer" }}>
                        📋 {proposals} proposal{proposals!==1?"s":""} — Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}