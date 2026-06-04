"use client";
// hooks/useProtectedAction.js
// Auth-gated actions for lawyer contact buttons across all pages.
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

export function useProtectedAction() {
  const router = useRouter();
  const user   = useSelector((state) => state.auth.user);

  const requireAuth = (action, redirect) => {
    if (!user) {
      const dest = redirect || (typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/");
      router.push(`/auth/login?redirect=${encodeURIComponent(dest)}`);
      return;
    }
    action(user.role);
  };

  const goToMessages  = (lawyerId, redirect) =>
    requireAuth((role) => router.push(`/dashboard/${role}/messages?contact=${lawyerId}`), redirect);

  const goToVideoCall = (lawyerId, redirect) =>
    requireAuth((role) => router.push(`/dashboard/${role}/video-calls?contact=${lawyerId}`), redirect);

  return {
    requireAuth,
    goToMessages,
    goToVideoCall,
    isLoggedIn: !!user,
  };
}