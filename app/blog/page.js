// =====================================================
// BLOG PAGE  →  app/blog/page.jsx
// =====================================================
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, Search, Tag } from "lucide-react";

export function BlogPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const categories = ["all", "Legal Tips", "Platform Updates", "Industry News", "Lawyer Spotlights", "Case Studies"];

  const posts = [
    { id: 1, title: "5 Things to Do Immediately After a Car Accident", category: "Legal Tips", excerpt: "A car accident is stressful. Knowing these five steps could protect your legal rights and strengthen your claim.", date: "Feb 28, 2025", readTime: "5 min read", emoji: "🚗", featured: true },
    { id: 2, title: "How We Verify Every Lawyer on LawHelpZone", category: "Platform Updates", excerpt: "Our thorough verification process ensures that every lawyer on the platform is genuinely licensed and in good standing.", date: "Feb 21, 2025", readTime: "4 min read", emoji: "🔍", featured: true },
    { id: 3, title: "Understanding Your Rights as a Tenant: 2025 Guide", category: "Legal Tips", excerpt: "Tenant rights vary by jurisdiction, but there are universal principles every renter should know.", date: "Feb 15, 2025", readTime: "8 min read", emoji: "🏠", featured: false },
    { id: 4, title: "Meet Sarah: The Lawyer Who Serves Clients Across 3 Countries", category: "Lawyer Spotlights", excerpt: "International family law attorney Sarah Ahmed shares how LawHelpZone changed the way she practices.", date: "Feb 10, 2025", readTime: "6 min read", emoji: "⚖️", featured: false },
    { id: 5, title: "LawHelpZone Launches AI-Assisted Case Matching", category: "Platform Updates", excerpt: "Our new matching algorithm now factors in 47 signals to connect clients with the most relevant lawyers.", date: "Feb 3, 2025", readTime: "3 min read", emoji: "🤖", featured: false },
    { id: 6, title: "How a Small Business Owner Won a Trademark Dispute", category: "Case Studies", excerpt: "A real success story: how James connected with an IP specialist and recovered his brand name in 6 weeks.", date: "Jan 27, 2025", readTime: "7 min read", emoji: "💼", featured: false },
    { id: 7, title: "Global Legal Tech Market to Reach $37B by 2030", category: "Industry News", excerpt: "New research from Gartner shows the legal tech sector is growing 12% annually, driven by marketplace platforms.", date: "Jan 20, 2025", readTime: "4 min read", emoji: "📊", featured: false },
    { id: 8, title: "Your Employment Rights: What Every Worker Should Know", category: "Legal Tips", excerpt: "From wrongful termination to wage disputes — a primer on employment law fundamentals.", date: "Jan 13, 2025", readTime: "9 min read", emoji: "👷", featured: false },
    { id: 9, title: "We Raised $24M in Series B — Here's What's Next", category: "Platform Updates", excerpt: "Our Series B will fund expansion into North America and Southeast Asia, plus new platform features.", date: "Jan 6, 2025", readTime: "5 min read", emoji: "🚀", featured: false },
  ];

  const filtered = posts.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "all" || p.category === category;
    return matchSearch && matchCategory;
  });

  const featured = filtered.filter((p) => p.featured);
  const regular = filtered.filter((p) => !p.featured);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .post-card { background:white; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; transition:all 0.3s ease; cursor:pointer; }
        .post-card:hover { transform:translateY(-6px); box-shadow:0 16px 48px rgba(0,0,0,0.1); }
        .cat-chip { padding:7px 16px; border-radius:50px; font-size:13px; font-weight:500; cursor:pointer; border:1.5px solid transparent; transition:all 0.2s; }
        .cat-chip.active { background:#0A1A3F; color:white; }
        .cat-chip:not(.active) { background:white; color:#64748b; border-color:#e2e8f0; }
        .cat-chip:not(.active):hover { border-color:#0A1A3F; color:#0A1A3F; }
      `}</style>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0A1A3F, #1e3a6e)", color: "white", padding: "60px 24px 48px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", animation: "fadeUp 0.6s ease" }}>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, marginBottom: 12 }}>Legal <em style={{ color: "#34d399" }}>Insights</em></h1>
          <p style={{ opacity: 0.75, fontSize: 17, lineHeight: 1.7, maxWidth: 500, marginBottom: 28 }}>
            Practical legal knowledge, platform updates, and stories from our community.
          </p>
          <div style={{ position: "relative", maxWidth: 400 }}>
            <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.5)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search articles..."
              style={{ width: "100%", padding: "11px 14px 11px 40px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, color: "white", fontSize: 14, outline: "none" }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px" }}>

        {/* Category Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 36, flexWrap: "wrap" }}>
          {categories.map((c) => (
            <button key={c} className={`cat-chip ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>
              {c === "all" ? "All Posts" : c}
            </button>
          ))}
        </div>

        {/* Featured Posts */}
        {featured.length > 0 && category === "all" && !search && (
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 20, color: "#0A1A3F" }}>Featured</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              {featured.map((post) => (
                <div key={post.id} className="post-card" onClick={() => router.push(`/blog/${post.id}`)}>
                  <div style={{ background: "linear-gradient(135deg, #0A1A3F, #1e3a6e)", padding: "32px 28px", textAlign: "center", fontSize: 52 }}>{post.emoji}</div>
                  <div style={{ padding: "24px 24px 28px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "3px 10px", borderRadius: 50, fontSize: 11, fontWeight: 600 }}>{post.category}</span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{post.date}</span>
                    </div>
                    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: "#0A1A3F", marginBottom: 10, lineHeight: 1.3 }}>{post.title}</h3>
                    <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 16 }}>{post.excerpt}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#3b82f6", fontSize: 13, fontWeight: 600 }}>
                      <Clock size={12} /> {post.readTime} <ArrowRight size={13} style={{ marginLeft: 4 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular Posts */}
        <div>
          {!search && category === "all" && <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 20, color: "#0A1A3F" }}>Latest</h2>}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 24px", color: "#94a3b8" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <p style={{ fontSize: 16, fontWeight: 500 }}>No articles found</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {(search || category !== "all" ? filtered : regular).map((post) => (
                <div key={post.id} className="post-card" onClick={() => router.push(`/blog/${post.id}`)}>
                  <div style={{ background: `linear-gradient(135deg, ${["#f0fdf4","#eff6ff","#fef3c7","#fdf2f8","#f0f9ff"][post.id % 5]}, ${["#d1fae5","#dbeafe","#fde68a","#fce7f3","#bae6fd"][post.id % 5]})`, padding: "24px 20px", textAlign: "center", fontSize: 40 }}>{post.emoji}</div>
                  <div style={{ padding: "20px 20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                      <span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 50, fontSize: 11, fontWeight: 600 }}>{post.category}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{post.date}</span>
                    </div>
                    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: "#0A1A3F", marginBottom: 8, lineHeight: 1.35 }}>{post.title}</h3>
                    <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.6, marginBottom: 14 }}>{post.excerpt}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#3b82f6", fontSize: 12.5, fontWeight: 600 }}>
                      <Clock size={11} /> {post.readTime}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BlogPage;