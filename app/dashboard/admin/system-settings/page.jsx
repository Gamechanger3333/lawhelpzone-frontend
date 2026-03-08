"use client";
// ══════════════════════════════════════════════════════════════════════════════
// SYSTEM SETTINGS — app/dashboard/admin/system-settings/page.jsx
// ADMIN-ONLY: Non-admin users are redirected away
// ══════════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../../../store/index";
import {
  Shield, Database, Bell, Settings, Save, RotateCcw,
  CheckCircle, AlertTriangle, X, Eye, EyeOff,
  Lock, Mail, Globe, Zap, Users, Clock,
  Server, HardDrive, Wifi, Activity,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const HJ  = () => ({ "Content-Type": "application/json", ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });
const LS_KEY = "lhz_system_settings";

const DEFAULTS = {
  general: { siteName:"LawHelpZone", siteDescription:"Connect with legal experts instantly", maintenanceMode:false, allowRegistrations:true, defaultUserRole:"client", maxFileUploadMB:10, sessionTimeoutMins:30 },
  security: { maxLoginAttempts:5, lockoutDurationMins:15, requireEmailVerification:true, twoFactorEnabled:false, passwordMinLength:8, jwtExpiryMins:15, refreshTokenDays:30, allowedOrigins:"http://localhost:3000",
    // ADMIN ONLY ACCESS SETTING:
    adminOnlyDashboard: true },
  notifications: { emailNotifications:true, newUserAlert:true, newCaseAlert:true, proposalAlert:true, systemAlerts:true, adminEmail:"", smtpHost:"", smtpPort:"587", smtpUser:"", smtpSecure:false },
  database: { dbName:"lawhelpzone", backupEnabled:true, backupIntervalHours:24, maxConnections:100 },
};

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:type==="error"?"#fef2f2":"#f0fdf4",border:`1px solid ${type==="error"?"#fca5a5":"#86efac"}`,color:type==="error"?"#dc2626":"#16a34a",borderRadius:12,padding:"12px 18px",fontSize:14,fontWeight:600,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",display:"flex",alignItems:"center",gap:8,animation:"fd 0.3s ease"}}>
      {type==="error"?<AlertTriangle size={16}/>:<CheckCircle size={16}/>}{msg}
      <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",marginLeft:4,opacity:0.5}}><X size={13}/></button>
    </div>
  );
}

function Toggle({ checked, onChange, label, desc, danger }) {
  return (
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,padding:"14px 0",borderBottom:"1px solid var(--border-color,#f1f5f9)"}}>
      <div>
        <p style={{margin:0,fontSize:14,fontWeight:600,color:"var(--text-heading,#0f172a)"}}>{label}</p>
        {desc&&<p style={{margin:"3px 0 0",fontSize:12,color:"var(--text-muted,#64748b)",lineHeight:1.5}}>{desc}</p>}
      </div>
      <button onClick={()=>onChange(!checked)}
        style={{width:44,height:24,borderRadius:12,background:checked?(danger?"#ef4444":"#3b82f6"):"var(--toggle-off,#e2e8f0)",border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
        <span style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:checked?23:3,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
      </button>
    </div>
  );
}

