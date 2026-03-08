"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Phone, Mail, MessageCircle, Calendar, User, FileText, MapPin } from "lucide-react";

const ContactLawyerPage = () => {
  const searchParams = useSearchParams();

  const lawyer = {
    id: searchParams.get("id"),
    name: searchParams.get("name"),
    specialty: searchParams.get("specialty"),
    location: searchParams.get("location"),
    image: searchParams.get("image"),
  };

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    legalIssue: "",
    description: "",
    preferredContact: "email",
    preferredDate: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", { ...formData, lawyer });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Lawyer Info Card */}
        {lawyer.name && (
          <div className="flex items-center gap-6 bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
            <img
              src={lawyer.image || "/images/default-lawyer.png"}
              alt={lawyer.name}
              className="w-20 h-20 rounded-full object-cover "
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{lawyer.name}</h1>
              <p className="text-blue-600 font-medium">{lawyer.specialty}</p>
              <div className="flex items-center text-gray-500 text-sm mt-1">
                <MapPin className="w-4 h-4 mr-1" /> {lawyer.location}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-8">
          {submitted ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg text-center">
              <p className="font-semibold text-lg mb-1">Message sent successfully!</p>
              <p>The lawyer will contact you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <User className="inline w-4 h-4 mr-2" />
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="John Smith"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <Mail className="inline w-4 h-4 mr-2" />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="john@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <Phone className="inline w-4 h-4 mr-2" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {/* Legal Issue */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <FileText className="inline w-4 h-4 mr-2" />
                  Type of Legal Issue *
                </label>
                <select
                  name="legalIssue"
                  value={formData.legalIssue}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select an issue</option>
                  <option value="criminal">Criminal Law</option>
                  <option value="family">Family Law</option>
                  <option value="business">Business Law</option>
                  <option value="personal-injury">Personal Injury</option>
                  <option value="real-estate">Real Estate</option>
                  <option value="immigration">Immigration</option>
                  <option value="employment">Employment Law</option>
                  <option value="estate-planning">Estate Planning</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <MessageCircle className="inline w-4 h-4 mr-2" />
                  Describe Your Legal Issue *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Please provide details about your legal situation..."
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-4 rounded-lg transition-colors text-lg"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactLawyerPage;
