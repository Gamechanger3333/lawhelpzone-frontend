"use client";

import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Jennifer Martinez",
    role: "Small Business Owner",
    rating: 5,
    testimonial: "LawHelpZone connected me with an amazing business lawyer who helped me navigate complex contracts. The process was seamless and professional.",
    image: "/images/Jennifer Martinez.png"
  },
  {
    id: 2,
    name: "Robert Kim",
    role: "Homeowner",
    rating: 5,
    testimonial: "After my accident, I found the perfect personal injury attorney through this platform. They fought for me and got me the compensation I deserved.",
    image: "/images/Robert Kim.png"
  },
  {
    id: 3,
    name: "Lisa Thompson",
    role: "Divorcee",
    rating: 5,
    testimonial: "Going through a divorce was difficult, but the family lawyer I found here made the process much easier. Highly recommend this service.",
    image: "/images/Lisa Thompson.png"
  }
];

const ClientTestimonials = () => {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-xl font-normal text-gray-500 max-w-3xl mx-auto">
            Thousands of clients have found the legal help they needed through our platform.
            Here's what they have to say.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className=" bg-gray-50 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200 relative"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 text-blue-200">
                <Quote size={38}  />
              </div>

              {/* Star Rating */}
              <div className="flex gap-1 mb-4 relative z-10">
                {[...Array(testimonial.rating)].map((_, index) => (
                  <Star
                    key={index}
                    size={20}
                    className="text-yellow-400 fill-current"
                  />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-600 text-xl italic mb-6 leading-relaxed  relative z-10">
                "{testimonial.testimonial}"
              </p>

              {/* Client Info */}
              <div className="flex items-center gap-4 relative z-10">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm  text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Rating Banner */}
        <div className="bg-blue-50 rounded-full p-3 max-w-xl mx-auto">
          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-1">
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  size={24}
                  className="text-yellow-400 fill-current"
                />
              ))}
            </div>
            <p className="text-lg font-semibold text-gray-900">
              4.9/5 average rating from 10,000+ reviews
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientTestimonials;