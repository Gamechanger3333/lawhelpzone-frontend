"use client";
// hooks/useProtectedAction.js
// Single source of truth for auth-gated lawyer contact actions.
// Used by: HeroSection, Header, HowItWorks, BecomeALawyer, BrowseLawyers, SearchPage
import { useRouter } from "next/navigation";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

const getRole = () => {
  try {
    const persisted = localStorage.getItem("persist:auth");
    if (!persisted) return null;
    const auth = JSON.parse(persisted);
    const user = JSON.parse(auth.user || "null");
    return user?.role || null;
  } catch {
    return null;
  }
};

export function useProtectedAction() {
  const router = useRouter();

  const isLoggedIn = () => !!getToken();

  /**
   * Run `action(role)` if logged in, otherwise redirect to login.
   * @param {Function} action   - called with the user's role
   * @param {string}   redirect - path to return to after login (default: current page)
   */
  const requireAuth = (action, redirect) => {
    const token = getToken();
    const role  = getRole();

    if (!token || !role) {
      const dest =
        redirect ||
        (typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/");
      router.push(`/auth/login?redirect=${encodeURIComponent(dest)}`);
      return;
    }

    action(role);
  };

  /** Go to dashboard messages with a specific lawyer pre-selected */
  const goToMessages = (lawyerId, redirect) =>
    requireAuth(
      (role) => router.push(`/dashboard/${role}/messages?contact=${lawyerId}`),
      redirect
    );

  /** Go to dashboard video-calls with a specific lawyer pre-selected */
  const goToVideoCall = (lawyerId, redirect) =>
    requireAuth(
      (role) => router.push(`/dashboard/${role}/video-calls?contact=${lawyerId}`),
      redirect
    );

  return { requireAuth, goToMessages, goToVideoCall, isLoggedIn };
}