"use client";
// app/components/Header.jsx
import { useState, useEffect } from "react";
import { Menu, X, Bell, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "../../store/index";
import { logoutUser } from "../../store/slices/authSlice";
import { useSocket } from "./SocketProvider";
import ThemeToggle from "./ThemeToggle";
import LawyerSearchDropdown from "./LawyerSearchDropdown";
import { useProtectedAction } from "@/hooks/useProtectedAction";

const Header = () => {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const { user, profile, initialized } = useAppSelector((s) => s.auth);
  const socket = useSocket?.();
  const { requireAuth } = useProtectedAction();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [msgCount,   setMsg]        = useState(0);
  const [notifCount, setNotif]      = useState(0);

  useEffect(() => {
    if (socket) {
      setMsg(socket.unreadMessages);
      setNotif(socket.unreadNotifs);
    }
  }, [socket?.unreadMessages, socket?.unreadNotifs]);

  const handleSignOut = async () => {
    await dispatch(logoutUser());
    router.push("/");
    setMobileOpen(false);
  };

  // Notifications & messages require login
  const handleProtectedNav = (dest) => {
    requireAuth(
      (role) => {
        router.push(`/dashboard/${role}/${dest}`);
        setMobileOpen(false);
      },
      `/${dest}`
    );
  };

  const displayName = profile?.full_name || user?.name || "";
  const dashPath    = user ? `/dashboard/${user.role || profile?.role}` : null;

  return (
    <nav
      style={{
        background:   "var(--header-bg, #ffffff)",
        borderBottom: "1px solid var(--border-color, #e2e8f0)",
        transition:   "background 0.3s, border-color 0.3s",
      }}
      className="font-semibold shadow-md sticky top-0 z-50"
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">

          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-blue-900 dark:text-blue-950 whitespace-nowrap shrink-0">
            LawHelpZone
          </Link>

          {/* ── Header search (shared component) ─────────────────────────── */}
          <div className="hidden sm:flex flex-1 max-w-2xl">
            <LawyerSearchDropdown
              redirectPath="/browse-lawyers"
              placeholder="Search for legal services…"
              limit={5}
              inputClassName="py-2 text-sm font-normal rounded-lg bg-transparent"
              wrapperClassName="border border-[var(--border-color,#e2e8f0)] bg-[var(--input-bg,#ffffff)] rounded-lg px-3"
            />
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-5 shrink-0">
            <Link href="/browse-lawyers"  style={{ color: "var(--text-heading,#0f172a)" }} className="hover:text-blue-600 text-sm">Browse</Link>
            <Link href="/how-it-works"    style={{ color: "var(--text-heading,#0f172a)" }} className="hover:text-blue-600 text-sm">How it Works</Link>
            <Link href="/become-a-lawyer" style={{ color: "var(--text-heading,#0f172a)" }} className="hover:text-blue-600 text-sm">Become a Lawyer</Link>

            <ThemeToggle />

            {/* Notifications — login required */}
            <button
              onClick={() => handleProtectedNav("notifications")}
              className="relative hover:text-blue-600 transition-colors"
              style={{ color: "var(--text-muted,#64748b)" }}
              title={user ? "Notifications" : "Login to view notifications"}
            >
              <Bell className="w-5 h-5" />
              {notifCount > 0 && user && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </button>

            {/* Messages — login required */}
            <button
              onClick={() => handleProtectedNav("messages")}
              className="relative hover:text-blue-600 transition-colors"
              style={{ color: "var(--text-muted,#64748b)" }}
              title={user ? "Messages" : "Login to view messages"}
            >
              <MessageCircle className="w-5 h-5" />
              {msgCount > 0 && user && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {msgCount > 9 ? "9+" : msgCount}
                </span>
              )}
            </button>

            {/* Auth */}
            {initialized && (
              user ? (
                <div className="flex items-center gap-3">
                  <Link href={dashPath} className="text-sm font-medium hover:text-blue-600" style={{ color: "var(--text-heading,#0f172a)" }}>
                    Hi, {displayName.split(" ")[0]}
                  </Link>
                  <button onClick={handleSignOut} className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 font-medium">
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/auth/login" className="text-sm hover:text-blue-600" style={{ color: "var(--text-heading,#0f172a)" }}>
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="bg-blue-950 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-800 font-medium">
                    Join
                  </Link>
                </div>
              )
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden" style={{ color: "var(--text-heading,#0f172a)" }} onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ──────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden border-t shadow-lg"
          style={{ background: "var(--card-bg,#ffffff)", borderColor: "var(--border-color,#e2e8f0)" }}
        >
          <div className="p-4 flex flex-col space-y-3">
            {/* Mobile search */}
            <LawyerSearchDropdown
              redirectPath="/browse-lawyers"
              placeholder="Search legal services…"
              limit={5}
              inputClassName="py-2 text-sm rounded-lg bg-transparent"
              wrapperClassName="border border-[var(--border-color,#e2e8f0)] bg-[var(--input-bg,#ffffff)] rounded-lg px-3"
            />

            <Link href="/browse-lawyers"  className="font-medium text-sm py-1 hover:text-blue-600" style={{ color: "var(--text-heading,#0f172a)" }} onClick={() => setMobileOpen(false)}>Browse</Link>
            <Link href="/how-it-works"    className="font-medium text-sm py-1 hover:text-blue-600" style={{ color: "var(--text-heading,#0f172a)" }} onClick={() => setMobileOpen(false)}>How it Works</Link>
            <Link href="/become-a-lawyer" className="font-medium text-sm py-1 hover:text-blue-600" style={{ color: "var(--text-heading,#0f172a)" }} onClick={() => setMobileOpen(false)}>Become a Lawyer</Link>

            <button onClick={() => handleProtectedNav("notifications")}
              className="flex items-center gap-2 font-medium text-sm py-1 text-left hover:text-blue-600"
              style={{ color: "var(--text-heading,#0f172a)" }}>
              <Bell className="w-4 h-4" /> Notifications
              {notifCount > 0 && user && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{notifCount}</span>}
            </button>

            <button onClick={() => handleProtectedNav("messages")}
              className="flex items-center gap-2 font-medium text-sm py-1 text-left hover:text-blue-600"
              style={{ color: "var(--text-heading,#0f172a)" }}>
              <MessageCircle className="w-4 h-4" /> Messages
              {msgCount > 0 && user && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{msgCount}</span>}
            </button>

            {/* Theme toggle */}
            <div className="flex items-center justify-between py-1" style={{ borderTop: "1px solid var(--border-color,#e2e8f0)", paddingTop: 10 }}>
              <span className="font-medium text-sm" style={{ color: "var(--text-heading,#0f172a)" }}>Dark Mode</span>
              <ThemeToggle />
            </div>

            {initialized && (user ? (
              <>
                <Link href={dashPath} className="font-medium text-sm py-1 hover:text-blue-600" style={{ color: "var(--text-heading,#0f172a)" }} onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
                <button onClick={handleSignOut} className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium text-left">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="font-medium text-sm py-1 hover:text-blue-600" style={{ color: "var(--text-heading,#0f172a)" }} onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
                <Link href="/auth/signup" className="bg-blue-950 text-white px-4 py-2 rounded-md text-sm font-medium text-center" onClick={() => setMobileOpen(false)}>
                  Join
                </Link>
              </>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;