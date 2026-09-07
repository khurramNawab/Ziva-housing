import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'Read the Terms and Conditions for using Ziva Housing — India\'s trusted real estate marketplace.',
};

export default function TermsPage() {
  return (
    <div className="bg-[#f8f9fb] min-h-screen flex flex-col font-[Rubik] text-[#191c1e] antialiased">
      <Navbar />
      <main className="flex-grow w-full max-w-[860px] mx-auto px-4 md:px-8 py-10 md:py-16">
        {/* Header */}
        <div className="mb-10">
          <span className="inline-block bg-[#e8ddff] text-[#4500b4] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">Legal</span>
          <h1 className="text-[32px] md:text-[40px] font-bold text-[#191c1e] leading-tight mb-3">Terms and Conditions</h1>
          <p className="text-[14px] text-[#494455]">Last updated: August 21, 2026 &nbsp;·&nbsp; Effective immediately upon account registration</p>
        </div>

        {/* Intro box */}
        <div className="bg-white border border-[#eceef0] rounded-2xl p-6 mb-8 shadow-sm">
          <p className="text-[15px] text-[#494455] leading-relaxed">
            Welcome to <strong className="text-[#4500b4]">Ziva Housing</strong>. By accessing or using our platform — including our website, mobile app, or APIs — you agree to be bound by these Terms and Conditions. Please read them carefully. If you do not agree to these terms, you may not access or use the platform.
          </p>
        </div>

        <div className="space-y-8 text-[15px] text-[#494455] leading-relaxed">

          <section>
            <h2 className="text-[20px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#5e23dc] text-white flex items-center justify-center text-sm font-bold shrink-0">1</span>
              Acceptance of Terms
            </h2>
            <p>By creating an account or using any part of the Ziva Housing platform, you confirm that you are at least 18 years old, legally capable of entering into a binding contract, and agree to these Terms in their entirety. These Terms apply to all users including buyers, sellers, renters, property owners, real estate agents, and service providers.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#5e23dc] text-white flex items-center justify-center text-sm font-bold shrink-0">2</span>
              Platform Description
            </h2>
            <p className="mb-3">Ziva Housing is an online marketplace that connects property seekers with property owners, agents, and home service providers. We provide:</p>
            <ul className="space-y-2 list-none">
              {[
                'Property listings for sale, rent, and PG/co-living',
                'New residential project information and booking enquiries',
                'Home service bookings (cleaning, repair, electrician, etc.)',
                'Real estate agent and vendor management dashboards',
                'Lead generation and property enquiry systems',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#16a373] text-[18px] mt-0.5">check_circle</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-[20px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#5e23dc] text-white flex items-center justify-center text-sm font-bold shrink-0">3</span>
              User Accounts & Registration
            </h2>
            <p className="mb-3">To access core features, you must register for an account. You agree to:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Provide accurate, complete, and up-to-date information during registration</li>
              <li>Maintain the confidentiality of your login credentials</li>
              <li>Be responsible for all activities under your account</li>
              <li>Notify us immediately of unauthorized access at support@zivahousing.com</li>
              <li>Not create multiple accounts for abusive or fraudulent purposes</li>
            </ul>
            <div className="mt-4 bg-[#fff8e6] border border-[#FEEBC8] rounded-xl p-4">
              <p className="text-[13px] font-semibold text-[#9A6A00]">⚠️ We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent behavior, including misrepresentation of property listings.</p>
            </div>
          </section>

          <section>
            <h2 className="text-[20px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#5e23dc] text-white flex items-center justify-center text-sm font-bold shrink-0">4</span>
              Property Listings
            </h2>
            <p className="mb-3">Owners and agents posting listings acknowledge that:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>All property information posted must be accurate and not misleading</li>
              <li>You have the legal authority to list the property (ownership or authorized agent status)</li>
              <li>Photos and descriptions must represent the actual property being listed</li>
              <li>Pricing must be in Indian Rupees and must reflect genuine market rates</li>
              <li>Ziva Housing reserves the right to remove listings that violate our content standards</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[20px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#5e23dc] text-white flex items-center justify-center text-sm font-bold shrink-0">5</span>
              Home Services
            </h2>
            <p className="mb-3">For service bookings through Ziva Housing:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Payments are held in escrow and released after service completion confirmation</li>
              <li>Service providers are independently verified but Ziva Housing is not liable for work quality</li>
              <li>Cancellations must be made at least 4 hours before the scheduled time for a full refund</li>
              <li>Disputes should be raised within 48 hours of service completion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[20px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#5e23dc] text-white flex items-center justify-center text-sm font-bold shrink-0">6</span>
              Lead Protection Policy
            </h2>
            <p>Ziva Housing employs a <strong>lead protection system</strong> to ensure buyer information is not shared with multiple agents simultaneously. Once you enquire about a property, your contact details are shared exclusively with the listing agent or owner for a period of 30 days. Resale or redistribution of leads to third parties is strictly prohibited.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#5e23dc] text-white flex items-center justify-center text-sm font-bold shrink-0">7</span>
              Prohibited Activities
            </h2>
            <p className="mb-3">Users may not:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Post false, misleading, or fraudulent property listings</li>
              <li>Use the platform for money laundering or illegal transactions</li>
              <li>Scrape, harvest, or systematically collect user data</li>
              <li>Reverse engineer or attempt to access our backend systems</li>
              <li>Harass, abuse, or threaten other users or service providers</li>
              <li>Create fake reviews or testimonials for properties or services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[20px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#5e23dc] text-white flex items-center justify-center text-sm font-bold shrink-0">8</span>
              Intellectual Property
            </h2>
            <p>All content on the Ziva Housing platform including the logo, brand name, design system, user interface, and written content is the exclusive property of Ziva Housing Pvt. Ltd. and is protected under Indian copyright law. You may not reproduce, redistribute, or create derivative works without written permission.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#5e23dc] text-white flex items-center justify-center text-sm font-bold shrink-0">9</span>
              Disclaimer of Warranties
            </h2>
            <p>The Ziva Housing platform is provided on an <em>"as is"</em> and <em>"as available"</em> basis. We do not guarantee the accuracy of property listings, availability of properties, or the quality of service providers. We are a marketplace and do not take responsibility for transactions between users.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#5e23dc] text-white flex items-center justify-center text-sm font-bold shrink-0">10</span>
              Governing Law
            </h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts located in <strong>Bengaluru, Karnataka, India</strong>.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#5e23dc] text-white flex items-center justify-center text-sm font-bold shrink-0">11</span>
              Contact
            </h2>
            <p>For questions about these Terms, please contact us at <a href="mailto:legal@zivahousing.com" className="text-[#4500b4] underline font-semibold hover:text-[#5e23dc]">legal@zivahousing.com</a> or write to:</p>
            <address className="mt-3 not-italic bg-white border border-[#eceef0] rounded-xl p-4 shadow-sm text-sm">
              <strong>Ziva Housing Pvt. Ltd.</strong><br />
              Legal Department, 4th Floor, Brigade Tech Park,<br />
              Whitefield, Bengaluru – 560048, Karnataka, India
            </address>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 bg-[#e8ddff] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-[15px] font-bold text-[#4500b4]">Also read our Privacy Policy</p>
            <p className="text-[13px] text-[#494455]">Understand how we collect, store, and protect your data.</p>
          </div>
          <Link href="/privacy" className="bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm shrink-0">
            View Privacy Policy →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
