"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../../../store/index";
import { selectInitialized } from "../../../../store/slices/authSlice";
import {
  Scale, Search, RefreshCw, X, MessageSquare, Video,
  CheckCircle, AlertTriangle, Loader2, ChevronDown,
} from "lucide-react";

const API  = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok  = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const hdrs = () => ({ "Content-Type": "application/json", ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });

const STATUS = {
  open:          { l: "Open",        c: "#3b82f6", b: "#eff6ff" },
  "in-progress": { l: "In Progress", c: "#f59e0b", b: "#fffbeb" },
  closed:        { l: "Closed",      c: "#10b981", b: "#f0fdf4" },
};

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position:"fixed",bottom:24,right:24,zIndex:9999,background:type==="error"?"#fef2f2":"#f0fdf4",border:`1px solid ${type==="error"?"#fca5a5":"#86efac"}`,color:type==="error"?"#dc2626":"#16a34a",borderRadius:12,padding:"12px 18px",fontSize:14,fontWeight:600,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",display:"flex",alignItems:"center",gap:8 }}>
      {type==="error"?<AlertTriangle size={16}/>:<CheckCircle size={16}/>}{msg}
      <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",marginLeft:4,opacity:0.5}}><X size={13}/></button>
    </div>
  );
}

function AssignModal({ c, lawyers, onClose, onAssigned }) {
  const router = useRouter();
  const [sel, setSel]       = useState(c.assignedLawyerId?._id || "");
  const [loading, setL]     = useState(false);
  const s = STATUS[c.status] || STATUS.open;

  const assign = async () => {
    if (!sel) return;
    setL(true);
    try {
      const r = await fetch(`${API}/api/cases/${c._id}/assign`, {
        method: "POST", credentials: "include", headers: hdrs(),
        body: JSON.stringify({ lawyerId: sel }),
      });
      if (r.ok) { onAssigned(); onClose(); }
    } catch {} finally { setL(false); }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:580,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.2)",animation:"mIn 0.3s ease"}}>
        <style>{`@keyframes mIn{from{transform:scale(0.95) translateY(20px);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        <div style={{padding:"20px 24px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#fff",zIndex:1}}>
          <h3 style={{margin:0,fontSize:18,fontWeight:800,color:"#0f172a"}}>Manage Case</h3>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:8,cursor:"pointer",display:"flex"}}><X size={18}/></button>
        </div>
        <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:16}}>
          {/* Case info */}
          <div style={{background:"#f8fafc",borderRadius:12,padding:16}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:8}}>
              <h4 style={{margin:0,fontSize:15,fontWeight:700,color:"#0f172a"}}>{c.title}</h4>
              <span style={{fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:20,background:s.b,color:s.c,flexShrink:0}}>{s.l}</span>
            </div>
            <p style={{margin:0,fontSize:13,color:"#64748b",lineHeight:1.6}}>{c.description?.slice(0,150)}{c.description?.length>150?"…":""}</p>
            <div style={{display:"flex",gap:16,flexWrap:"wrap",marginTop:12}}>
              {[{l:"Category",v:c.category},{l:"Location",v:c.location},{l:"Budget",v:c.budget?`${c.budget.toLocaleString()} PKR`:"—"},{l:"Urgency",v:c.urgency}].map(({l,v})=>(
                <div key={l}><p style={{margin:0,fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase"}}>{l}</p><p style={{margin:"2px 0 0",fontSize:13,fontWeight:600,color:"#374151"}}>{v||"—"}</p></div>
              ))}
            </div>
          </div>
          {/* Client & Lawyer cards */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{background:"#eff6ff",borderRadius:12,padding:14}}>
              <p style={{margin:"0 0 4px",fontSize:11,fontWeight:700,color:"#93c5fd",textTransform:"uppercase"}}>Client</p>
              <p style={{margin:0,fontSize:14,fontWeight:700,color:"#1e40af"}}>{c.clientId?.name||"Unknown"}</p>
              <p style={{margin:"2px 0 8px",fontSize:12,color:"#3b82f6"}}>{c.clientId?.email}</p>
              {c.clientId?._id&&<button onClick={()=>{onClose();router.push(`/dashboard/admin/messages?contact=${c.clientId._id}`);}} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,color:"#3b82f6",background:"none",border:"none",cursor:"pointer",padding:0}}><MessageSquare size={11}/>Message</button>}
            </div>
            <div style={{background:"#f0fdf4",borderRadius:12,padding:14}}>
              <p style={{margin:"0 0 4px",fontSize:11,fontWeight:700,color:"#86efac",textTransform:"uppercase"}}>Assigned Lawyer</p>
              <p style={{margin:0,fontSize:14,fontWeight:700,color:"#14532d"}}>{c.assignedLawyerId?.name||"Unassigned"}</p>
              <p style={{margin:"2px 0 8px",fontSize:12,color:"#10b981"}}>{c.assignedLawyerId?.email||""}</p>
              {c.assignedLawyerId?._id&&<button onClick={()=>{onClose();router.push(`/dashboard/admin/messages?contact=${c.assignedLawyerId._id}`);}} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,color:"#10b981",background:"none",border:"none",cursor:"pointer",padding:0}}><MessageSquare size={11}/>Message</button>}
            </div>
          </div>
          {/* Proposals */}
          {c.proposals?.length>0&&(
            <div>
              <p style={{margin:"0 0 8px",fontSize:14,fontWeight:700,color:"#374151"}}>{c.proposals.length} Proposal{c.proposals.length!==1?"s":""}</p>
              {c.proposals.map((p,i)=>(
                <div key={i} style={{background:"#f8fafc",borderRadius:10,padding:12,marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div><p style={{margin:0,fontSize:13,fontWeight:600,color:"#0f172a"}}>{p.lawyerId?.name||"Lawyer"}</p><p style={{margin:"2px 0 0",fontSize:12,color:"#64748b"}}>{p.message?.slice(0,80)}</p></div>
                  {p.fee>0&&<span style={{fontSize:12,fontWeight:700,color:"#10b981",whiteSpace:"nowrap"}}>{p.fee.toLocaleString()} PKR</span>}
                </div>
              ))}
            </div>
          )}
          {/* Assign */}
          <div style={{background:"#fefce8",borderRadius:12,padding:16,border:"1px solid #fef08a"}}>
            <p style={{margin:"0 0 10px",fontSize:14,fontWeight:700,color:"#713f12"}}>{c.assignedLawyerId?"Re-assign Lawyer":"Assign Lawyer to Case"}</p>
            <select style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid #e2e8f0",fontSize:14,background:"#fff",marginBottom:10,outline:"none"}} value={sel} onChange={e=>setSel(e.target.value)}>
              <option value="">-- Select a registered lawyer --</option>
              {lawyers.map(l=><option key={l._id} value={l._id}>{l.name} {l.email?`(${l.email})`:""}</option>)}
            </select>
            <button onClick={assign} disabled={!sel||loading} style={{width:"100%",padding:12,borderRadius:10,background:sel?"#0A1A3F":"#e2e8f0",color:sel?"#fff":"#94a3b8",border:"none",fontWeight:700,fontSize:14,cursor:sel?"pointer":"not-allowed",transition:"all 0.15s"}}>
              {loading?"Assigning…":c.assignedLawyerId?"Re-assign":"Assign Case"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCases() {
  const router = useRouter();
  const { user } = useAppSelector(s => s.auth);
  const initialized = useAppSelector(selectInitialized);

  const [cases, setCases]     = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [loading, setL]       = useState(true);
  const [refreshing, setRef]  = useState(false);
  const [search, setSearch]   = useState("");
  const [statusF, setSF]      = useState("all");
  const [selCase, setSel]     = useState(null);
  const [toast, setToast]     = useState(null);
  const [vis, setVis]         = useState(false);

  const load = async (silent = false) => {
    if (!silent) setL(true); else setRef(true);
    try {
      const [cr, lr] = await Promise.all([
        fetch(`${API}/api/cases?limit=50`, { credentials: "include", headers: hdrs() }),
        fetch(`${API}/api/lawyers?limit=100`, { credentials: "include", headers: hdrs() }),
      ]);
      if (cr.ok) { const d = await cr.json(); setCases(Array.isArray(d) ? d : d.cases ?? []); }
      if (lr.ok) { const d = await lr.json(); setLawyers(d.lawyers ?? []); }
    } catch {}
    finally { setL(false); setRef(false); setTimeout(() => setVis(true), 50); }
  };

  useEffect(() => {
    if (!initialized) return;
    if (!user) { setL(false); return; }
    load();
  }, [user, initialized]);

  // Also load if not initialized yet (handle blank screen)
  useEffect(() => {
    if (!initialized) {
      const t = setTimeout(() => { if (!vis) load(); }, 800);
      return () => clearTimeout(t);
    }
  }, []);

  const filtered = cases.filter(c => {
    const q = search.toLowerCase();
    return (statusF === "all" || c.status === statusF) &&
      (!q || c.title?.toLowerCase().includes(q) || c.clientId?.name?.toLowerCase().includes(q));
  });

  const counts = { all: cases.length, open: cases.filter(c => c.status === "open").length, "in-progress": cases.filter(c => c.status === "in-progress").length, closed: cases.filter(c => c.status === "closed").length };

  const css = `@keyframes fd{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}.ch:hover{box-shadow:0 6px 20px rgba(0,0,0,0.09)!important;transform:translateY(-1px)!important}.ch{transition:all 0.2s ease!important}`;

  if (!vis && loading) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:400,gap:16}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{width:40,height:40,border:"3px solid #e2e8f0",borderTopColor:"#ef4444",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <p style={{color:"#64748b",fontSize:14}}>Loading cases…</p>
    </div>
  );

  return (
    <div style={{maxWidth:1000,margin:"0 auto",opacity:vis?1:0,transform:vis?"translateY(0)":"translateY(10px)",transition:"all 0.5s ease"}}>
      <style>{css}</style>
      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{margin:0,fontSize:24,fontWeight:800,color:"#0f172a"}}>All Cases</h1>
          <p style={{margin:"4px 0 0",color:"#64748b",fontSize:14}}>{cases.length} total cases</p>
        </div>
        <button onClick={()=>load(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",color:"#475569",fontSize:13,fontWeight:600,cursor:"pointer"}}>
          <RefreshCw size={14} style={{animation:refreshing?"spin 1s linear infinite":"none"}}/> Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        {[["all","All"],["open","Open"],["in-progress","In Progress"],["closed","Closed"]].map(([v,l])=>(
          <button key={v} onClick={()=>setSF(v)} style={{padding:"7px 16px",borderRadius:20,border:`1px solid ${statusF===v?"#0A1A3F":"#e2e8f0"}`,background:statusF===v?"#0A1A3F":"#fff",color:statusF===v?"#fff":"#64748b",fontSize:13,fontWeight:600,cursor:"pointer"}}>
            {l} <span style={{opacity:0.6,fontSize:11}}>({counts[v]||0})</span>
          </button>
        ))}
        <div style={{flex:1,maxWidth:280,position:"relative",marginLeft:"auto"}}>
          <Search size={13} style={{position:"absolute",left:10,top:9,color:"#94a3b8"}}/>
          <input style={{width:"100%",padding:"8px 12px 8px 30px",borderRadius:10,border:"1px solid #e2e8f0",fontSize:13,outline:"none",boxSizing:"border-box"}} placeholder="Search cases or clients…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>

      {/* Cases list */}
      {filtered.length===0?(
        <div style={{background:"#fff",borderRadius:20,border:"1px solid #f1f5f9",padding:"60px 24px",textAlign:"center"}}>
          <Scale size={40} style={{color:"#e2e8f0",display:"block",margin:"0 auto 12px"}}/>
          <p style={{color:"#94a3b8",margin:0,fontWeight:600}}>No cases found</p>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map((c,i)=>{
            const s=STATUS[c.status]||STATUS.open;
            return(
              <div key={c._id} className="ch" style={{background:"#fff",borderRadius:16,border:"1px solid #f1f5f9",padding:"16px 20px",boxShadow:"0 2px 8px rgba(0,0,0,0.04)",animation:`fd 0.4s ease ${i*0.03}s both`}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap"}}>
                  <div style={{width:42,height:42,borderRadius:12,background:s.b,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Scale size={18} style={{color:s.c}}/></div>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                      <p style={{margin:0,fontSize:15,fontWeight:700,color:"#0f172a"}}>{c.title}</p>
                      <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:s.b,color:s.c}}>{s.l}</span>
                      {c.urgency==="high"&&<span style={{fontSize:11,fontWeight:700,color:"#ef4444",background:"#fef2f2",padding:"3px 8px",borderRadius:20}}>⚡ High</span>}
                    </div>
                    <p style={{margin:"0 0 8px",fontSize:13,color:"#64748b"}}>{c.description?.slice(0,100)}{c.description?.length>100?"…":""}</p>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap",fontSize:12,color:"#94a3b8"}}>
                      <span>📁 {c.category}</span>
                      {c.location&&<span>📍 {c.location}</span>}
                      {c.budget>0&&<span>💰 {c.budget.toLocaleString()} PKR</span>}
                      <span>📅 {new Date(c.createdAt).toLocaleDateString()}</span>
                      {c.proposals?.length>0&&<span style={{color:"#f59e0b",fontWeight:700}}>📋 {c.proposals.length} proposals</span>}
                    </div>
                    {/* Client + Lawyer row */}
                    <div style={{display:"flex",gap:12,marginTop:10,flexWrap:"wrap"}}>
                      {c.clientId&&(
                        <div style={{display:"flex",alignItems:"center",gap:6,background:"#eff6ff",borderRadius:8,padding:"6px 10px"}}>
                          <div style={{width:22,height:22,borderRadius:"50%",background:"#3b82f6",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{(c.clientId.name||"C").charAt(0)}</div>
                          <span style={{fontSize:12,color:"#1e40af",fontWeight:600}}>{c.clientId.name}</span>
                          <button onClick={()=>router.push(`/dashboard/admin/messages?contact=${c.clientId._id}`)} style={{background:"none",border:"none",cursor:"pointer",color:"#3b82f6",padding:0,display:"flex"}}><MessageSquare size={12}/></button>
                        </div>
                      )}
                      {c.assignedLawyerId?(
                        <div style={{display:"flex",alignItems:"center",gap:6,background:"#f0fdf4",borderRadius:8,padding:"6px 10px"}}>
                          <div style={{width:22,height:22,borderRadius:"50%",background:"#10b981",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{(c.assignedLawyerId.name||"L").charAt(0)}</div>
                          <span style={{fontSize:12,color:"#14532d",fontWeight:600}}>{c.assignedLawyerId.name}</span>
                          <button onClick={()=>router.push(`/dashboard/admin/messages?contact=${c.assignedLawyerId._id}`)} style={{background:"none",border:"none",cursor:"pointer",color:"#10b981",padding:0,display:"flex"}}><MessageSquare size={12}/></button>
                        </div>
                      ):(
                        <span style={{fontSize:12,color:"#f59e0b",fontWeight:700,background:"#fffbeb",padding:"6px 10px",borderRadius:8}}>⚠ No lawyer assigned</span>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{display:"flex",gap:8,flexShrink:0,alignItems:"flex-start"}}>
                    <button onClick={()=>setSel(c)} style={{padding:"8px 14px",borderRadius:10,background:"#0A1A3F",color:"#fff",border:"none",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                      {c.assignedLawyerId?"Re-assign":"Assign Lawyer"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selCase&&<AssignModal c={selCase} lawyers={lawyers} onClose={()=>setSel(null)} onAssigned={()=>{load(true);setToast({msg:"Case assigned successfully!",type:"success"});}}/>}
    </div>
  );
}