"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../../store/index";
import { logoutUser } from "../../store/slices/authSlice";
import { useSocket } from "./SocketProvider";
import {
  LayoutDashboard, MessageSquare, Bell, Video, User,
  FileText, Briefcase, Users, Settings, LogOut,
  ChevronLeft, ChevronRight, Menu, X, Phone, Moon, Sun,
} from "lucide-react";

function cn(...c) { return c.filter(Boolean).join(" "); }

const NAVY  = "#0A1A3F";
const NAVY2 = "#0d2250";
const ACT   = "#2563eb";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const tok = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);
const H   = () => ({ "Content-Type": "application/json", ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}) });

const roleConfig = {
  client: {
    label: "Client", dot: "#3b82f6",
    tools: [
      { label: "My Cases",  href: "cases",     icon: FileText },
      { label: "My Lawyer", href: "my-lawyer", icon: Briefcase },
    ],
    toolsLabel: "Client Tools",
  },
  lawyer: {
    label: "Lawyer", dot: "#10b981",
    tools: [
      { label: "My Cases",    href: "cases",       icon: FileText },
      { label: "Client List", href: "client-list", icon: Users },
    ],
    toolsLabel: "Lawyer Tools",
  },
  admin: {
    label: "Admin", dot: "#ef4444",
    tools: [
      { label: "User Management", href: "user-management", icon: Users },
      { label: "System Settings", href: "system-settings", icon: Settings },
    ],
    toolsLabel: "Admin Tools",
  },
};

const navLinks = [
  { label: "Dashboard",     href: "",              icon: LayoutDashboard },
  { label: "Messages",      href: "messages",      icon: MessageSquare, badge: "msg" },
  { label: "Notifications", href: "notifications", icon: Bell,          badge: "notif" },
  { label: "Video Calls",   href: "video-calls",   icon: Video },
  { label: "Profile",       href: "profile",       icon: User },
];

export default function DashboardLayout({ children, role }) {
  const dispatch  = useAppDispatch();
  const router    = useRouter();
  const pathname  = usePathname();
  const { user, profile } = useAppSelector((s) => s.auth);
  const socket = useSocket();

  const [dark,       setDark]  = useState(false);
  const [open,       setOpen]  = useState(true);
  const [mob,        setMob]   = useState(false);
  const [msgCount,   setMsg]   = useState(0);
  const [notifCount, setNotif] = useState(0);
  const [callAlert,  setCall]  = useState(null);

  // Track latest unread sender so clicking the header badge
  // opens that specific conversation, not just the message list.
  const latestSenderRef = useRef(null);
  const pollRef         = useRef(null);

  // Dark mode init
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDark(d => !d);
  };

  // API polling: fetch unread counts + latest sender every 15 s
  const fetchCounts = useCallback(async () => {
    if (!user || !tok()) return;
    try {
      const nr = await fetch(`${API}/api/notifications?limit=1`, {
        credentials: "include", headers: H(),
      });
      if (nr.ok) {
        const nd = await nr.json();
        setNotif(nd.unreadCount ?? (nd.notifications || []).filter(n => !n.read).length);
      }
    } catch {}

    try {
      const mr = await fetch(`${API}/api/messages/contacts`, {
        credentials: "include", headers: H(),
      });
      if (mr.ok) {
        const md = await mr.json();
        const contacts = md.contacts || [];
        setMsg(contacts.reduce((s, c) => s + (c.unread || 0), 0));
        // Track latest unread sender for smart navigation
        const withUnread = contacts
          .filter(c => (c.unread || 0) > 0)
          .sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
        latestSenderRef.current = withUnread[0]?._id || null;
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchCounts();
    pollRef.current = setInterval(fetchCounts, 15_000);
    return () => clearInterval(pollRef.current);
  }, [user, fetchCounts]);

  // Socket: real-time increments on top of polling baseline
  useEffect(() => {
    if (!socket) return;
    if (socket.unreadMessages != null) setMsg(socket.unreadMessages);
    if (socket.unreadNotifs   != null) setNotif(socket.unreadNotifs);
  }, [socket?.unreadMessages, socket?.unreadNotifs]);

  useEffect(() => {
    if (!socket) return;
    return socket.addListener((type, data) => {
      if (type === "message") {
        setMsg(n => n + 1);
        if (data?.senderId) latestSenderRef.current = data.senderId;
        fetchCounts(); // re-sync sender list
      }
      if (type === "notification") setNotif(n => n + 1);
      if (type === "call")         setCall(data);
    });
  }, [socket, fetchCounts]);

  const config   = roleConfig[role] || roleConfig.client;
  const base     = `/dashboard/${role}`;
  const name     = profile?.full_name || user?.name || "User";
  const email    = profile?.email    || user?.email || "";
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const isActive = (href) => pathname === (href ? `${base}/${href}` : base);

  const go = (href) => {
    setMob(false);
    if (href === "messages")      { setMsg(0);    socket?.clearUnreadMessages?.(); }
    if (href === "notifications") { setNotif(0);  socket?.clearUnreadNotifs?.();  }
    router.push(href ? `${base}/${href}` : base);
    setTimeout(fetchCounts, 2000);
  };

  // Header message button: opens latest unread sender's chat
  const goMessages = () => {
    setMsg(0);
    socket?.clearUnreadMessages?.();
    router.push(
      latestSenderRef.current
        ? `${base}/messages?contact=${latestSenderRef.current}`
        : `${base}/messages`
    );
    setTimeout(fetchCounts, 2000);
  };

  // Header bell button
  const goNotifications = () => {
    setNotif(0);
    socket?.clearUnreadNotifs?.();
    router.push(`${base}/notifications`);
    setTimeout(fetchCounts, 2000);
  };

  const logout = async () => { await dispatch(logoutUser()); router.push("/"); };

  const getBadge = (k) => k === "msg" ? msgCount : k === "notif" ? notifCount : 0;

  const NavItem = ({ label, href, icon: Icon, badge: badgeKey }) => {
    const active = isActive(href);
    const count  = badgeKey ? getBadge(badgeKey) : 0;
    return (
      <button
        onClick={() => go(href)}
        style={{ backgroundColor: active ? ACT : "transparent", color: active ? "#fff" : "#94a3b8" }}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left hover:text-white"
        onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
      >
        <div className="relative shrink-0">
          <Icon className="w-4 h-4" />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </div>
        {open && (
          <>
            <span className="flex-1">{label}</span>
            {count > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  const SidebarInner = ({ forMobile = false }) => (
    <div className="flex flex-col h-full" style={{ overflow: "hidden" }}>
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }} className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden"
          style={{ backgroundColor: config.dot }}>
          {(profile?.profileImage || user?.profileImage)
            ? <img src={profile?.profileImage || user?.profileImage} alt={name} className="w-full h-full object-cover" onError={e => { e.target.style.display = "none"; }} />
            : initials}
        </div>
        {(open || forMobile) && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{name}</p>
            <p className="text-xs" style={{ color: "#60a5fa" }}>{config.label}</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        <div>
          {(open || forMobile) && <p className="text-xs font-semibold uppercase tracking-wider px-2 mb-2" style={{ color: "#475569" }}>Navigation</p>}
          <nav className="space-y-0.5">
            {navLinks.map(l => <NavItem key={l.label} {...l} />)}
          </nav>
        </div>
        <div>
          {(open || forMobile) && <p className="text-xs font-semibold uppercase tracking-wider px-2 mb-2" style={{ color: "#475569" }}>{config.toolsLabel}</p>}
          <nav className="space-y-0.5">
            {config.tools.map(l => <NavItem key={l.label} {...l} />)}
          </nav>
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }} className="p-3 space-y-0.5">
        <button onClick={toggleDark}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors w-full text-left">
          {dark ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {(open || forMobile) && (dark ? "Light Mode" : "Dark Mode")}
        </button>
        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors w-full text-left">
          <LogOut className="w-4 h-4 shrink-0" />
          {(open || forMobile) && "Logout"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: dark ? "#030712" : "#f1f5f9" }}>

      {mob && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMob(false)} />}

      <aside className={cn("fixed inset-y-0 left-0 z-50 w-64 flex flex-col lg:hidden transition-transform duration-300", mob ? "translate-x-0" : "-translate-x-full")}
        style={{ backgroundColor: NAVY }}>
        {/* Mobile drawer header — shrink-0 so it never squashes */}
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }} className="h-14 shrink-0 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: ACT }}>
              <span className="text-white font-bold text-xs">L</span>
            </div>
            <span className="text-base font-bold" style={{ color: "#93c5fd" }}>LawHelpZone</span>
          </div>
          <button onClick={() => setMob(false)} className="text-gray-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>
        {/* flex-1 min-h-0 — gives SidebarInner exactly the remaining height */}
        <div className="flex-1 min-h-0">
          <SidebarInner forMobile />
        </div>
      </aside>

      <aside className="hidden lg:flex flex-col shrink-0 sticky top-0 h-screen transition-all duration-300"
        style={{ backgroundColor: NAVY, width: open ? "256px" : "64px", overflow: "hidden" }}>
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }} className="h-14 shrink-0 flex items-center justify-between px-4">
          {open && <span className="text-base font-bold whitespace-nowrap truncate" style={{ color: "#93c5fd" }}>LawHelpZone</span>}
          <button onClick={() => setOpen(o => !o)}
            className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0">
            {open ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
        {/* flex-1 min-h-0 ensures SidebarInner fills remaining space without overflowing */}
        <div className="flex-1 min-h-0">
          <SidebarInner />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Header ── */}
        <header style={{ backgroundColor: NAVY, borderBottom: "1px solid rgba(255,255,255,0.1)" }}
          className="h-14 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shrink-0">

          <div className="flex items-center gap-3">
            <button onClick={() => setMob(true)} className="lg:hidden text-gray-300 hover:text-white">
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-semibold text-sm text-white capitalize">{config.label} Dashboard</span>
          </div>

          <div className="flex items-center gap-1">

            {/* Messages — opens the latest unread sender's chat */}
            <button
              onClick={goMessages}
              title={msgCount > 0 ? `${msgCount} unread message${msgCount !== 1 ? "s" : ""}` : "Messages"}
              className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <MessageSquare className="w-5 h-5 text-gray-300" />
              {msgCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center font-bold text-white rounded-full"
                  style={{ minWidth: 16, height: 16, fontSize: 9, padding: "0 3px", background: "#3b82f6", boxShadow: "0 1px 5px rgba(59,130,246,0.7)", animation: "badgePop .3s ease" }}>
                  {msgCount > 99 ? "99+" : msgCount}
                </span>
              )}
            </button>

            {/* Notifications */}
            <button
              onClick={goNotifications}
              title={notifCount > 0 ? `${notifCount} unread notification${notifCount !== 1 ? "s" : ""}` : "Notifications"}
              className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-300" />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center font-bold text-white rounded-full"
                  style={{ minWidth: 16, height: 16, fontSize: 9, padding: "0 3px", background: "#ef4444", boxShadow: "0 1px 5px rgba(239,68,68,0.7)", animation: "badgePop .3s ease" }}>
                  {notifCount > 99 ? "99+" : notifCount}
                </span>
              )}
            </button>

            <span className="text-xs hidden sm:inline ml-2" style={{ color: "#93c5fd" }}>{email}</span>
          </div>
        </header>

        {/* Incoming call banner */}
        {callAlert && (
          <div style={{ backgroundColor: NAVY2, borderBottom: "2px solid #2563eb" }}
            className="flex items-center justify-between px-6 py-3 shrink-0">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-blue-400 animate-pulse" />
              <span className="text-white text-sm font-medium">
                Incoming call from <strong>{callAlert.callerName || "a user"}</strong>
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { router.push(`${base}/video-calls?room=${callAlert.room}`); setCall(null); }}
                className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700">Answer</button>
              <button onClick={() => setCall(null)}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700">Decline</button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto pb-20 lg:pb-6" style={{ color: dark ? "#f9fafb" : "#111827" }}>
          {children}
        </main>

        {/* ── Mobile bottom tab bar — always visible, always accessible ── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
          style={{ backgroundColor: NAVY, borderTop: "1px solid rgba(255,255,255,0.12)", height: 60 }}>
          {[
            { label: "Home",    href: "",              icon: LayoutDashboard, badge: null },
            { label: "Chat",    href: "messages",      icon: MessageSquare,   badge: "msg" },
            { label: "Calls",   href: "video-calls",   icon: Video,           badge: null },
            { label: "Alerts",  href: "notifications", icon: Bell,            badge: "notif" },
            { label: "Profile", href: "profile",       icon: User,            badge: null },
          ].map(({ label, href, icon: Icon, badge: badgeKey }) => {
            const active = isActive(href);
            const count  = badgeKey ? getBadge(badgeKey) : 0;
            return (
              <button key={label} onClick={() => go(href)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all"
                style={{ color: active ? "#60a5fa" : "#64748b", background: "transparent", border: "none", cursor: "pointer" }}>
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center font-bold text-white rounded-full"
                      style={{ minWidth: 14, height: 14, fontSize: 8, padding: "0 2px", background: badgeKey === "notif" ? "#ef4444" : "#3b82f6" }}>
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 9, fontWeight: active ? 700 : 500 }}>{label}</span>
                {active && <div style={{ width: 16, height: 2, borderRadius: 2, background: "#60a5fa", marginTop: 1 }} />}
              </button>
            );
          })}
        </nav>
      </div>

      <style>{`
        @keyframes badgePop {
          0%   { transform: scale(0); }
          70%  { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}