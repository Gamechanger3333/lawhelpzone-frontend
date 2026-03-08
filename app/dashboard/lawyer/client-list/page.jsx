"use client";
// app/dashboard/lawyer/client-list/page.jsx
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../../../store/index";
import { Search, MessageSquare, Video, RefreshCw, User, Phone, Mail } from "lucide-react";

const API  = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok  = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const hdrs = () => ({ "Content-Type": "application/json", ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });

export default function ClientListPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setL]       = useState(true);
  const [search,  setSearch]  = useState("");
  const [vis,     setVis]     = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API}/api/dashboard`, { credentials:"include", headers:hdrs() });
        const d = await r.json();
        setClients(d.myClients || []);
      } catch {}
      finally { setL(false); setTimeout(()=>setVis(true),60); }
    };
    load();
  }, []);

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return !q || (c.name||"").toLowerCase().includes(q) || (c.email||"").toLowerCase().includes(q);
  });

  return (
    <div style={{ maxWidth:800,margin:"0 auto",opacity:vis?1:0,transition:"opacity 0.4s" }}>
      <style>{`@keyframes fd{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.ch{transition:background 0.12s}.ch:hover{background:var(--conv-hover,#f8fafc)!important}`}</style>

      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12 }}>
        <div>
          <h1 style={{ margin:0,fontSize:24,fontWeight:800,color:"var(--text-heading,#0f172a)" }}>👤 My Clients</h1>
          <p style={{ margin:"4px 0 0",color:"var(--text-muted,#64748b)",fontSize:14 }}>{clients.length} total clients</p>
        </div>
      </div>

      <div style={{ position:"relative",marginBottom:16 }}>
        <Search size={13} style={{ position:"absolute",left:10,top:11,color:"#94a3b8" }}/>
        <input style={{ width:"100%",padding:"10px 12px 10px 30px",borderRadius:10,border:"1px solid var(--border-color,#e2e8f0)",fontSize:13,outline:"none",background:"var(--card-bg,#fff)",color:"var(--text-primary,#0f172a)",boxSizing:"border-box" }}
          placeholder="Search clients…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      <div style={{ background:"var(--card-bg,#fff)",borderRadius:20,border:"1px solid var(--border-color,#f1f5f9)",boxShadow:"0 2px 8px rgba(0,0,0,0.04)",overflow:"hidden" }}>
        {loading ? (
          <div style={{ padding:32,textAlign:"center",color:"var(--text-muted,#94a3b8)" }}>
            <div style={{ width:32,height:32,border:"3px solid var(--border-color,#e2e8f0)",borderTopColor:"#10b981",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto" }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:"60px 24px",textAlign:"center" }}>
            <User size={40} style={{ color:"var(--border-color,#e2e8f0)",display:"block",margin:"0 auto 12px" }}/>
            <p style={{ color:"var(--text-muted,#94a3b8)",fontWeight:600,margin:0 }}>
              {search ? "No clients match your search" : "No clients yet. Clients assigned to your cases will appear here."}
            </p>
          </div>
        ) : filtered.map((cl,i) => (
          <div key={cl._id||i} className="ch"
            style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 22px",borderBottom:i<filtered.length-1?"1px solid var(--border-color,#f1f5f9)":"none",animation:`fd 0.3s ease ${i*0.04}s both` }}>
            <div style={{ width:46,height:46,borderRadius:"50%",background:"#3b82f6",color:"#fff",fontWeight:800,fontSize:17,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden" }}>
              {cl.profileImage?<img src={cl.profileImage} style={{ width:46,height:46,objectFit:"cover" }} alt=""/>:(cl.name||"C").charAt(0)}
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <p style={{ margin:0,fontSize:14,fontWeight:700,color:"var(--text-heading,#0f172a)" }}>{cl.name||"Client"}</p>
              <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginTop:3 }}>
                {cl.email&&<span style={{ fontSize:12,color:"var(--text-muted,#64748b)",display:"flex",alignItems:"center",gap:3 }}><Mail size={11}/>{cl.email}</span>}
                {cl.phone&&<span style={{ fontSize:12,color:"var(--text-muted,#64748b)",display:"flex",alignItems:"center",gap:3 }}><Phone size={11}/>{cl.phone}</span>}
              </div>
              <p style={{ margin:"3px 0 0",fontSize:11,color:"var(--text-muted,#94a3b8)" }}>{cl.caseCount||0} case{cl.caseCount!==1?"s":""}</p>
            </div>
            <div style={{ display:"flex",gap:6,flexShrink:0 }}>
              <button onClick={()=>router.push(`/dashboard/lawyer/messages?contact=${cl._id}`)}
                style={{ display:"flex",alignItems:"center",gap:5,padding:"8px 14px",borderRadius:10,background:"#eff6ff",color:"#3b82f6",border:"none",fontSize:12,fontWeight:700,cursor:"pointer" }}>
                <MessageSquare size={13}/> Message
              </button>
              <button onClick={()=>router.push(`/dashboard/lawyer/video-calls?contact=${cl._id}`)}
                style={{ display:"flex",alignItems:"center",gap:5,padding:"8px 14px",borderRadius:10,background:"#f0fdf4",color:"#10b981",border:"none",fontSize:12,fontWeight:700,cursor:"pointer" }}>
                <Video size={13}/> Call
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}