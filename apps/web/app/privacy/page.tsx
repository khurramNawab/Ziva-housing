import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read the Privacy Policy for Ziva Housing — learn how we collect, store, and protect your personal data.',
};

export default function PrivacyPage() {
  return (
    <div className="bg-[#f8f9fb] min-h-screen flex flex-col font-[Rubik] text-[#191c1e] antialiased">
      <Navbar />
      <main className="flex-grow w-full max-w-[860px] mx-auto px-4 md:px-8 py-10 md:py-16">
        {/* Header */}
        <div className="mb-10">
          <span className="inline-block bg-[#e8faf4] text-[#16a373] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">Privacy & Data Protection</span>
          <h1 className="text-[32px] md:text-[40px] font-bold text-[#191c1e] leading-tight mb-3">Privacy Policy</h1>
          <p className="text-[14px] text-[#494455]">Last updated: August 21, 2026 &nbsp;·&nbsp; Compliant with Digital Personal Data Protection (DPDP) Act</p>
        </div>

        {/* Intro box */}
        <div className="bg-white border border-[#eceef0] rounded-2xl p-6 mb-8 shadow-sm">
          <p className="text-[15px] text-[#494455] leading-relaxed">
            At <strong className="text-[#4500b4]">Ziva Housing</strong>, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, share, and protect your information when you use our website, mobile application, and home services platform.
          </p>
        </div>

        <div className="space-y-8 text-[15px] text-[#494455] leading-relaxed">

          <section>
            <h2 className="text-[20px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#16a373] text-white flex items-center justify-center text-sm font-bold shrink-0">1</span>
              Information We Collect
            </h2>
            <p className="mb-3">We collect information to provide better services to all our users. This includes:</p>
            <ul className="space-y-2 list-none">
              {[
                'Personal Identification: Name, email address, phone number, and profile details.',
                'Property Preferences & Enquiries: Saved searches, viewed properties, BHK requirements, and budget ranges.',
                'Service Location & Address: Address details provided during home service bookings or property listings.',
                'Device & Location Data: IP address, device type, browser information, and approximate location (GPS/City).',
                'Payment Transaction Logs: Transaction IDs and payment statuses (processed securely via regulated gateways; no card numbers stored).'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#16a373] text-[18px] mt-0.5">shield</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-[20px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#16a373] text-white flex items-center justify-center text-sm font-bold shrink-0">2</span>
              How We Use Your Information
            </h2>
            <p className="mb-3">Your data is utilized strictly for legitimate business purposes:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Connecting you with verified property owners, agents, or service providers</li>
              <li>Processing home service bookings and dispatching local technicians</li>
              <li>Sending SMS / WhatsApp updates regarding property enquiries and OTP verifications</li>
              <li>Preventing fraudulent listings and maintaining system security</li>
              <li>Improving user experience, search performance, and recommended listings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[20px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#16a373] text-white flex items-center justify-center text-sm font-bold shrink-0">3</span>
              Lead Protection & Information Sharing
            </h2>
            <p className="mb-3">We take data privacy and lead protection seriously:</p>
            <div className="bg-[#e8faf4] border border-[#16a373]/30 rounded-xl p-4 mb-3">
              <p className="text-[13px] font-bold text-[#006c47]">🛡️ Exclusive Lead Routing Policy:</p>
              <p className="text-[13px] text-[#006c47] mt-1">When you submit an enquiry on a property, your contact details are shared ONLY with the primary owner/agent of that specific property. We never broadcast your phone number to multiple telemarketers.</p>
            </div>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>We do NOT sell or rent your personal information to third-party advertisers.</li>
              <li>Data is shared with home service vendors only to fulfill active bookings accepted by you.</li>
              <li>We may disclose information if required by law or government authorities in India.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[20px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#16a373] text-white flex items-center justify-center text-sm font-bold shrink-0">4</span>
              Data Security & Retention
            </h2>
            <p>We implement enterprise-grade security measures including SSL/TLS encryption, JWT authentication, and secure database access controls. Your data is stored on secure servers located within India in compliance with RBI and IT Act guidelines. Data is retained only as long as necessary for platform operations or legal compliance.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#16a373] text-white flex items-center justify-center text-sm font-bold shrink-0">5</span>
              Your Rights & Controls
            </h2>
            <p className="mb-3">Under Indian data protection laws, you have the right to:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Access and review personal information held by Ziva Housing</li>
              <li>Request correction of inaccurate or incomplete profile data</li>
              <li>Request deletion of your account and associated personal data</li>
              <li>Opt-out of promotional communications at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[20px] font-bold text-[#191c1e] mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#16a373] text-white flex items-center justify-center text-sm font-bold shrink-0">6</span>
              Contact Our Grievance Officer
            </h2>
            <p>If you have any questions, concerns, or privacy grievances, please contact our Data Protection & Grievance Officer at <a href="mailto:privacy@zivahousing.com" className="text-[#16a373] underline font-semibold">privacy@zivahousing.com</a>.</p>
          </section>
        </div>

        {/* Footer Link */}
        <div className="mt-12 bg-[#e8faf4] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-[15px] font-bold text-[#006c47]">Read our Terms and Conditions</p>
            <p className="text-[13px] text-[#494455]">Learn about platform rules, escrow payments, and user guidelines.</p>
          </div>
          <Link href="/terms" className="bg-[#16a373] hover:bg-[#006c47] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm shrink-0">
            View Terms & Conditions →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
