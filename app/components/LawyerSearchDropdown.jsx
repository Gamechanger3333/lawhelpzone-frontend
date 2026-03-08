"use client";
// components/LawyerSearchDropdown.jsx
// Reusable live-search dropdown that fetches real registered lawyers
// and shows protected Message / Call buttons on each result.
// Used by: HeroSection, Header, HowItWorks, BecomeALawyer, BrowseLawyers, SearchPage

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Star, MapPin, MessageSquare, Video, Loader2 } from "lucide-react";
import { useProtectedAction } from "@/hooks/useProtectedAction"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

/**
 * Props:
 *  inputClassName   – extra classes for the <input>
 *  wrapperClassName – extra classes for the outer wrapper div
 *  placeholder      – input placeholder text
 *  redirectPath     – page to return to after login (e.g. "/browse-lawyers")
 *  onSearch         – optional callback(query) when user submits search
 *  autoFocus        – boolean
 *  theme            – "light" | "dark"  (dark = white text input for hero sections)
 *  limit            – how many suggestions to fetch (default 6)
 */
export default function LawyerSearchDropdown({
  inputClassName   = "",
  wrapperClassName = "",
  placeholder      = "Search by name, specialization, city…",
  redirectPath     = "/browse-lawyers",
  onSearch,
  autoFocus        = false,
  theme            = "light",
  limit            = 6,
}) {
  const router = useRouter();
  const { goToMessages, goToVideoCall } = useProtectedAction();

  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [showDrop,    setShowDrop]    = useState(false);

  const wrapRef = useRef(null);
  const debRef  = useRef(null);

  /* ── Debounced fetch ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);

    if (!query.trim()) {
      setResults([]);
      setShowDrop(false);
      return;
    }

    debRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ search: query.trim(), limit });
        const r = await fetch(`${API}/api/lawyers?${params}`, {
          credentials: "include",
          headers: authHeaders(),
        });
        if (r.ok) {
          const d    = await r.json();
          const list = d.lawyers || (Array.isArray(d) ? d : []);
          setResults(list);
          setShowDrop(true);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query, limit]);

  /* ── Close on outside click ──────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Handlers ────────────────────────────────────────────────────────────── */
  const handleSubmit = (e) => {
    e?.preventDefault();
    setShowDrop(false);
    if (onSearch) {
      onSearch(query);
    } else {
      router.push(
        query.trim()
          ? `/browse-lawyers?search=${encodeURIComponent(query.trim())}`
          : "/browse-lawyers"
      );
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowDrop(false);
  };

  const isDark = theme === "dark";

  /* ── Render ──────────────────────────────────────────────────────────────── */
  return (
    <div ref={wrapRef} className={`relative w-full ${wrapperClassName}`}>
      {/* Search input row */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <Search
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10"
          style={{ color: isDark ? "#9ca3af" : "#9ca3af" }}
        />
        <input
          type="text"
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDrop(true)}
          className={`w-full pl-11 pr-24 outline-none ${inputClassName}`}
        />
        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-20 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={14} />
          </button>
        )}
        {/* Submit button */}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-colors"
        >
          Search
        </button>
      </form>

      {/* ── Dropdown ─────────────────────────────────────────────────────────── */}
      {showDrop && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[999]">
          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 px-4 py-4 text-gray-400 text-sm">
              <Loader2 size={15} className="animate-spin" />
              Searching registered lawyers…
            </div>
          )}

          {/* No results */}
          {!loading && results.length === 0 && (
            <div className="px-4 py-4 text-gray-400 text-sm">
              No registered lawyers found for "{query}"
            </div>
          )}

          {/* Results */}
          {!loading && results.length > 0 && (
            <>
              {/* Header hint */}
              <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Registered Lawyers
                </span>
                <span className="text-xs text-orange-500 font-medium">
                  🔒 Login required to contact
                </span>
              </div>

              {results.map((lawyer) => {
                const lp      = lawyer.lawyerProfile || {};
                const name    = lawyer.name || "Lawyer";
                const spec    = lp.specializations?.[0] || lp.specialization || "General Law";
                const rating  = lp.rating || 0;
                const isAvail = lp.isAvailable !== false;

                return (
                  <div
                    key={lawyer._id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-gray-100">
                      {lawyer.profileImage ? (
                        <img
                          src={lawyer.profileImage}
                          alt={name}
                          className="w-10 h-10 object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#0A1A3F] text-white font-bold flex items-center justify-center text-sm">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Online dot */}
                      {isAvail && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
                      <p className="text-xs text-blue-600 font-medium truncate">{spec}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {rating > 0 && (
                          <span className="flex items-center gap-1 text-xs text-yellow-500 font-semibold">
                            <Star size={10} fill="currentColor" />
                            {rating}
                          </span>
                        )}
                        {(lawyer.city || lp.city) && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin size={10} />
                            {lawyer.city || lp.city}
                          </span>
                        )}
                        {lp.consultationFee ? (
                          <span className="text-xs font-bold text-gray-700">
                            PKR {Number(lp.consultationFee).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-green-600">Free</span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons — redirect to login if unauthenticated */}
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setShowDrop(false);
                          goToMessages(lawyer._id, redirectPath);
                        }}
                        title="Message this lawyer (login required)"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0A1A3F] text-white text-xs font-semibold hover:bg-blue-900 transition-colors"
                      >
                        <MessageSquare size={11} />
                        <span className="hidden sm:inline">Msg</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowDrop(false);
                          goToVideoCall(lawyer._id, redirectPath);
                        }}
                        title="Video call this lawyer (login required)"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 text-green-600 border border-green-200 text-xs font-semibold hover:bg-green-100 transition-colors"
                      >
                        <Video size={11} />
                        <span className="hidden sm:inline">Call</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* View all footer */}
              <button
                onClick={handleSubmit}
                className="w-full py-3 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-100"
              >
                View all results for "{query}" →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}