"use client";

import { useRouter } from "next/navigation";
import {
  Scale,
  Heart,
  Briefcase,
  Home,
  Car,
  FileText,
  DollarSign,
  Users,
} from "lucide-react";

const services = [
  {
    icon: Scale,
    name: "Criminal Law",
    desc: "Criminal defense and legal representation",
    services: "1,200+ services",
    color: "bg-red-50 border-red-200",
    searchTerm: "criminal",
  },
  {
    icon: Heart,
    name: "Family Law",
    desc: "Divorce, custody, and family matters",
    services: "890+ services",
    color: "bg-pink-50 border-pink-200",
    searchTerm: "family",
  },
  {
    icon: Briefcase,
    name: "Business Law",
    desc: "Corporate law and business legal services",
    services: "1,500+ services",
    color: "bg-blue-50 border-blue-200",
    searchTerm: "business",
  },
  {
    icon: Home,
    name: "Real Estate",
    desc: "Property law and real estate transactions",
    services: "750+ services",
    color: "bg-green-50 border-green-200",
    searchTerm: "property",
  },
  {
    icon: Car,
    name: "Personal Injury",
    desc: "Accident and injury claims",
    services: "650+ services",
    color: "bg-orange-50 border-orange-200",
    searchTerm: "injury",
  },
  {
    icon: FileText,
    name: "Estate Planning",
    desc: "Wills, trusts, and estate planning",
    services: "400+ services",
    color: "bg-purple-50 border-purple-200",
    searchTerm: "estate",
  },
  {
    icon: Users,
    name: "Employment Law",
    desc: "Workplace rights and employment issues",
    services: "580+ services",
    color: "bg-indigo-50 border-indigo-200",
    searchTerm: "employment",
  },
  {
    icon: DollarSign,
    name: "Tax Law",
    desc: "Tax planning and IRS representation",
    services: "320+ services",
    color: "bg-yellow-50 border-yellow-200",
    searchTerm: "tax",
  },
];

const LegalServices = () => {
  const router = useRouter();

  const handleCategoryClick = (searchTerm) => {
    // Navigate to search page with the search term
    router.push(`/search?query=${encodeURIComponent(searchTerm)}`);
  };

  const handleViewAll = () => {
    // Navigate to search page without query to show all categories
    router.push('/search');
  };

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Browse Legal Services
          </h2>
          <p className="text-xl text-gray-600">
            Find the right legal expertise for your specific needs. Our verified
            lawyers specialize in various areas of law.
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              onClick={() => handleCategoryClick(service.searchTerm)}
              className={`${service.color} border-2 rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group`}
            >
              <service.icon
                size={55}
                className="border-2 text-gray-700 p-3 border-gray-100 bg-white rounded-xl mb-4 group-hover:scale-110 transition-transform"
              />
              <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
              <p className="text-gray-600 mb-3">{service.desc}</p>
              <p className="text-sm text-gray-600 font-medium">
                {service.services}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <button 
            onClick={handleViewAll}
            className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors"
          >
            View All Categories
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalServices;