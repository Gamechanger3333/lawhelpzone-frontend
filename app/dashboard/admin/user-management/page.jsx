"use client";
// ══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT — app/dashboard/admin/user-management/page.jsx
// Matches the dark-mode table screenshot.  Message / Video / Edit / Delete work.
// ══════════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, RefreshCw, MessageSquare, Video, Trash2, Edit3,
  Shield, Scale, User, CheckCircle, AlertTriangle, X,
  UserCheck, UserX, ChevronDown, Filter,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const HJ  = () => ({ "Content-Type": "application/json", ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });

const ROLE_COLOR = { admin: "#ef4444", lawyer: "#10b981", client: "#6366f1" };
const ROLE_BG    = { admin: "rgba(239,68,68,0.15)",  lawyer: "rgba(16,185,129,0.15)", client: "rgba(99,102,241,0.15)" };

/* ── Toast ────────────────────────────────────────────────────────── */
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, borderRadius:12, padding:"12px 18px", fontSize:14, fontWeight:600, display:"flex", alignItems:"center", gap:8, boxShadow:"0 8px 32px rgba(0,0,0,0.3)", animation:"slideUp 0.3s ease", background: type==="error" ? "#3f1515" : "#0f2d1f", border:`1px solid ${type==="error" ? "#7f1d1d" : "#14532d"}`, color: type==="error" ? "#fca5a5" : "#86efac" }}>
      {type==="error" ? <AlertTriangle size={16}/> : <CheckCircle size={16}/>}{msg}
      <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",marginLeft:4,opacity:0.6,color:"inherit"}}><X size={13}/></button>
    </div>
  );
}

