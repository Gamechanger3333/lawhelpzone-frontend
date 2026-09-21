"use client";
// app/components/HeroSection.jsx
import { ShieldCheck, Users, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import LawyerSearchDropdown from "./LawyerSearchDropdown";
import { LEGAL_IMAGES } from "@/lib/images";

const HeroSection = () => {
  const router = useRouter();

  return (
    <div className="text-white relative overflow-hidden">
      {/* Real photo background, dimmed under the navy so text stays crisp */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${LEGAL_IMAGES.courthouse})`,
          backgroundSize: "cover", backgroundPosition: "center",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(10,26,63,0.96) 0%, rgba(10,26,63,0.93) 45%, rgba(10,26,63,0.8) 100%)" }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 min-h-[700px] sm:min-h-[750px] lg:min-h-[600px] flex flex-col lg:flex-row items-center relative">

        {/* Left Content */}
        <div className="lg:w-1/2 max-w-xl flex flex-col justify-center text-center lg:text-left z-10 pb-64 sm:pb-80 lg:pb-0">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
            Find the Right Legal Expert for Your Case
          </h1>
          <p className="text-base sm:text-lg lg:text-xl mb-8 text-blue-100">
            Connect with verified lawyers and legal professionals. Get expert
            legal help for any situation, from consultations to full representation.
          </p>

          {/* ── Live lawyer search (shared component) ────────────────────── */}
          <div className="mb-6">
            <LawyerSearchDropdown
              theme="dark"
              redirectPath="/browse-lawyers"
              placeholder="Search by name, specialization, city…"
              limit={6}
              inputClassName="py-3 sm:py-4 text-blue-950 rounded-full bg-white text-base sm:text-lg shadow-md focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Quick-filter chips */}
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-8">
            {["Criminal Law", "Family Law", "Business Law", "Real Estate", "Tax Law"].map((cat) => (
              <button
                key={cat}
                onClick={() => router.push(`/browse-lawyers?spec=${encodeURIComponent(cat)}`)}
                className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-blue-100 border border-white/20 transition-colors font-medium"
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-6 sm:gap-8">
            {[
              { Icon: ShieldCheck, val: "500+",    label: "Verified Lawyers" },
              { Icon: Users,       val: "10,000+", label: "Happy Clients"    },
              { Icon: Award,       val: "4.9/5",   label: "Average Rating"   },
            ].map(({ Icon, val, label }) => (
              <div key={label} className="flex items-center space-x-2 sm:space-x-3">
                <Icon className="text-blue-300" size={24} />
                <div>
                  <div className="text-lg sm:text-xl font-bold">{val}</div>
                  <div className="text-blue-200 text-xs sm:text-sm">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side — real photo, framed */}
        <div className="absolute bottom-0 left-1/2 lg:left-auto lg:right-0 -translate-x-1/2 lg:translate-x-0 w-full lg:w-1/2 flex justify-center lg:justify-end pointer-events-none px-4 lg:px-0">
          <div style={{
            width: "min(440px, 90%)", borderRadius: 20, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 24px 60px -12px rgba(0,0,0,0.5)",
            marginBottom: 24,
          }}>
            <img
              src={LEGAL_IMAGES.handshake}
              alt="Lawyer and client shaking hands after reaching an agreement"
              style={{ width: "100%", height: 340, objectFit: "cover", display: "block" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;