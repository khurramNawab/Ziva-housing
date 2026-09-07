'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#2d3133] text-[#eff1f3] mt-auto border-t border-[#3d3c3c]">
      {/* Top Main Footer Grid */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Brand Info & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#37e09b] text-2xl">home_work</span>
              <h3 className="text-xl font-black text-white tracking-tight">Ziva Housing</h3>
            </div>
            <p className="text-xs text-[#c9c7c6] leading-relaxed max-w-sm">
              India&apos;s premier tech-driven real estate marketplace and on-demand home services ecosystem. 100% verified listings, zero hidden brokerage, and encrypted escrow protection.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 bg-[#3d3c3c] text-[#37e09b] text-[11px] font-bold px-3 py-1 rounded-full border border-[#545353]">
                <span className="material-symbols-outlined text-xs">verified</span> 100% Verified
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#3d3c3c] text-white text-[11px] font-bold px-3 py-1 rounded-full border border-[#545353]">
                <span className="material-symbols-outlined text-xs">lock</span> Escrow Protected
              </span>
            </div>
          </div>

          {/* Column 1: Properties */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Real Estate</h4>
            <ul className="space-y-2 text-xs text-[#c9c7c6]">
              <li><Link href="/buy" className="hover:text-white transition-colors">Buy Property</Link></li>
              <li><Link href="/sell" className="hover:text-white transition-colors">Sell Property</Link></li>
              <li><Link href="/post-property" className="hover:text-white transition-colors">Post Free Listing</Link></li>
              <li><Link href="/properties" className="hover:text-white transition-colors">Verified Homes</Link></li>
            </ul>
          </div>

          {/* Column 2: Home Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Home Services</h4>
            <ul className="space-y-2 text-xs text-[#c9c7c6]">
              <li><Link href="/services" className="hover:text-white transition-colors">Browse All Services</Link></li>
              <li><Link href="/services/home-cleaning" className="hover:text-white transition-colors">House Deep Cleaning</Link></li>
              <li><Link href="/services/ac-repair" className="hover:text-white transition-colors">AC Service &amp; Repair</Link></li>
              <li><Link href="/services/electrician" className="hover:text-white transition-colors">Electrician on Demand</Link></li>
              <li><Link href="/become-professional" className="hover:text-white transition-colors text-[#37e09b] font-semibold">Join as Vendor Pro</Link></li>
            </ul>
          </div>

          {/* Column 3: Company & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Company &amp; Legal</h4>
            <ul className="space-y-2 text-xs text-[#c9c7c6]">
              <li><Link href="/about" className="hover:text-white transition-colors">About Ziva</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors">Careers &amp; Team</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/support" className="hover:text-white transition-colors">Help &amp; Support 24/7</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#3d3c3c] bg-[#242729]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-[#c9c7c6]">
          <p>&copy; 2026 Ziva Housing Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <Link href="/support" className="hover:text-white transition">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
