"use client";
// app/search/page.jsx
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, Star, CheckCircle, Filter, Loader2, ChevronDown, MessageSquare, Video } from "lucide-react";
import { useProtectedAction } from "@/hooks/useProtectedAction";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") : null;

const CATEGORIES = [
  "All", "Criminal Law", "Family Law", "Business Law", "Real Estate",
  "Personal Injury", "Estate Planning", "Employment Law", "Tax Law",
  "Immigration Law", "Intellectual Property", "Civil Rights",
];

const SORT_OPTIONS = [
  { value: "rating",    label: "Highest Rated"  },
  { value: "newest",    label: "Newest First"    },
  { value: "fee_asc",   label: "Lowest Fee"      },
  { value: "fee_desc",  label: "Highest Fee"     },
];

export default function SearchPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { goToMessages, goToVideoCall } = useProtectedAction();

  const [query,    setQuery]    = useState(searchParams.get("query") || "");
  const [category, setCategory] = useState("All");
  const [sort,     setSort]     = useState("rating");
  const [lawyers,  setLawyers]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [hasMore,  setHasMore]  = useState(false);

  const fetchLawyers = useCallback(async (q, cat, s, p = 1, append = false) => {
    setLoading(true);
    try {
      // Use the same /api/lawyers endpoint as BrowseLawyersPage
      const params = new URLSearchParams({ limit: 12 });
      if (q)   params.set("search", q);
      if (cat && cat !== "All") params.set("specialization", cat);

      const res  = await fetch(`${API}/api/lawyers?${params}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
      });
      const data = await res.json();
      let list   = data.lawyers || (Array.isArray(data) ? data : []);
      const tot  = data.pagination?.total ?? list.length;

      // Client-side sort
      list.sort((a, b) => {
        if (s === "rating")   return (b.lawyerProfile?.rating || 0) - (a.lawyerProfile?.rating || 0);
        if (s === "fee_asc")  return (a.lawyerProfile?.consultationFee || 0) - (b.lawyerProfile?.consultationFee || 0);
        if (s === "fee_desc") return (b.lawyerProfile?.consultationFee || 0) - (a.lawyerProfile?.consultationFee || 0);
        if (s === "newest")   return new Date(b.createdAt) - new Date(a.createdAt);
        return 0;
      });

      setTotal(tot);
      setLawyers((prev) => append ? [...prev, ...list] : list);
      setHasMore(p * 12 < tot);
      setPage(p);
    } catch {
      setLawyers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q   = searchParams.get("query") || searchParams.get("search") || "";
    setQuery(q);
    fetchLawyers(q, category, sort, 1);
  }, [searchParams]);

  const handleSearch = (e) => {
    e?.preventDefault();
    router.push(`/search?query=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`);
  };

  const handleCategory = (cat) => { setCategory(cat); fetchLawyers(query, cat, sort, 1); };
  const handleSort     = (s)   => { setSort(s);        fetchLawyers(query, category, s, 1); };
  const loadMore       = ()    => fetchLawyers(query, category, sort, page + 1, true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar hero */}
      <div className="bg-[#0A1A3F] py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">
            {query ? `Search results for "${query}"` : "Browse Legal Professionals"}
          </h1>
          <p className="text-blue-200 text-sm mb-4">
            {!getToken() && "🔒 Login or sign up to message or call any lawyer"}
          </p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 flex items-center bg-white rounded-lg px-4 gap-2">
              <Search className="text-gray-400 w-4 h-4 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search lawyers, practice areas, location…"
                className="w-full py-3 text-gray-700 text-sm outline-none"
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="lg:w-56 shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Practice Area
              </h3>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => handleCategory(cat)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors font-medium ${category === cat ? "bg-blue-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <p className="text-sm text-gray-600">
                {loading ? "Searching…" : `${total} registered lawyer${total !== 1 ? "s" : ""} found`}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort:</span>
                <div className="relative">
                  <select value={sort} onChange={(e) => handleSort(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-white outline-none cursor-pointer">
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Login notice for guests */}
            {!getToken() && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
                <span className="text-lg">🔒</span>
                <span className="text-amber-800">
                  <strong>Login required to contact lawyers.</strong>{" "}
                  <button onClick={() => router.push("/auth/login?redirect=/search")} className="text-blue-600 font-semibold underline bg-transparent border-none cursor-pointer">Sign in</button>
                  {" or "}
                  <button onClick={() => router.push("/auth/signup?redirect=/search")} className="text-blue-600 font-semibold underline bg-transparent border-none cursor-pointer">create a free account</button>
                  {" to message or call any lawyer."}
                </span>
              </div>
            )}

            {loading && lawyers.length === 0 ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : lawyers.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-700 mb-2">No lawyers found</h3>
                <p className="text-sm text-gray-500">Try adjusting your search or category filter</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {lawyers.map((lawyer) => {
                    const lp      = lawyer.lawyerProfile || {};
                    const name    = lawyer.name || "Lawyer";
                    const spec    = lp.specializations?.[0] || lp.specialization || "Legal Expert";
                    const city    = lawyer.city || lp.city || "";
                    const rating  = parseFloat(lp.rating) || 0;
                    const reviews = lp.totalReviews || 0;
                    const fee     = lp.consultationFee;
                    const isAvail = lp.isAvailable !== false;

                    return (
                      <div key={lawyer._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            {lawyer.profileImage
                              ? <img src={lawyer.profileImage} alt={name} className="w-14 h-14 rounded-full object-cover border-2 border-gray-100" />
                              : <div className="w-14 h-14 rounded-full bg-[#0A1A3F] text-white font-bold text-lg flex items-center justify-center border-2 border-gray-100">{name.charAt(0)}</div>}
                            {isAvail && <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div>
                                <h3 className="font-semibold text-gray-900 text-sm">{name}</h3>
                                <p className="text-xs text-blue-600 font-medium mt-0.5">{spec}</p>
                              </div>
                              {lawyer.verified && (
                                <span className="shrink-0 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Verified
                                </span>
                              )}
                            </div>

                            {city && (
                              <div className="flex items-center text-xs text-gray-500 mt-1.5 gap-1">
                                <MapPin className="w-3 h-3" />{city}
                              </div>
                            )}

                            {rating > 0 && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                <span className="text-xs font-semibold">{rating.toFixed(1)}</span>
                                {reviews > 0 && <span className="text-xs text-gray-400">({reviews})</span>}
                              </div>
                            )}

                            {(lp.specializations || []).length > 1 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {lp.specializations.slice(0, 2).map((s, i) => (
                                  <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s}</span>
                                ))}
                              </div>
                            )}

                            {/* Fee + Protected contact buttons */}
                            <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                              {fee
                                ? <span className="text-sm font-bold text-gray-900">PKR {Number(fee).toLocaleString()}</span>
                                : <span className="text-xs font-bold text-green-600">Free Consultation</span>}

                              <div className="flex gap-1.5 ml-auto">
                                <button
                                  onClick={() => goToMessages(lawyer._id, "/search")}
                                  title="Login required to message"
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0A1A3F] text-white text-xs font-semibold hover:bg-blue-900 transition-colors">
                                  <MessageSquare size={11} /> Msg
                                </button>
                                <button
                                  onClick={() => goToVideoCall(lawyer._id, "/search")}
                                  title="Login required to call"
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 text-green-600 border border-green-200 text-xs font-semibold hover:bg-green-100 transition-colors">
                                  <Video size={11} /> Call
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hasMore && (
                  <div className="text-center mt-8">
                    <button onClick={loadMore} disabled={loading}
                      className="px-8 py-3 border-2 border-blue-900 text-blue-900 font-semibold rounded-lg hover:bg-blue-900 hover:text-white transition-colors disabled:opacity-50">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Load More"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}