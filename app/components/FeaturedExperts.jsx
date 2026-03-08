"use client";
import { useState, useEffect } from "react";
import { Star, MapPin, Clock, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const renderStars = (rating) => {
  const full = Math.floor(rating);
  const half = rating % 1 !== 0;
  const empty = 5 - Math.ceil(rating);
  return (
    <div className="flex items-center">
      {[...Array(full)].map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
      {half && (
        <div className="relative w-4 h-4">
          <Star className="w-4 h-4 text-gray-300 absolute" />
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 absolute" style={{ clipPath: "inset(0 50% 0 0)" }} />
        </div>
      )}
      {[...Array(empty)].map((_, i) => <Star key={`e${i}`} className="w-4 h-4 text-gray-300" />)}
    </div>
  );
};

const FeaturedExperts = () => {
  const router = useRouter();
  const [experts, setExperts]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    fetch(`${API}/api/lawyers/featured`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : Promise.reject("Failed"))
      .then((d) => setExperts(Array.isArray(d) ? d : d.lawyers ?? []))
      .catch(() => setError("Could not load featured lawyers"))
      .finally(() => setLoading(false));
  }, []);

  const handleContact = (lawyer) => {
    router.push(`/auth/login?redirect=${encodeURIComponent(`/contacts?id=${lawyer._id || lawyer.id}`)}`);
  };

  if (loading) return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 text-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-gray-500 mt-3">Loading featured experts…</p>
      </div>
    </section>
  );

  // Fallback if API not ready yet – show placeholder cards
  const displayExperts = experts.length > 0 ? experts : [];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Legal Experts</h2>
          <p className="text-lg text-gray-600">
            Connect with our top-rated lawyers who have helped thousands of clients achieve successful outcomes.
          </p>
        </header>

        {error ? (
          <div className="text-center py-10">
            <p className="text-gray-500">{error}</p>
          </div>
        ) : displayExperts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No featured lawyers yet. <a href="/auth/signup" className="text-blue-600 underline">Be the first to join!</a></p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayExperts.slice(0, 4).map((expert) => {
              const id       = expert._id || expert.id;
              const name     = expert.name || expert.full_name;
              const specialty= expert.specialty || expert.practiceArea || "Legal Expert";
              const location = expert.location || expert.city || "";
              const rating   = parseFloat(expert.rating) || 0;
              const reviews  = expert.reviewCount || expert.reviews || 0;
              const rate     = expert.hourlyRate ? `$${expert.hourlyRate}/hr` : expert.rate || "Contact for rate";
              const photo    = expert.photo || expert.image || "/images/default-lawyer.png";
              const verified = expert.verified !== false;
              const topRated = expert.topRated || false;
              const response = expert.responseTime || "Responds within 24hrs";
              const specs    = expert.specialties || expert.tags || [];

              return (
                <div key={id} className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow p-6 border border-gray-200">
                  {/* Badges + photo */}
                  <div className="flex justify-center mb-8 relative">
                    <div className="absolute top-0 left-0 right-0 flex justify-between -translate-y-3 z-10">
                      {verified && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                          <CheckCircle size={12} /> Verified
                        </span>
                      )}
                      {topRated && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                          Top Rated
                        </span>
                      )}
                    </div>
                    <img src={photo} alt={name}
                      onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e3a8a&color=fff`; }}
                      className="mt-5 w-20 h-20 rounded-full object-cover mx-auto border-2 border-gray-100" />
                  </div>

                  <div className="text-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
                    <p className="text-sm text-blue-600 font-medium mb-2">{specialty}</p>
                    {location && (
                      <div className="flex items-center justify-center text-gray-500 text-sm mb-3">
                        <MapPin className="w-3.5 h-3.5 mr-1" />{location}
                      </div>
                    )}
                  </div>

                  {rating > 0 && (
                    <div className="flex items-center justify-center mb-3 gap-1">
                      {renderStars(rating)}
                      <span className="ml-1 text-sm font-semibold text-gray-900">{rating.toFixed(1)}</span>
                      {reviews > 0 && <span className="text-sm text-gray-500">({reviews})</span>}
                    </div>
                  )}

                  {specs.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                      {specs.slice(0, 3).map((s, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md">{s}</span>
                      ))}
                      {specs.length > 3 && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md">+{specs.length - 3} more</span>}
                    </div>
                  )}

                  <div className="flex items-center justify-center text-xs text-gray-500 mb-4">
                    <Clock className="w-3.5 h-3.5 mr-1" />{response}
                  </div>

                  <div className="text-center mb-4">
                    <p className="text-lg font-bold text-gray-900">Starting at {rate}</p>
                  </div>

                  <button onClick={() => handleContact(expert)}
                    className="w-full bg-blue-900 text-white py-2.5 rounded-md font-medium hover:bg-blue-800 transition-colors active:bg-blue-950">
                    Contact Now
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-10">
          <button onClick={() => router.push("/auth/signup")}
            className="px-8 py-3 border-2 border-blue-900 text-blue-900 font-semibold rounded-lg hover:bg-blue-900 hover:text-white transition-colors">
            View All Lawyers
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedExperts;