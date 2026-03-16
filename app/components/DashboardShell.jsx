"use client";
// components/DashboardShell.jsx

import Link                               from "next/link";
import { useDispatch, useSelector }       from "react-redux";
import { useRouter }                      from "next/navigation";
import { useEffect }                      from "react";
import { logoutUser }                     from "@/store/slices/authSlice";
import { resetChat, fetchContacts }       from "@/store/slices/chatSlice";
import { fetchNotifications }             from "@/store/slices/notificationSlice";
import { useSocket }                      from "@/hooks/useSocket";
import NotificationBell                   from "./NotificationBell";

export default function DashboardShell({ role, navItems, currentPath, children }) {
  const dispatch       = useDispatch();
  const router         = useRouter();
  const user           = useSelector((s) => s.auth.user);
  const unreadMessages = useSelector((s) =>
    (s.chat.contacts || []).reduce((sum, c) => sum + (c.unread || 0), 0)
  );

  useSocket();

  useEffect(() => {
    dispatch(fetchContacts());
    dispatch(fetchNotifications({ page: 1, limit: 15 }));
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    dispatch(resetChat());
    router.push("/auth/login");
  };

  const initials = (name) =>
    name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

  // ── Payment nav items injected per role ──────────────────────────────────
  // These are appended to whatever navItems the parent passes in.
  const paymentNavItems =
    role === "client"
      ? [{ href: `/dashboard/client/payments`,    icon: "💳", label: "Payments" }]
      : role === "lawyer"
      ? [
          { href: `/dashboard/lawyer/earnings`,     icon: "💰", label: "Earnings" },
          { href: `/dashboard/lawyer/stripe-setup`, icon: "🔗", label: "Stripe Setup" },
        ]
      : role === "admin"
      ? [{ href: `/dashboard/admin/payments`,       icon: "💳", label: "Payments" }]
      : [];

  const allNavItems = [...navItems, ...paymentNavItems];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <Link href={`/dashboard/${role}`} className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-sm">LawHelpZone</span>
          </Link>
        </div>

        {/* Role badge */}
        <div className="px-5 py-2.5 border-b border-gray-50">
          <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded 
            ${role === "admin" ? "bg-red-50 text-red-600" : role === "lawyer" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
            {role}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          {allNavItems.map((item) => {
            const isActive = currentPath === item.href || currentPath?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all
                  ${isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.label === "Messages" && unreadMessages > 0 && (
                  <span className="bg-blue-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User card + logout */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.profileImage
                ? <img src={user.profileImage} className="w-full h-full rounded-full object-cover" alt="" />
                : initials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} title="Logout" className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-gray-500">
            {allNavItems.find((n) => currentPath === n.href || currentPath?.startsWith(n.href + "/"))?.label || "Dashboard"}
          </div>

          <div className="flex items-center gap-1">
            <Link
              href={`/dashboard/${role}/messages`}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={`Messages${unreadMessages > 0 ? ` (${unreadMessages} unread)` : ""}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                  {unreadMessages > 99 ? "99+" : unreadMessages}
                </span>
              )}
            </Link>

            <NotificationBell role={role} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}