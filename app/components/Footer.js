"use client";

import Link from "next/link";
import { Facebook, Twitter, Linkedin, Instagram, Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  const legalServices = [
    { name: "Criminal Law", path: "/search?query=criminal" },
    { name: "Family Law", path: "/search?query=family" },
    { name: "Business Law", path: "/search?query=business" },
    { name: "Real Estate", path: "/search?query=property" },
    { name: "Personal Injury", path: "/search?query=injury" },
    { name: "Estate Planning", path: "/search?query=estate" },
  ];

  const companyLinks = [
    { name: "About Us", path: "/about" },
    { name: "How it Works", path: "/How-It-works" },
    { name: "Become a Lawyer", path: "/become-a-lawyer" },
    { name: "Careers", path: "/become-a-lawyer" },
    { name: "Press", path: "/press" },
    { name: "Blog", path: "/blog" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  ];

  return (
    <footer className="bg-slate-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold text-blue-400 mb-4">LawHelpZone</h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Connecting clients with qualified legal professionals. Get the legal help you need, when you need it.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-400 transition-colors"
                    aria-label={social.label}
                  >
                    <Icon size={20} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Legal Services */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Legal Services</h4>
            <div className="space-y-3">
              {legalServices.map((service, index) => (
                <div key={index}>
                  <Link
                    href={service.path}
                    className="text-gray-400 hover:text-blue-400 transition-colors block"
                  >
                    {service.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Company</h4>
            <div className="space-y-3">
              {companyLinks.map((link, index) => (
                <div key={index}>
                  <Link
                    href={link.path}
                    className="text-gray-400 hover:text-blue-400 transition-colors block"
                  >
                    {link.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contact Us</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <a href="tel:1-800-LAW-HELP" className="text-gray-400 hover:text-blue-400 transition-colors">
                    1-800-LAW-HELP
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <a href="mailto:support@lawhelpzone.com" className="text-gray-400 hover:text-blue-400 transition-colors">
                    support@lawhelpzone.com
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-gray-400">
                  <p>123 Legal St, Suite 100</p>
                  <p>New York, NY 10001</p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-white font-semibold mb-1">Available 24/7</p>
              <p className="text-sm text-gray-400">Emergency legal support when you need it most</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm">
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                Cookie Policy
              </Link>
              <Link
                href="/accessibility"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                Accessibility
              </Link>
            </div>
            <div className="text-sm text-gray-400">
              © 2025 LawHelpZone. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;