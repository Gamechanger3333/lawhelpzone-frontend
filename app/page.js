import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import LegalServices from "./components/LegalServices";
import FeaturedExperts from "./components/FeaturedExperts";
import HowItWorks from "./components/HowItWorks";
import ClientTestimonial from "./components/ClientTestimonials";
import Footer from "./components/Footer";

export const metadata = {
  title: "LawHelpZone — Find a Lawyer Online | Legal Help Platform",
  description:
    "Connect with verified lawyers for business, family, criminal, immigration, and more. Get legal help online — fast, secure, and affordable.",
  alternates: {
    canonical: "https://www.lawhelpzone.com",
  },
  openGraph: {
    title: "LawHelpZone — Find a Lawyer Online",
    description:
      "Connect with verified lawyers for business, family, criminal, and immigration law.",
    url: "https://www.lawhelpzone.com",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function HomePage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--page-bg, #f8fafc)",
        color: "var(--text-primary, #374151)",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <Header />
      <main>
        <HeroSection />
        <LegalServices />
        <FeaturedExperts />
        <HowItWorks />
        <ClientTestimonial />
      </main>
      <Footer />
    </div>
  );
}