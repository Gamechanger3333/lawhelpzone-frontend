"use client";
// app/dashboard/lawyer/cases/page.jsx
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../../../store/index";
import {
  Scale, Search, RefreshCw, MessageSquare, Video,
  CheckCircle, AlertTriangle, X, ChevronDown, Filter,
} from "lucide-react";

const API  = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok  = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const hdrs = () => ({ "Content-Type": "application/json", ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });

const STATUS = {
  open:          { l:"Open",        c:"#3b82f6", b:"#eff6ff" },
  "in-progress": { l:"In Progress", c:"#f59e0b", b:"#fffbeb" },
  in_progress:   { l:"In Progress", c:"#f59e0b", b:"#fffbeb" },
  closed:        { l:"Closed",      c:"#10b981", b:"#f0fdf4" },
  resolved:      { l:"Resolved",    c:"#10b981", b:"#f0fdf4" },
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

function ProposalModal({ c, onClose, onSubmit }) {
  const [note, setNote] = useState("");
  const [fee,  setFee]  = useState("");
  const [load, setLoad] = useState(false);

  const submit = async () => {
    if (!note.trim()) return;
    setLoad(true);
    await onSubmit(c._id, { note, fee: Number(fee)||0 });
    setLoad(false);
    onClose();
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"var(--card-bg,#fff)",borderRadius:20,width:"100%",maxWidth:460,padding:28,boxShadow:"0 24px 64px rgba(0,0,0,0.2)",border:"1px solid var(--border-color,#e2e8f0)",animation:"mIn 0.3s ease" }}>
        <style>{`@keyframes mIn{from{transform:scale(0.95) translateY(16px);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <h3 style={{ margin:0,fontSize:18,fontWeight:800,color:"var(--text-heading,#0f172a)" }}>📨 Send Proposal</h3>
          <button onClick={onClose} style={{ background:"var(--input-bg,#f1f5f9)",border:"none",borderRadius:8,padding:8,cursor:"pointer",display:"flex",color:"var(--text-muted,#64748b)" }}><X size={16}/></button>
        </div>
        <p style={{ margin:"0 0 18px",fontSize:13,color:"var(--text-muted,#64748b)" }}>Case: <strong style={{ color:"var(--text-heading,#0f172a)" }}>{c.title}</strong></p>
        <label style={{ fontSize:12,fontWeight:700,color:"var(--text-muted,#64748b)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em" }}>Proposed Fee (PKR)</label>
        <input value={fee} onChange={e=>setFee(e.target.value)} type="number" placeholder="e.g. 15000"
          style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid var(--border-color,#e2e8f0)",fontSize:14,outline:"none",marginBottom:14,boxSizing:"border-box",background:"var(--input-bg,#fff)",color:"var(--text-primary,#0f172a)" }}/>
        <label style={{ fontSize:12,fontWeight:700,color:"var(--text-muted,#64748b)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em" }}>Cover Note *</label>
        <textarea value={note} onChange={e=>setNote(e.target.value)} rows={4} placeholder="Describe your approach and experience…"
          style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid var(--border-color,#e2e8f0)",fontSize:14,outline:"none",resize:"vertical",lineHeight:1.6,boxSizing:"border-box",marginBottom:20,background:"var(--input-bg,#fff)",color:"var(--text-primary,#0f172a)" }}/>
        <div style={{ display:"flex",gap:10 }}>
          <button onClick={onClose} style={{ flex:1,padding:12,borderRadius:12,border:"1px solid var(--border-color,#e2e8f0)",background:"transparent",fontWeight:600,cursor:"pointer",fontSize:14,color:"var(--text-muted,#64748b)" }}>Cancel</button>
          <button onClick={submit} disabled={load||!note.trim()} style={{ flex:1,padding:12,borderRadius:12,border:"none",background:note.trim()?"#10b981":"var(--input-bg,#e2e8f0)",color:note.trim()?"#fff":"var(--text-muted,#94a3b8)",fontWeight:700,cursor:note.trim()?"pointer":"default",fontSize:14,opacity:load?0.7:1,transition:"all 0.15s" }}>
            {load?"Sending…":"Send Proposal ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LawyerCasesPage() {
  const router = useRouter();
  const { user } = useAppSelector(s => s.auth);

  const [myCases,    setMyCases]    = useState([]);
  const [availCases, setAvail]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState("my");
  const [search,     setSearch]     = useState("");
  const [statusF,    setStatusF]    = useState("all");
  const [propCase,   setPropCase]   = useState(null);
  const [toast,      setToast]      = useState(null);
  const [vis,        setVis]        = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mr, ar] = await Promise.all([
        fetch(`${API}/api/dashboard`, { credentials:"include", headers:hdrs() }),
        fetch(`${API}/api/cases?status=open&limit=30`, { credentials:"include", headers:hdrs() }),
      ]);
      if (mr.ok) { const d = await mr.json(); setMyCases(d.recentCases || d.myCases || []); }
      if (ar.ok) { const d = await ar.json(); setAvail(Array.isArray(d)?d:(d.cases||[])); }
    } catch {}
    finally { setLoading(false); setTimeout(()=>setVis(true),60); }
  }, []);

  useEffect(() => { load(); }, []);

  const sendProposal = async (caseId, { note, fee }) => {
    try {
      const r = await fetch(`${API}/api/cases/${caseId}/proposals`, {
        method:"POST", credentials:"include", headers:hdrs(),
        body: JSON.stringify({ note, fee }),
      });
      if (r.ok) { setToast({msg:"Proposal sent!",type:"success"}); load(); }
      else { const d=await r.json().catch(()=>({})); setToast({msg:d.message||"Failed",type:"error"}); }
    } catch { setToast({msg:"Failed to send",type:"error"}); }
  };

  const filteredMy = myCases.filter(c => {
    const q = search.toLowerCase();
    return (statusF==="all"||c.status===statusF||c.status?.replace("-","_")===statusF) &&
      (!q||(c.title||"").toLowerCase().includes(q));
  });

  const filteredAvail = availCases.filter(c => {
    const q = search.toLowerCase();
    return !q||(c.title||"").toLowerCase().includes(q)||(c.category||"").toLowerCase().includes(q);
  });

  const css = `@keyframes fd{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.ch{transition:all 0.15s}.ch:hover{background:var(--conv-hover,#f8fafc)!important}`;

  if (loading) return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:400,gap:14 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:38,height:38,border:"3px solid var(--border-color,#e2e8f0)",borderTopColor:"#10b981",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
      <p style={{ color:"var(--text-muted,#64748b)",fontSize:14 }}>Loading cases…</p>
    </div>
  );

  return (
    <div style={{ maxWidth:1000,margin:"0 auto",opacity:vis?1:0,transition:"opacity 0.4s" }}>
      <style>{css}</style>
      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      {propCase&&<ProposalModal c={propCase} onClose={()=>setPropCase(null)} onSubmit={sendProposal}/>}

      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12 }}>
        <div>
          <h1 style={{ margin:0,fontSize:24,fontWeight:800,color:"var(--text-heading,#0f172a)" }}>Cases</h1>
          <p style={{ margin:"4px 0 0",color:"var(--text-muted,#64748b)",fontSize:14 }}>{myCases.length} assigned · {availCases.length} available</p>
        </div>
        <button onClick={load} style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:10,border:"1px solid var(--border-color,#e2e8f0)",background:"var(--card-bg,#fff)",color:"var(--text-muted,#64748b)",fontSize:13,fontWeight:600,cursor:"pointer" }}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" }}>
        {[["my",`My Cases (${myCases.length})`],["available",`Available (${availCases.length})`]].map(([v,l]) => (
          <button key={v} onClick={()=>setTab(v)}
            style={{ padding:"9px 20px",borderRadius:20,border:`1px solid ${tab===v?"#10b981":"var(--border-color,#e2e8f0)"}`,background:tab===v?"#10b981":"transparent",color:tab===v?"#fff":"var(--text-muted,#64748b)",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all 0.15s" }}>
            {l}
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
        <div style={{ position:"relative",flex:1,minWidth:200 }}>
          <Search size={13} style={{ position:"absolute",left:10,top:9,color:"var(--text-muted,#94a3b8)" }}/>
          <input style={{ width:"100%",padding:"8px 12px 8px 30px",borderRadius:10,border:"1px solid var(--border-color,#e2e8f0)",fontSize:13,outline:"none",background:"var(--card-bg,#fff)",color:"var(--text-primary,#0f172a)",boxSizing:"border-box" }}
            placeholder="Search cases…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        {tab==="my"&&(
          <div style={{ display:"flex",gap:6 }}>
            {[["all","All"],["open","Open"],["in-progress","In Progress"],["closed","Closed"]].map(([v,l]) => (
              <button key={v} onClick={()=>setStatusF(v)}
                style={{ padding:"7px 14px",borderRadius:20,border:`1px solid ${statusF===v?"#10b981":"var(--border-color,#e2e8f0)"}`,background:statusF===v?"#10b981":"transparent",color:statusF===v?"#fff":"var(--text-muted,#64748b)",fontSize:12,fontWeight:600,cursor:"pointer" }}>
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cases list */}
      <div style={{ background:"var(--card-bg,#fff)",borderRadius:20,border:"1px solid var(--border-color,#f1f5f9)",boxShadow:"0 2px 8px rgba(0,0,0,0.04)",overflow:"hidden" }}>
        {(tab==="my"?filteredMy:filteredAvail).length === 0 ? (
          <div style={{ padding:"60px 24px",textAlign:"center" }}>
            <Scale size={40} style={{ color:"var(--border-color,#e2e8f0)",display:"block",margin:"0 auto 12px" }}/>
            <p style={{ color:"var(--text-muted,#94a3b8)",fontWeight:600,margin:0 }}>No cases found</p>
          </div>
        ) : (tab==="my"?filteredMy:filteredAvail).map((c,i) => {
          const s = STATUS[c.status] || STATUS.open;
          const client = c.clientId || c.client || {};
          const hasProposed = tab==="available" && c.proposals?.some(p=>(p.lawyerId?._id||p.lawyerId)===user?._id);
          return (
            <div key={c._id} className="ch" style={{ padding:"16px 22px",borderBottom:i<(tab==="my"?filteredMy:filteredAvail).length-1?"1px solid var(--border-color,#f1f5f9)":"none",animation:`fd 0.3s ease ${i*0.04}s both` }}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:14 }}>
                <div style={{ width:44,height:44,borderRadius:12,background:s.b,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <Scale size={18} style={{ color:s.c }}/>
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4 }}>
                    <p style={{ margin:0,fontSize:14,fontWeight:700,color:"var(--text-heading,#0f172a)" }}>{c.title}</p>
                    <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:s.b,color:s.c }}>{s.l}</span>
                    {c.urgency==="high"&&<span style={{ fontSize:11,fontWeight:700,color:"#ef4444",background:"#fef2f2",padding:"3px 8px",borderRadius:20 }}>⚡ Urgent</span>}
                  </div>
                  <p style={{ margin:"0 0 8px",fontSize:13,color:"var(--text-muted,#64748b)",lineHeight:1.5 }}>{c.description?.slice(0,120)}{c.description?.length>120?"…":""}</p>
                  <div style={{ display:"flex",gap:10,flexWrap:"wrap",fontSize:12,color:"var(--text-muted,#94a3b8)" }}>
                    {c.category&&<span>📁 {c.category}</span>}
                    {c.location&&<span>📍 {c.location}</span>}
                    {c.budget>0&&<span>💰 {c.budget.toLocaleString()} PKR</span>}
                    {c.proposals?.length>0&&<span style={{ color:"#f59e0b",fontWeight:600 }}>📋 {c.proposals.length} proposals</span>}
                    <span>📅 {new Date(c.createdAt||Date.now()).toLocaleDateString()}</span>
                  </div>
                  {/* Client row */}
                  {client._id && (
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginTop:10,flexWrap:"wrap" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:6,background:"#eff6ff",borderRadius:8,padding:"5px 10px" }}>
                        <div style={{ width:22,height:22,borderRadius:"50%",background:"#3b82f6",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center" }}>
                          {(client.name||"C").charAt(0)}
                        </div>
                        <span style={{ fontSize:12,color:"#1e40af",fontWeight:600 }}>{client.name||"Client"}</span>
                        <button onClick={()=>router.push(`/dashboard/lawyer/messages?contact=${client._id}`)}
                          style={{ background:"none",border:"none",cursor:"pointer",color:"#3b82f6",padding:0,display:"flex" }}>
                          <MessageSquare size={11}/>
                        </button>
                        <button onClick={()=>router.push(`/dashboard/lawyer/video-calls?contact=${client._id}`)}
                          style={{ background:"none",border:"none",cursor:"pointer",color:"#10b981",padding:0,display:"flex" }}>
                          <Video size={11}/>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {/* Action */}
                <div style={{ flexShrink:0 }}>
                  {tab==="available" && (
                    <button onClick={()=>!hasProposed&&setPropCase(c)} disabled={hasProposed}
                      style={{ padding:"8px 16px",borderRadius:10,background:hasProposed?"#f0fdf4":"#10b981",color:hasProposed?"#10b981":"#fff",border:hasProposed?"1px solid #86efac":"none",fontWeight:700,fontSize:13,cursor:hasProposed?"default":"pointer",transition:"all 0.15s" }}>
                      {hasProposed?"✓ Applied":"Apply"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}