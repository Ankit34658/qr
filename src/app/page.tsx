"use client";

import {
  ShieldCheck,
  ArrowRight,
  Smartphone,
  Zap,
  ShieldAlert,
  Car,
  QrCode,
  MessageCircle,
  CheckCircle2,
  Lock,
  Globe,
  Star,
  Menu,
  X
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl bg-white/80 backdrop-blur-xl rounded-3xl px-8 py-4 flex items-center justify-between border border-white/20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-2xl shadow-lg">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-gray-900">SafeDrive</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection('features')}
            className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('security')}
            className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition"
          >
            Security
          </button>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/register" className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-blue-700 transition shadow-lg">
            Create Tag
          </Link>
          <Link href="/login" className="text-gray-600 hover:text-gray-900 px-4 py-3 font-semibold text-sm transition">
            Login
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:hidden">
            <div className="space-y-4">
              <button
                onClick={() => scrollToSection('features')}
                className="block w-full text-left text-gray-600 hover:text-blue-600 font-semibold transition"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="block w-full text-left text-gray-600 hover:text-blue-600 font-semibold transition"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('security')}
                className="block w-full text-left text-gray-600 hover:text-blue-600 font-semibold transition"
              >
                Security
              </button>
              <hr className="border-gray-100" />
              <Link href="/register" className="block bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-center hover:bg-blue-700 transition">
                Create Tag
              </Link>
              <Link href="/login" className="block text-center text-gray-600 hover:text-gray-900 px-4 py-2 font-semibold transition">
                Login
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Keeping as requested */}
      <section className="relative pt-48 pb-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-10 animate-fadeIn border border-blue-100 shadow-sm">
            <Zap size={14} /> The Future of Vehicle Safety
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-gray-900 leading-[0.95] tracking-tighter mb-8 animate-fadeIn">
            Secure Your Vehicle <br />
            <span className="text-blue-600 relative">
              With Intelligence.
              <div className="absolute -bottom-2 left-0 w-full h-2 bg-blue-100/50 -rotate-1 rounded-full"></div>
            </span>
          </h1>

          <p className="max-w-2xl text-xl text-gray-500 font-medium leading-relaxed mb-12 animate-fadeIn opacity-80">
            SafeDrive protects 100,000+ vehicles with encrypted QR identifiers. Instant emergency contact, parking alerts, and owner notifications—all without exposing your phone number.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 animate-fadeIn">
            <Link href="/register" className="group flex items-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-3xl font-black text-lg hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200">
              Create New Account
              <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link href="/login" className="group flex items-center gap-3 bg-white text-gray-900 px-10 py-5 rounded-3xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl border border-gray-200">
              Admin Portal
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
          </div>

          <div className="flex items-center mt-12 -space-x-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center overflow-hidden">
                <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" className="w-full h-full object-cover" />
              </div>
            ))}
            <div className="pl-6 text-sm font-bold text-gray-400">Trusted by over 10k users</div>
          </div>
        </div>

        {/* Hero Background Elements */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl"></div>
      </section>

      {/* Quick Stats */}
      <section className="max-w-6xl mx-auto px-6 mb-20 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {[
          { label: "Active Tags", val: "100k+" },
          { label: "Rapid Scans", val: "2.4M" },
          { label: "Privacy Rating", val: "99.9%" },
          { label: "Emergency Response", val: "<30s" }
        ].map((stat, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl text-center hover:shadow-lg transition-all border border-white/50">
            <p className="text-3xl font-black text-gray-900 mb-1">{stat.val}</p>
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Key Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Everything You Need <br /> To Stay Safe
          </h2>
          <p className="text-gray-500 font-medium max-w-xl mx-auto text-lg">
            One tag. Unlimited possibilities for your vehicle's safety and convenience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <QrCode className="w-7 h-7" />,
              title: "Smart QR Tags",
              desc: "Dynamic identifiers that protect your privacy while enabling instant contact.",
              color: "from-blue-500 to-blue-600"
            },
            {
              icon: <ShieldAlert className="w-7 h-7" />,
              title: "Emergency Response",
              desc: "Critical alerts sent instantly to your emergency contacts with GPS location.",
              color: "from-red-500 to-rose-600"
            },
            {
              icon: <Lock className="w-7 h-7" />,
              title: "Privacy Protection",
              desc: "Secure communication without revealing your personal phone number.",
              color: "from-gray-700 to-gray-900"
            }
          ].map((feat, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group hover:-translate-y-1">
              <div className={`w-14 h-14 bg-gradient-to-br ${feat.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feat.title}</h3>
              <p className="text-gray-600 font-medium leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Create & Print", desc: "Generate your unique QR code and print it for your vehicle" },
              { step: "2", title: "Someone Scans", desc: "When scanned, they can contact you securely without seeing your number" },
              { step: "3", title: "Stay Protected", desc: "Your privacy is maintained while enabling helpful communication" }
            ].map((item, i) => (
              <div key={i} className="space-y-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-lg mx-auto">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-12">Bank-Level Security</h2>
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Data is Safe</h3>
                <div className="space-y-3">
                  {[
                    "End-to-end encryption",
                    "No personal data stored",
                    "GDPR compliant",
                    "Zero tracking"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="text-emerald-500" size={20} />
                      <span className="font-medium text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 flex items-center justify-center">
                <ShieldCheck size={120} className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            Ready to protect <br /> your vehicle?
          </h2>
          <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto">
            Join thousands of smart vehicle owners who prioritize safety and privacy.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link href="/register" className="w-full sm:w-auto bg-blue-600 text-white px-12 py-5 rounded-3xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl">
              Create Your QR Tag
            </Link>
            <Link href="/login" className="w-full sm:w-auto px-12 py-5 border-2 border-gray-200 rounded-3xl font-bold text-lg hover:bg-gray-50 transition-all text-gray-700">
              Admin Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-gray-900 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-blue-400" size={24} />
              <span className="font-black text-xl tracking-tight text-white">SafeDrive</span>
            </div>
            <div className="flex gap-8 text-sm font-medium text-gray-400">
              <Link href="#" className="hover:text-white transition">Privacy</Link>
              <Link href="#" className="hover:text-white transition">Terms</Link>
              <Link href="#" className="hover:text-white transition">Support</Link>
            </div>
            <div className="text-sm text-gray-400">
              © 2026 SafeDrive. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}