/* ── Delete confirm modal ─────────────────────────────────────────── */
function DeleteModal({ user: u, onClose, onConfirm, loading }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(6px)"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"var(--card-bg,#1e293b)",borderRadius:20,maxWidth:380,width:"100%",padding:"32px 28px",boxShadow:"0 24px 64px rgba(0,0,0,0.5)",textAlign:"center",border:"1px solid var(--border-color,#334155)",animation:"popIn 0.25s ease"}}>
        <div style={{width:60,height:60,borderRadius:"50%",background:"rgba(239,68,68,0.15)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",border:"1px solid rgba(239,68,68,0.3)"}}>
          <Trash2 size={24} style={{color:"#ef4444"}}/>
        </div>
        <h3 style={{margin:"0 0 10px",fontSize:18,fontWeight:800,color:"var(--text-heading,#f1f5f9)"}}>Delete User?</h3>
        <p style={{margin:"0 0 6px",color:"var(--text-muted,#94a3b8)",fontSize:14,lineHeight:1.6}}>
          Permanently delete <strong style={{color:"var(--text-heading,#f1f5f9)"}}>{u?.name||u?.email}</strong>?<br/>This cannot be undone.
        </p>
        <p style={{margin:"0 0 24px",fontSize:12,color:"#64748b"}}>{u?.email}</p>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:12,borderRadius:12,border:"1px solid var(--border-color,#334155)",background:"transparent",fontWeight:600,cursor:"pointer",fontSize:14,color:"var(--text-muted,#94a3b8)"}}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{flex:1,padding:12,borderRadius:12,border:"none",background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14,opacity:loading?0.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            {loading ? <><span style={{width:13,height:13,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block"}}/> Deleting…</> : <><Trash2 size={14}/> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Edit user modal ──────────────────────────────────────────────── */
function EditModal({ user: u, onClose, onSave }) {
  const [name,  setName]  = useState(u?.name  || "");
  const [role,  setRole]  = useState(u?.role  || "client");
  const [phone, setPhone] = useState(u?.phone || "");
  const [suspended, setSusp] = useState(u?.suspended || false);
  const [saving, setSave] = useState(false);

  const doSave = async () => {
    setSave(true);
    await onSave(u._id, { name, role, phone, suspended });
    setSave(false);
    onClose();
  };

  const inputStyle = { width:"100%", padding:"10px 14px", borderRadius:10, border:"1px solid var(--border-color,#334155)", fontSize:14, outline:"none", background:"var(--input-bg,#0f172a)", color:"var(--text-heading,#f1f5f9)", boxSizing:"border-box" };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(6px)"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"var(--card-bg,#1e293b)",borderRadius:20,maxWidth:440,width:"100%",padding:"28px",boxShadow:"0 24px 64px rgba(0,0,0,0.5)",border:"1px solid var(--border-color,#334155)",animation:"popIn 0.25s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{margin:0,fontSize:17,fontWeight:800,color:"var(--text-heading,#f1f5f9)"}}>Edit User</h3>
          <button onClick={onClose} style={{background:"var(--input-bg,#0f172a)",border:"1px solid var(--border-color,#334155)",borderRadius:8,padding:7,cursor:"pointer",display:"flex",color:"var(--text-muted,#94a3b8)"}}><X size={16}/></button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>Full Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} style={inputStyle} placeholder="Full name" />
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>Phone</label>
            <input value={phone} onChange={e=>setPhone(e.target.value)} style={inputStyle} placeholder="+1 234 567 8900" />
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>Role</label>
            <select value={role} onChange={e=>setRole(e.target.value)} style={inputStyle}>
              <option value="client">Client</option>
              <option value="lawyer">Lawyer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {/* Suspend toggle */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:10,background:suspended?"rgba(239,68,68,0.08)":"var(--input-bg,#0f172a)",border:`1px solid ${suspended?"rgba(239,68,68,0.3)":"var(--border-color,#334155)"}`}}>
            <div>
              <p style={{margin:0,fontSize:14,fontWeight:600,color:"var(--text-heading,#f1f5f9)"}}>Account Suspended</p>
              <p style={{margin:0,fontSize:12,color:"#64748b"}}>Block user from accessing the platform</p>
            </div>
            <button onClick={()=>setSusp(p=>!p)}
              style={{width:44,height:24,borderRadius:12,background:suspended?"#ef4444":"#334155",border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
              <span style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:suspended?23:3,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.4)"}}/>
            </button>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button onClick={onClose} style={{flex:1,padding:12,borderRadius:12,border:"1px solid var(--border-color,#334155)",background:"transparent",fontWeight:600,cursor:"pointer",color:"var(--text-muted,#94a3b8)"}}>Cancel</button>
          <button onClick={doSave} disabled={saving} style={{flex:1,padding:12,borderRadius:12,border:"none",background:"#3b82f6",color:"#fff",fontWeight:700,cursor:"pointer",opacity:saving?0.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            {saving?<><span style={{width:13,height:13,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block"}}/> Saving…</>:"Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function UserManagement() {
  const router = useRouter();
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [roleF,    setRoleF]    = useState("all");
  const [delUser,  setDel]      = useState(null);
  const [delLoad,  setDelLoad]  = useState(false);
  const [editUser, setEdit]     = useState(null);
  const [toast,    setToast]    = useState(null);
  const [page,     setPage]     = useState(1);
  const [vis,      setVis]      = useState(false);
  const PER = 20;

  const show = (msg, type = "success") => { setToast({ msg, type }); };

  /* ── Load users ─────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/users?limit=500`, { credentials: "include", headers: HJ() });
      if (!r.ok) throw new Error(`HTTP ${r.status} — check that /api/admin route is registered in server.js`);
      const d = await r.json();
      setUsers(Array.isArray(d) ? d : (d.users || []));
    } catch (e) {
      show(e.message, "error");
    } finally {
      setLoading(false);
      setTimeout(() => setVis(true), 60);
    }
  }, []);

  useEffect(() => { load(); }, []);

  /* ── Delete ─────────────────────────────────────────────────────── */
  const doDelete = async () => {
    setDelLoad(true);
    try {
      const r = await fetch(`${API}/api/admin/users/${delUser._id}`, { method:"DELETE", credentials:"include", headers:HJ() });
      if (r.ok) { setUsers(p => p.filter(u => u._id !== delUser._id)); show(`${delUser.name||"User"} deleted`); }
      else { const d = await r.json().catch(()=>({})); show(d.message||"Delete failed","error"); }
    } catch { show("Delete failed","error"); }
    finally { setDelLoad(false); setDel(null); }
  };

  /* ── Edit/save ──────────────────────────────────────────────────── */
  const doEdit = async (id, data) => {
    try {
      const r = await fetch(`${API}/api/admin/users/${id}`, { method:"PUT", credentials:"include", headers:HJ(), body:JSON.stringify(data) });
      if (r.ok) {
        const d = await r.json();
        setUsers(p => p.map(u => u._id === id ? { ...u, ...(d.user || data) } : u));
        show("User updated");
      } else show("Update failed","error");
    } catch { show("Update failed","error"); }
  };

  /* ── Filter + sort ──────────────────────────────────────────────── */
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (roleF==="all" || u.role===roleF) &&
      (!q || (u.name||"").toLowerCase().includes(q) || (u.email||"").toLowerCase().includes(q));
  });
  const pages = Math.ceil(filtered.length / PER);
  const paged = filtered.slice((page-1)*PER, page*PER);
  const counts = {
    all:    users.length,
    admin:  users.filter(u=>u.role==="admin").length,
    lawyer: users.filter(u=>u.role==="lawyer").length,
    client: users.filter(u=>u.role==="client").length,
  };

  /* ── Styles ─────────────────────────────────────────────────────── */
  const css = `
    @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes popIn{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fd{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
    .urow{transition:background 0.12s;}
    .urow:hover{background:var(--row-hover,rgba(255,255,255,0.03))!important;}
    .act{transition:all 0.15s;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;}
    .act:hover{filter:brightness(1.15);transform:scale(1.08);}
    .role-tab{transition:all 0.15s;cursor:pointer;}
    .role-tab:hover{opacity:0.85;}
    .srch:focus{border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,0.15)!important;}
    .srch{transition:border-color 0.15s,box-shadow 0.15s;}
  `;

  return (
    <>
      <style>{css}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      {delUser && <DeleteModal user={delUser} onClose={()=>setDel(null)} onConfirm={doDelete} loading={delLoad}/>}
      {editUser && <EditModal user={editUser} onClose={()=>setEdit(null)} onSave={doEdit}/>}

      <div style={{maxWidth:1000,margin:"0 auto",opacity:vis?1:0,transition:"opacity 0.3s"}}>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{margin:0,fontSize:26,fontWeight:800,color:"var(--text-heading,#f1f5f9)",letterSpacing:"-0.5px"}}>
              User Management
            </h1>
            <p style={{margin:"4px 0 0",color:"var(--text-muted,#64748b)",fontSize:14}}>
              {users.length} total users · {counts.lawyer} lawyers · {counts.client} clients · {counts.admin} admins
            </p>
          </div>
          <button onClick={load}
            style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:10,border:"1px solid var(--border-color,#334155)",background:"var(--card-bg,#1e293b)",color:"var(--text-muted,#94a3b8)",fontSize:13,fontWeight:600,cursor:"pointer"}}>
            <RefreshCw size={14} style={{animation:loading?"spin 1s linear infinite":"none"}}/> Refresh
          </button>
        </div>

        {/* ── Summary cards ───────────────────────────────────────── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
          {[
            {label:"Total Users", count:counts.all,    icon:User,      color:"#6366f1"},
            {label:"Admins",      count:counts.admin,  icon:Shield,    color:"#ef4444"},
            {label:"Lawyers",     count:counts.lawyer, icon:Scale,     color:"#10b981"},
            {label:"Clients",     count:counts.client, icon:UserCheck, color:"#3b82f6"},
          ].map(s=>(
            <div key={s.label} style={{background:"var(--card-bg,#1e293b)",borderRadius:14,border:"1px solid var(--border-color,#334155)",padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:10,background:`${s.color}18`,border:`1px solid ${s.color}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <s.icon size={16} style={{color:s.color}}/>
              </div>
              <div>
                <p style={{margin:0,fontSize:20,fontWeight:800,color:"var(--text-heading,#f1f5f9)"}}>{s.count}</p>
                <p style={{margin:0,fontSize:11,color:"var(--text-muted,#64748b)"}}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search + role filters ────────────────────────────────── */}
        <div style={{background:"var(--card-bg,#1e293b)",borderRadius:16,border:"1px solid var(--border-color,#334155)",padding:"14px 16px",marginBottom:4,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          {/* Search */}
          <div style={{position:"relative",flex:1,minWidth:200}}>
            <Search size={14} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"#64748b"}}/>
            <input className="srch" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
              placeholder="Search users…"
              style={{width:"100%",padding:"9px 12px 9px 32px",borderRadius:10,border:"1px solid var(--border-color,#334155)",fontSize:13,outline:"none",background:"var(--input-bg,#0f172a)",color:"var(--text-heading,#f1f5f9)",boxSizing:"border-box"}}/>
          </div>
          {/* Role tabs */}
          <div style={{display:"flex",gap:6}}>
            {[["all","All"],["admin","Admins"],["lawyer","Lawyers"],["client","Clients"]].map(([v,l])=>(
              <button key={v} className="role-tab" onClick={()=>{setRoleF(v);setPage(1);}}
                style={{padding:"7px 14px",borderRadius:20,border:`1px solid ${roleF===v?(ROLE_COLOR[v]||"#6366f1"):"var(--border-color,#334155)"}`,background:roleF===v?`${ROLE_COLOR[v]||"#6366f1"}18`:"transparent",color:roleF===v?(ROLE_COLOR[v]||"#6366f1"):"var(--text-muted,#64748b)",fontSize:12,fontWeight:700,transition:"all 0.15s"}}>
                {l} <span style={{opacity:0.65}}>({counts[v]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ───────────────────────────────────────────────── */}
        <div style={{background:"var(--card-bg,#1e293b)",borderRadius:16,border:"1px solid var(--border-color,#334155)",overflow:"hidden"}}>
          {/* Table head */}
          <div style={{display:"grid",gridTemplateColumns:"2fr 2.5fr 100px 120px",padding:"12px 20px",borderBottom:"1px solid var(--border-color,#334155)",background:"rgba(255,255,255,0.02)"}}>
            {["User","Email","Role","Actions"].map(h=>(
              <span key={h} style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</span>
            ))}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div style={{padding:"8px 0"}}>
              {[1,2,3,4,5].map(i=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 2.5fr 100px 120px",padding:"14px 20px",borderBottom:"1px solid var(--border-color,#334155)",alignItems:"center",gap:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:"var(--border-color,#334155)",animation:"pulse 1.4s ease infinite",flexShrink:0}}/>
                    <div style={{width:"55%",height:13,borderRadius:6,background:"var(--border-color,#334155)",animation:"pulse 1.4s ease infinite"}}/>
                  </div>
                  <div style={{width:"70%",height:12,borderRadius:6,background:"var(--border-color,#334155)",animation:"pulse 1.4s ease infinite"}}/>
                  <div style={{width:55,height:22,borderRadius:20,background:"var(--border-color,#334155)",animation:"pulse 1.4s ease infinite"}}/>
                  <div style={{display:"flex",gap:6}}>
                    {[1,2,3,4].map(j=><div key={j} style={{width:30,height:30,borderRadius:8,background:"var(--border-color,#334155)",animation:"pulse 1.4s ease infinite"}}/>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && paged.length === 0 && (
            <div style={{padding:"60px 24px",textAlign:"center"}}>
              <User size={40} style={{color:"#334155",display:"block",margin:"0 auto 12px"}}/>
              <p style={{color:"#64748b",fontWeight:600,margin:0}}>No users found</p>
              <p style={{color:"#334155",fontSize:13,margin:"4px 0 0"}}>
                {search ? "Try a different search term" : "No users match the selected filter"}
              </p>
            </div>
          )}

          {/* Rows */}
          {!loading && paged.map((u, i) => {
            const rc  = ROLE_COLOR[u.role] || "#6366f1";
            const rbg = ROLE_BG[u.role]    || "rgba(99,102,241,0.15)";
            const init = (u.name || u.email || "U").charAt(0).toUpperCase();
            return (
              <div key={u._id} className="urow"
                style={{display:"grid",gridTemplateColumns:"2fr 2.5fr 100px 120px",padding:"13px 20px",borderBottom:"1px solid var(--border-color,#2a3547)",alignItems:"center",animation:`fd 0.25s ease ${i*0.02}s both`,opacity:u.suspended?0.65:1}}>

                {/* User cell */}
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:rc,color:"#fff",fontWeight:800,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden",position:"relative",boxShadow:`0 0 0 2px ${rc}30`}}>
                    {u.profileImage ? <img src={u.profileImage} style={{width:36,height:36,objectFit:"cover"}} alt=""/> : init}
                    {/* online dot */}
                    <span style={{position:"absolute",bottom:0,right:0,width:9,height:9,borderRadius:"50%",background:u.isOnline?"#10b981":"#4b5563",border:"2px solid var(--card-bg,#1e293b)"}}/>
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                      <span style={{fontSize:13,fontWeight:700,color:"var(--text-heading,#f1f5f9)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:130}}>{u.name||"Unnamed"}</span>
                      {u.suspended && <span style={{fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:20,background:"rgba(239,68,68,0.15)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.3)"}}>SUSPENDED</span>}
                    </div>
                    {u.phone && <p style={{margin:0,fontSize:11,color:"#64748b"}}>{u.phone}</p>}
                  </div>
                </div>

                {/* Email cell */}
                <span style={{fontSize:13,color:"var(--text-muted,#94a3b8)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</span>

                {/* Role badge */}
                <span style={{fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:20,background:rbg,color:rc,textTransform:"capitalize",border:`1px solid ${rc}30`,width:"fit-content"}}>
                  {u.role}
                </span>

                {/* Action buttons */}
                <div style={{display:"flex",gap:6}}>
                  {/* Message */}
                  <button className="act" title="Send Message"
                    onClick={() => router.push(`/dashboard/admin/messages?contact=${u._id}`)}
                    style={{width:30,height:30,background:"rgba(59,130,246,0.12)",border:"1px solid rgba(59,130,246,0.25)"}}>
                    <MessageSquare size={13} style={{color:"#3b82f6"}}/>
                  </button>
                  {/* Video call */}
                  <button className="act" title="Video Call"
                    onClick={() => router.push(`/dashboard/admin/video-calls?contact=${u._id}`)}
                    style={{width:30,height:30,background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.25)"}}>
                    <Video size={13} style={{color:"#10b981"}}/>
                  </button>
                  {/* Edit */}
                  <button className="act" title="Edit User"
                    onClick={() => setEdit(u)}
                    style={{width:30,height:30,background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.25)"}}>
                    <Edit3 size={13} style={{color:"#f59e0b"}}/>
                  </button>
                  {/* Delete */}
                  <button className="act" title="Delete User"
                    onClick={() => setDel(u)}
                    style={{width:30,height:30,background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.25)"}}>
                    <Trash2 size={13} style={{color:"#ef4444"}}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Pagination ───────────────────────────────────────────── */}
        {pages > 1 && (
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,padding:"0 4px",flexWrap:"wrap",gap:10}}>
            <span style={{fontSize:13,color:"var(--text-muted,#64748b)"}}>
              Showing {(page-1)*PER+1}–{Math.min(page*PER,filtered.length)} of {filtered.length} users
            </span>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                style={{padding:"7px 14px",borderRadius:10,border:"1px solid var(--border-color,#334155)",background:"var(--card-bg,#1e293b)",color:"var(--text-muted,#94a3b8)",cursor:page===1?"default":"pointer",opacity:page===1?0.4:1,fontSize:13,fontWeight:600}}>
                ← Prev
              </button>
              {Array.from({length:pages},(_, i)=>i+1).filter(n=>n===1||n===pages||Math.abs(n-page)<=1).map((n,i,arr)=>(
                <span key={n}>
                  {i>0&&arr[i-1]<n-1&&<span style={{padding:"7px 4px",color:"#334155"}}>…</span>}
                  <button onClick={()=>setPage(n)}
                    style={{width:36,height:34,borderRadius:10,border:`1px solid ${n===page?"#3b82f6":"var(--border-color,#334155)"}`,background:n===page?"#3b82f6":"var(--card-bg,#1e293b)",color:n===page?"#fff":"var(--text-muted,#94a3b8)",cursor:"pointer",fontSize:13,fontWeight:700}}>
                    {n}
                  </button>
                </span>
              ))}
              <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages}
                style={{padding:"7px 14px",borderRadius:10,border:"1px solid var(--border-color,#334155)",background:"var(--card-bg,#1e293b)",color:"var(--text-muted,#94a3b8)",cursor:page===pages?"default":"pointer",opacity:page===pages?0.4:1,fontSize:13,fontWeight:600}}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}