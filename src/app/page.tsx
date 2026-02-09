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
  Star
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen mesh-gradient overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl glass-heavy rounded-[32px] px-8 py-4 flex items-center justify-between animate-fadeIn">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-2xl shadow-lg shadow-blue-200">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-gray-900">SafeDrive</span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          <a href="#features" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition">Features</a>
          <a href="#how-it-works" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition">Network</a>
          <a href="#security" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition">Security</a>
        </div>
        <Link href="/login" className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-xl shadow-gray-200">
          Portal Login
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-10 animate-fadeIn border border-blue-100 shadow-sm">
            <Zap size={14} /> The Future of Vehicle Safety
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-gray-900 leading-[0.95] tracking-tighter mb-8 animate-fadeIn">
            Secure Your Vehicle <br />
            <span className="text-blue-600 text-glow-blue relative">
              With Intelligence.
              <div className="absolute -bottom-2 left-0 w-full h-2 bg-blue-100/50 -rotate-1 rounded-full"></div>
            </span>
          </h1>

          <p className="max-w-2xl text-xl text-gray-500 font-medium leading-relaxed mb-12 animate-fadeIn opacity-80">
            SafeDrive protects 100,000+ vehicles with encrypted QR identifiers. Instant emergency contact, parking alerts, and owner notifications—all without exposing your phone number.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 animate-fadeIn">
            <Link href="/register" className="group flex items-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-3xl font-black text-lg hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200">
              Get Started Free
              <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </Link>
            <div className="flex items-center -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                </div>
              ))}
              <div className="pl-6 text-sm font-bold text-gray-400">Trusted by over 10k users</div>
            </div>
          </div>
        </div>

        {/* Hero Background Elements */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </section>

      {/* Stats Grid */}
      <section className="max-w-6xl mx-auto px-6 mb-32 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {[
          { label: "Active Tags", val: "100k+" },
          { label: "Rapid Scans", val: "2.4M" },
          { label: "Privacy Rating", val: "99.9%" },
          { label: "Emergency Res", val: "<30s" }
        ].map((stat, i) => (
          <div key={i} className="glass-heavy p-8 rounded-[40px] text-center transition-transform hover:-translate-y-2">
            <p className="text-4xl font-black text-gray-900 mb-2">{stat.val}</p>
            <p className="text-xs font-black uppercase text-gray-400 tracking-[0.1em]">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Main Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">Everything You Need <br /> To Stay Safe</h2>
          <p className="text-gray-500 font-bold max-w-xl mx-auto">One tag. Unlimited possibilities for your vehicle's safety and convenience.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <QrCode className="w-8 h-8" />,
              title: "Encrypted QR Tags",
              desc: "Dynamic identifiers that link to your contact preferences without revealing sensitive data.",
              color: "bg-blue-600"
            },
            {
              icon: <ShieldAlert className="w-8 h-8" />,
              title: "Rapid Emergency Response",
              desc: "Critical accident alerts sent instantly to your emergency contacts with one tap.",
              color: "bg-red-500"
            },
            {
              icon: <Lock className="w-8 h-8" />,
              title: "Masked Communication",
              desc: "Talk to anyone who scans your car via our secure, private VOIP and messaging tunnel.",
              color: "bg-gray-900"
            },
            {
              icon: <Globe className="w-8 h-8" />,
              title: "Fleet Dashboard",
              desc: "Manage multiple vehicles from a single high-end portal with real-time analytics.",
              color: "bg-indigo-600"
            },
            {
              icon: <Smartphone className="w-8 h-8" />,
              title: "Mobile First Design",
              desc: "Optimized for the road. Fast loading, high contrast, and easy to use on any device.",
              color: "bg-emerald-600"
            },
            {
              icon: <CheckCircle2 className="w-8 h-8" />,
              title: "Zero Setup Cost",
              desc: "Free to register, simple to print, and active in seconds. No complex hardware needed.",
              color: "bg-amber-500"
            }
          ].map((feat, i) => (
            <div key={i} className="bg-white p-12 rounded-[48px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all group hover:-translate-y-2">
              <div className={`${feat.color} w-16 h-16 rounded-3xl flex items-center justify-center text-white mb-8 shadow-lg group-hover:scale-110 transition-transform`}>
                {feat.icon}
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4">{feat.title}</h3>
              <p className="text-gray-500 font-medium leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase Section */}
      <section className="bg-gray-900 py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10 relative z-10">
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/10 text-white rounded-full text-xs font-black uppercase tracking-widest border border-white/10">
              Live Preview
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tight">
              Powerful Tools <br />
              <span className="text-blue-400">At Your Fingertips.</span>
            </h2>
            <div className="space-y-6">
              {[
                "Instant PWA access for all scanners",
                "Advanced masking logic for privacy",
                "Real-time scan geolocation logs",
                "Single-click emergency bypass"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 text-white/70 font-medium">
                  <CheckCircle2 className="text-blue-400" size={20} />
                  {item}
                </div>
              ))}
            </div>
            <Link href="/register" className="inline-flex bg-white text-gray-900 px-10 py-5 rounded-3xl font-black text-lg hover:bg-blue-50 transition-all shadow-2xl">
              Create Your Free Tag
            </Link>
          </div>

          <div className="relative animate-float">
            <div className="bg-blue-600/20 absolute -inset-20 blur-[100px] rounded-full"></div>
            <div className="glass-heavy rounded-[60px] p-8 border border-white/10 relative z-10 shadow-2xl overflow-hidden aspect-[4/3] flex flex-col">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                </div>
                <div className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] text-white/40 font-black uppercase tracking-widest">
                  SafeDrive v2.0
                </div>
              </div>
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center relative shadow-2xl">
                  <QrCode size={80} className="text-gray-900" />
                  <div className="absolute top-0 right-0 p-2 bg-blue-600 rounded-full -mr-3 -mt-3 border-4 border-gray-900">
                    <Zap size={16} className="text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-white font-black text-2xl">Toyota Camry • MH 12 AB 9999</p>
                  <p className="text-white/40 font-bold">Privacy Masking Enabled</p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="bg-white/5 rounded-3xl p-4 border border-white/5">
                    <p className="text-[10px] text-white/30 font-black uppercase mb-1">Total Scans</p>
                    <p className="text-2xl font-black text-white">421</p>
                  </div>
                  <div className="bg-red-500/10 rounded-3xl p-4 border border-red-500/10">
                    <p className="text-[10px] text-red-400 font-black uppercase mb-1">Emergency</p>
                    <p className="text-2xl font-black text-red-400">0</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/10 blur-[150px]"></div>
      </section>

      {/* CTA Footer */}
      <footer className="py-32 px-6 bg-white border-t border-gray-100 text-center">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="bg-blue-600/10 w-24 h-24 rounded-[32px] flex items-center justify-center text-blue-600 mx-auto mb-10 shadow-inner">
            <ShieldCheck size={48} />
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-[0.9]">
            Ready to drive <br /> with confidence?
          </h2>
          <p className="text-xl text-gray-500 font-medium max-w-xl mx-auto">
            Join thousands of vehicle owners who prioritize safety and privacy through SafeDrive.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
            <Link href="/register" className="w-full sm:w-auto bg-gray-900 text-white px-12 py-5 rounded-3xl font-black text-lg hover:bg-black transition-all shadow-2xl">
              Get Your Free Tag
            </Link>
            <Link href="/login" className="w-full sm:w-auto px-12 py-5 border-2 border-gray-100 rounded-3xl font-black text-lg hover:bg-gray-50 transition-all text-gray-600">
              Admin Portal
            </Link>
          </div>

          <div className="pt-32 flex flex-col md:flex-row justify-between items-center border-t border-gray-50 gap-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-blue-600" />
              <span className="font-black text-lg tracking-tighter">SafeDrive.</span>
            </div>
            <div className="flex gap-10 text-sm font-bold text-gray-400">
              <Link href="#" className="hover:text-blue-600 transition">Privacy</Link>
              <Link href="#" className="hover:text-blue-600 transition">Terms</Link>
              <Link href="#" className="hover:text-blue-600 transition">Agreement</Link>
              <Link href="#" className="hover:text-blue-600 transition">Support</Link>
            </div>
            <div className="text-xs font-black uppercase text-gray-300 tracking-[0.2em]">
              © 2026 SafeDrive Global System
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
