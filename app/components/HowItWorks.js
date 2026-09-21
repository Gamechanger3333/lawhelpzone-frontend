"use client";
// app/how-it-works/page.jsx  (or components/HowItWorks.jsx)
import { Search, CheckCircle, Shield, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import LawyerSearchDropdown from "../components/LawyerSearchDropdown";
import { LEGAL_IMAGES } from "@/lib/images";

const steps = [
  { step: 1, title: "Search & Browse",    description: "Browse our database of verified lawyers by location, specialty, costs, profiles, reviews, and ratings.", icon: Search,      color: "bg-blue-500"   },
  { step: 2, title: "Connect & Consult",  description: "Schedule a free initial consultation and discuss your case with verified legal professionals.",          icon: Users,       color: "bg-green-500"  },
  { step: 3, title: "Hire & Collaborate", description: "Choose the right lawyer for your needs and work together securely through our platform.",               icon: CheckCircle, color: "bg-purple-500" },
  { step: 4, title: "Protected Service",  description: "Get comprehensive legal services with protected data and experience to help future clients.",             icon: Shield,      color: "bg-orange-500" },
];

const HowItWorks = () => {
  const router = useRouter();

  return (
    <div className="bg-white">
      {/* Hero banner — real photo background, no more plain white header */}
      <div style={{ position: "relative", overflow: "hidden", padding: "72px 24px 64px" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${LEGAL_IMAGES.lawBooks})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,26,63,0.92), rgba(10,26,63,0.86))" }} />
        <div className="text-center" style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
          <h2 className="text-4xl font-bold mb-4" style={{ color: "#fff" }}>How LawHelpZone Works</h2>
          <p className="text-xl" style={{ color: "rgba(255,255,255,0.8)" }}>
            Getting legal help has never been easier. Follow these simple steps
          </p>
          <p className="text-xl" style={{ color: "rgba(255,255,255,0.8)" }}>to connect with the right lawyer for your needs.</p>
        </div>
      </div>

      <div className="py-16 bg-white mt-0">
      <div className="bg-gray-50 max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                <step.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>

        {/* ── Live lawyer search ────────────────────────────────────────────── */}
        <div className="mt-14 max-w-2xl mx-auto">
          <p className="text-center text-gray-500 text-sm mb-3 font-medium">
            Try it now — search a real registered lawyer
          </p>
          <LawyerSearchDropdown
            redirectPath="/how-it-works"
            placeholder="Search by name, specialization, city…"
            limit={5}
            inputClassName="py-4 text-gray-800 text-base rounded-full bg-transparent"
            wrapperClassName="border border-gray-200 bg-white shadow-md rounded-full px-4"
          />
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => router.push("/browse-lawyers")}
            className="bg-blue-950 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition"
          >
            Get Started Today
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default HowItWorks;