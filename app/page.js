"use client";

import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import LegalServices from "./components/LegalServices";
import FeaturedExperts from "./components/FeaturedExperts";
import HowItWorks from "./components/HowItWorks";
import ClientTestimonial from "./components/ClientTestimonials";
import Footer from "./components/Footer";

export default function Page() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--page-bg, #f8fafc)",
        color:      "var(--text-primary, #374151)",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <Header />
      <HeroSection />
      <LegalServices />
      <FeaturedExperts />
      <HowItWorks />
      <ClientTestimonial />
      <Footer />
    </div>
  );
}