function Field({ label, desc, value, onChange, type="text", min, max, placeholder, icon:Icon }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{marginBottom:16}}>
      <label style={{fontSize:12,fontWeight:700,color:"var(--text-muted,#64748b)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>{label}</label>
      {desc&&<p style={{margin:"0 0 6px",fontSize:12,color:"var(--text-muted,#64748b)"}}>{desc}</p>}
      <div style={{position:"relative"}}>
        {Icon&&<Icon size={14} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted,#94a3b8)"}}/>}
        <input type={type==="password"?(show?"text":"password"):type} value={value} onChange={e=>onChange(e.target.value)} min={min} max={max} placeholder={placeholder}
          className="settings-input"
          style={{width:"100%",padding:`10px 14px 10px ${Icon?"32px":"14px"}`,borderRadius:10,border:"1px solid var(--border-color,#e2e8f0)",fontSize:14,outline:"none",background:"var(--input-bg,#fff)",color:"var(--text-primary,#0f172a)",boxSizing:"border-box",paddingRight:type==="password"?40:14}}/>
        {type==="password"&&<button onClick={()=>setShow(p=>!p)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-muted,#94a3b8)",display:"flex"}}>{show?<EyeOff size={14}/>:<Eye size={14}/>}</button>}
      </div>
    </div>
  );
}

function Section({ id, icon:Icon, title, subtitle, color, children, onSave, onReset, saving }) {
  return (
    <div id={id} style={{background:"var(--card-bg,#fff)",borderRadius:20,border:"1px solid var(--border-color,#f1f5f9)",boxShadow:"0 2px 12px rgba(0,0,0,0.04)",overflow:"hidden",marginBottom:20,animation:"fd 0.4s ease both"}}>
      <div style={{padding:"18px 24px",borderBottom:"1px solid var(--border-color,#f1f5f9)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Icon size={18} style={{color}}/>
          </div>
          <div>
            <h3 style={{margin:0,fontSize:16,fontWeight:800,color:"var(--text-heading,#0f172a)"}}>{title}</h3>
            <p style={{margin:0,fontSize:12,color:"var(--text-muted,#64748b)"}}>{subtitle}</p>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onReset} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:"1px solid var(--border-color,#e2e8f0)",background:"transparent",color:"var(--text-muted,#64748b)",fontSize:13,fontWeight:600,cursor:"pointer"}}><RotateCcw size={13}/> Reset</button>
          <button onClick={onSave} disabled={saving} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,background:color,color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",opacity:saving?0.7:1}}>
            {saving?<div style={{width:13,height:13,border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>:<Save size={13}/>}
            {saving?"Saving…":"Save"}
          </button>
        </div>
      </div>
      <div style={{padding:"20px 24px"}}>{children}</div>
    </div>
  );
}

export default function SystemSettings() {
  const router = useRouter();
  const { user } = useAppSelector(s => s.auth);

  const [settings, setSettings] = useState(null);
  const [saved,    setSaved]    = useState({});
  const [toast,    setToast]    = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [activeTab, setTab]     = useState("general");
  const [vis,      setVis]      = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

  const showToast = (msg, type="success") => setToast({msg,type});

  // ── ADMIN-ONLY ACCESS CHECK ──────────────────────────────────────
  useEffect(() => {
    // Wait a bit for auth to initialize
    const timer = setTimeout(() => {
      if (user && user.role !== "admin") {
        // Redirect non-admin users
        router.replace(`/dashboard/${user.role}`);
        return;
      }
      setAccessChecked(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [user, router]);

  useEffect(() => {
    if (!accessChecked) return;
    try {
      const raw = localStorage.getItem(LS_KEY);
      setSettings(raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS);
    } catch { setSettings(DEFAULTS); }
    fetch(`${API}/health`).then(r=>r.json()).then(d=>setDbStatus(d)).catch(()=>{});
    setTimeout(()=>setVis(true), 80);
  }, [accessChecked]);

  const update = (section, key, val) => setSettings(p=>({...p,[section]:{...p[section],[key]:val}}));

  const saveSection = async (section) => {
    setSaved(p=>({...p,[section]:true}));
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(settings));
      if (section==="general" && settings.general.maintenanceMode) {
        await fetch(`${API}/api/admin/broadcast`, { method:"POST", credentials:"include", headers:HJ(), body:JSON.stringify({title:"Maintenance Mode",body:"The platform is entering maintenance mode.",type:"warning"}) }).catch(()=>{});
      }
      showToast(`${section.charAt(0).toUpperCase()+section.slice(1)} settings saved!`);
    } catch { showToast("Failed to save","error"); }
    finally { setTimeout(()=>setSaved(p=>({...p,[section]:false})),600); }
  };

  const resetSection = (section) => {
    setSettings(p=>({...p,[section]:DEFAULTS[section]}));
    showToast(`${section.charAt(0).toUpperCase()+section.slice(1)} reset to defaults.`);
  };

  const testBroadcast = async () => {
    try {
      const r = await fetch(`${API}/api/admin/broadcast`, { method:"POST", credentials:"include", headers:HJ(), body:JSON.stringify({title:"Test Broadcast",body:"This is a test notification from Admin.",type:"info"}) });
      if (r.ok) showToast("Broadcast sent to all users!");
      else showToast("Broadcast failed","error");
    } catch { showToast("Broadcast failed","error"); }
  };

  const TABS = [
    {key:"general",label:"General",icon:Settings,color:"#f59e0b"},
    {key:"security",label:"Security",icon:Shield,color:"#ef4444"},
    {key:"notifications",label:"Notifications",icon:Bell,color:"#3b82f6"},
    {key:"database",label:"Database",icon:Database,color:"#10b981"},
  ];

  // Show loading or access denied
  if (!accessChecked) {
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:400,gap:14}}>
        <div style={{width:40,height:40,border:"3px solid var(--border-color,#e2e8f0)",borderTopColor:"#ef4444",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
        <p style={{color:"var(--text-muted,#64748b)",fontSize:14,margin:0}}>Checking access…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (user && user.role !== "admin") {
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:400,gap:16,textAlign:"center",padding:40}}>
        <div style={{width:60,height:60,borderRadius:"50%",background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center"}}><Shield size={28} style={{color:"#ef4444"}}/></div>
        <h2 style={{margin:0,fontSize:22,fontWeight:800,color:"var(--text-heading,#0f172a)"}}>Access Restricted</h2>
        <p style={{margin:0,fontSize:14,color:"var(--text-muted,#64748b)",maxWidth:360}}>System Settings are only accessible to administrators. You are being redirected to your dashboard.</p>
        <button onClick={()=>router.push(`/dashboard/${user?.role||"client"}`)} style={{padding:"10px 24px",borderRadius:12,background:"#0A1A3F",color:"#fff",border:"none",fontWeight:700,fontSize:14,cursor:"pointer"}}>Go to My Dashboard</button>
      </div>
    );
  }

  if (!settings) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:300}}>
      <div style={{width:36,height:36,border:"3px solid var(--border-color,#e2e8f0)",borderTopColor:"#3b82f6",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const s = settings;

  return (
    <>
      <style>{`@keyframes fd{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}:root{--toggle-off:#e2e8f0;}.dark{--toggle-off:#334155;}.settings-input:focus{border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,0.1)!important;}.settings-input{transition:border-color 0.15s,box-shadow 0.15s;}.tab-btn{transition:all 0.15s;}.tab-btn:hover{background:var(--conv-hover,#f8fafc)!important;}`}</style>
      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}

      <div style={{maxWidth:900,margin:"0 auto",opacity:vis?1:0,transition:"opacity 0.4s"}}>
        <div style={{marginBottom:24}}>
          <h1 style={{margin:0,fontSize:26,fontWeight:800,color:"var(--text-heading,#0f172a)",letterSpacing:"-0.5px"}}>System Settings ⚙️</h1>
          <p style={{margin:"4px 0 0",color:"var(--text-muted,#64748b)",fontSize:14}}>Platform configuration · Admin access only</p>
        </div>

        {/* Status strip */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:24}}>
          {[
            {icon:Server,label:"Server Status",value:dbStatus?.status==="healthy"?"Healthy ✓":"Checking…",color:"#10b981"},
            {icon:Database,label:"Database",value:dbStatus?.database==="connected"?"Connected":"—",color:"#3b82f6"},
            {icon:Clock,label:"Uptime",value:dbStatus?.uptime?`${Math.floor(dbStatus.uptime/60)}m`:"—",color:"#f59e0b"},
            {icon:Zap,label:"Maintenance",value:s.general.maintenanceMode?"ON ⚠":"Off",color:s.general.maintenanceMode?"#ef4444":"#10b981"},
          ].map(stat=>(
            <div key={stat.label} style={{background:"var(--card-bg,#fff)",borderRadius:14,border:"1px solid var(--border-color,#f1f5f9)",padding:"16px 18px",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:38,height:38,borderRadius:10,background:`${stat.color}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><stat.icon size={16} style={{color:stat.color}}/></div>
              <div><p style={{margin:0,fontSize:18,fontWeight:800,color:"var(--text-heading,#0f172a)"}}>{stat.value}</p><p style={{margin:0,fontSize:11,color:"var(--text-muted,#64748b)"}}>{stat.label}</p></div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:6,marginBottom:20,background:"var(--card-bg,#fff)",borderRadius:14,border:"1px solid var(--border-color,#f1f5f9)",padding:6,flexWrap:"wrap"}}>
          {TABS.map(tab=>(
            <button key={tab.key} className="tab-btn" onClick={()=>setTab(tab.key)}
              style={{flex:1,minWidth:100,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px 14px",borderRadius:10,border:"none",background:activeTab===tab.key?`${tab.color}18`:"transparent",color:activeTab===tab.key?tab.color:"var(--text-muted,#64748b)",fontSize:13,fontWeight:activeTab===tab.key?700:600,cursor:"pointer"}}>
              <tab.icon size={15}/> {tab.label}
            </button>
          ))}
        </div>

        {/* GENERAL */}
        {activeTab==="general"&&(
          <Section id="general" icon={Settings} title="General Settings" subtitle="Basic platform configuration" color="#f59e0b" onSave={()=>saveSection("general")} onReset={()=>resetSection("general")} saving={saved.general}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
              <Field label="Site Name" value={s.general.siteName} onChange={v=>update("general","siteName",v)} icon={Globe}/>
              <Field label="Max Upload Size (MB)" value={s.general.maxFileUploadMB} onChange={v=>update("general","maxFileUploadMB",Number(v))} type="number" min={1} max={100} icon={HardDrive}/>
              <Field label="Session Timeout (mins)" value={s.general.sessionTimeoutMins} onChange={v=>update("general","sessionTimeoutMins",Number(v))} type="number" min={5} icon={Clock}/>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:"var(--text-muted,#64748b)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>Default Role</label>
                <select value={s.general.defaultUserRole} onChange={e=>update("general","defaultUserRole",e.target.value)}
                  className="settings-input" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid var(--border-color,#e2e8f0)",fontSize:14,outline:"none",background:"var(--input-bg,#fff)",color:"var(--text-primary,#0f172a)",marginBottom:16}}>
                  <option value="client">Client</option><option value="lawyer">Lawyer</option>
                </select>
              </div>
            </div>
            <Field label="Site Description" value={s.general.siteDescription} onChange={v=>update("general","siteDescription",v)}/>
            <div style={{borderTop:"1px solid var(--border-color,#f1f5f9)",paddingTop:16,marginTop:4}}>
              <Toggle label="Maintenance Mode" desc="Temporarily disable user access for maintenance." checked={s.general.maintenanceMode} onChange={v=>update("general","maintenanceMode",v)} danger/>
              <Toggle label="Allow Registrations" desc="Allow new users to create accounts." checked={s.general.allowRegistrations} onChange={v=>update("general","allowRegistrations",v)}/>
            </div>
            {s.general.maintenanceMode&&<div style={{marginTop:12,padding:"12px 16px",borderRadius:12,background:"#fef2f2",border:"1px solid #fecaca",display:"flex",alignItems:"center",gap:10}}><AlertTriangle size={16} style={{color:"#ef4444",flexShrink:0}}/><p style={{margin:0,fontSize:13,color:"#dc2626",fontWeight:600}}>⚠ Maintenance mode is ON — users cannot access the platform.</p></div>}
          </Section>
        )}

        {/* SECURITY */}
        {activeTab==="security"&&(
          <Section id="security" icon={Shield} title="Security Settings" subtitle="Authentication & access control" color="#ef4444" onSave={()=>saveSection("security")} onReset={()=>resetSection("security")} saving={saved.security}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
              <Field label="Max Login Attempts" value={s.security.maxLoginAttempts} onChange={v=>update("security","maxLoginAttempts",Number(v))} type="number" min={1} max={20} icon={Lock} desc="Attempts before lockout"/>
              <Field label="Lockout Duration (mins)" value={s.security.lockoutDurationMins} onChange={v=>update("security","lockoutDurationMins",Number(v))} type="number" min={1} icon={Clock}/>
              <Field label="Min Password Length" value={s.security.passwordMinLength} onChange={v=>update("security","passwordMinLength",Number(v))} type="number" min={6} max={32} icon={Lock}/>
              <Field label="JWT Expiry (mins)" value={s.security.jwtExpiryMins} onChange={v=>update("security","jwtExpiryMins",Number(v))} type="number" min={5} icon={Clock}/>
              <Field label="Refresh Token (days)" value={s.security.refreshTokenDays} onChange={v=>update("security","refreshTokenDays",Number(v))} type="number" min={1} max={90} icon={Clock}/>
              <Field label="Allowed Origins (CORS)" value={s.security.allowedOrigins} onChange={v=>update("security","allowedOrigins",v)} icon={Globe} placeholder="http://localhost:3000"/>
            </div>
            <div style={{borderTop:"1px solid var(--border-color,#f1f5f9)",paddingTop:16,marginTop:4}}>
              <Toggle label="Admin-Only Dashboard Access" desc="⚡ Restrict /dashboard/admin to admin users only. Non-admins are redirected to their own dashboard." checked={s.security.adminOnlyDashboard!==false} onChange={v=>update("security","adminOnlyDashboard",v)} danger/>
              <Toggle label="Require Email Verification" desc="New users must verify email before accessing the platform." checked={s.security.requireEmailVerification} onChange={v=>update("security","requireEmailVerification",v)}/>
              <Toggle label="Two-Factor Authentication" desc="Enable 2FA option for all users." checked={s.security.twoFactorEnabled} onChange={v=>update("security","twoFactorEnabled",v)}/>
            </div>
            <div style={{marginTop:12,padding:"12px 16px",borderRadius:12,background:"#eff6ff",border:"1px solid #bfdbfe"}}>
              <p style={{margin:0,fontSize:13,color:"#1e40af",fontWeight:600}}>ℹ Admin-Only Access is enforced on every protected page. Lawyers and clients cannot access admin routes.</p>
            </div>
          </Section>
        )}

        {/* NOTIFICATIONS */}
        {activeTab==="notifications"&&(
          <Section id="notifications" icon={Bell} title="Notification Settings" subtitle="Email and push notifications" color="#3b82f6" onSave={()=>saveSection("notifications")} onReset={()=>resetSection("notifications")} saving={saved.notifications}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
              <Field label="Admin Email" value={s.notifications.adminEmail} onChange={v=>update("notifications","adminEmail",v)} type="email" icon={Mail} placeholder="admin@lawhelpzone.com"/>
              <Field label="SMTP Host" value={s.notifications.smtpHost} onChange={v=>update("notifications","smtpHost",v)} icon={Server} placeholder="smtp.gmail.com"/>
              <Field label="SMTP Port" value={s.notifications.smtpPort} onChange={v=>update("notifications","smtpPort",v)} icon={Wifi} placeholder="587"/>
              <Field label="SMTP Username" value={s.notifications.smtpUser} onChange={v=>update("notifications","smtpUser",v)} icon={Mail} placeholder="your@email.com"/>
            </div>
            <div style={{borderTop:"1px solid var(--border-color,#f1f5f9)",paddingTop:16,marginTop:4}}>
              <Toggle label="Email Notifications" desc="Enable email delivery for all notifications." checked={s.notifications.emailNotifications} onChange={v=>update("notifications","emailNotifications",v)}/>
              <Toggle label="New User Alerts" desc="Notify admin when new users register." checked={s.notifications.newUserAlert} onChange={v=>update("notifications","newUserAlert",v)}/>
              <Toggle label="New Case Alerts" desc="Notify admin when new cases are submitted." checked={s.notifications.newCaseAlert} onChange={v=>update("notifications","newCaseAlert",v)}/>
              <Toggle label="Proposal Alerts" desc="Notify clients when lawyers submit proposals." checked={s.notifications.proposalAlert} onChange={v=>update("notifications","proposalAlert",v)}/>
              <Toggle label="System Alerts" desc="Critical platform alerts and errors." checked={s.notifications.systemAlerts} onChange={v=>update("notifications","systemAlerts",v)}/>
            </div>
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button onClick={testBroadcast} style={{padding:"10px 18px",borderRadius:10,background:"#3b82f6",color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                <Users size={14}/> Send Test Broadcast
              </button>
            </div>
          </Section>
        )}

        {/* DATABASE */}
        {activeTab==="database"&&(
          <Section id="database" icon={Database} title="Database Settings" subtitle="Storage, backup and connections" color="#10b981" onSave={()=>saveSection("database")} onReset={()=>resetSection("database")} saving={saved.database}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:20}}>
              {[
                {label:"Status",value:dbStatus?.database==="connected"?"✓ Connected":"Checking…",color:"#10b981"},
                {label:"DB Name",value:"lawhelpzone",color:"#3b82f6"},
                {label:"Uptime",value:dbStatus?.uptime?`${Math.floor(dbStatus.uptime)}s`:"—",color:"#f59e0b"},
                {label:"Timestamp",value:dbStatus?.timestamp?new Date(dbStatus.timestamp).toLocaleTimeString():"—",color:"#8b5cf6"},
              ].map(stat=>(
                <div key={stat.label} style={{background:`${stat.color}0d`,borderRadius:12,border:`1px solid ${stat.color}30`,padding:"12px 14px"}}>
                  <p style={{margin:0,fontSize:11,fontWeight:700,color:stat.color,textTransform:"uppercase",letterSpacing:"0.04em"}}>{stat.label}</p>
                  <p style={{margin:"4px 0 0",fontSize:14,fontWeight:800,color:"var(--text-heading,#0f172a)"}}>{stat.value}</p>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
              <Field label="Database Name" value={s.database.dbName} onChange={v=>update("database","dbName",v)} icon={Database}/>
              <Field label="Max Connections" value={s.database.maxConnections} onChange={v=>update("database","maxConnections",Number(v))} type="number" min={10} icon={Wifi}/>
              <Field label="Backup Interval (hours)" value={s.database.backupIntervalHours} onChange={v=>update("database","backupIntervalHours",Number(v))} type="number" min={1} icon={Clock}/>
            </div>
            <div style={{borderTop:"1px solid var(--border-color,#f1f5f9)",paddingTop:16,marginTop:4}}>
              <Toggle label="Automatic Backups" desc="Auto-backup database at the configured interval." checked={s.database.backupEnabled} onChange={v=>update("database","backupEnabled",v)}/>
            </div>
            <div style={{marginTop:16,display:"flex",gap:10}}>
              <button onClick={()=>{fetch(`${API}/health`).then(r=>r.json()).then(d=>{setDbStatus(d);showToast("Connection refreshed!");}).catch(()=>showToast("Failed","error"));}}
                style={{padding:"10px 18px",borderRadius:10,background:"#10b981",color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                <Activity size={14}/> Test Connection
              </button>
            </div>
            <div style={{marginTop:12,padding:"12px 16px",borderRadius:12,background:"#f0fdf4",border:"1px solid #bbf7d0"}}>
              <p style={{margin:0,fontSize:13,color:"#15803d",fontWeight:600}}>ℹ Database connection is managed by the backend .env file (MONGO_URI).</p>
            </div>
          </Section>
        )}
      </div>
    </>
  );
}