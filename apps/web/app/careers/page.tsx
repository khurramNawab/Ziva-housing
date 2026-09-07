'use client';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';

export default function CareersPage() {
  const openings = [
    { title: 'Senior Full Stack Engineer (Next.js & NestJS)', dept: 'Engineering', loc: 'Bangalore / Remote' },
    { title: 'Trust & Safety Operations Manager', dept: 'Operations', loc: 'Noida / Gurgaon' },
    { title: 'Partner Success Lead (Home Services)', dept: 'Vendor Operations', loc: 'Bangalore' },
  ];

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] font-[Rubik] antialiased min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-[1280px] mx-auto px-4 md:px-8 py-12 md:py-16 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="bg-[#e8ddff] text-[#4500b4] px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">Join Our Team</span>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Build the Future of Housing Tech</h1>
          <p className="text-xs md:text-sm text-gray-600 max-w-xl mx-auto">
            We are looking for passionate engineers, operators, and customer champions to join our mission.
          </p>
        </div>

        {/* Openings */}
        <div className="bg-white rounded-2xl border border-[#eceef0] shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-[#4500b4] border-b border-[#eceef0] pb-3">Current Open Positions</h2>
          <div className="divide-y divide-[#eceef0]">
            {openings.map((op, idx) => (
              <div key={idx} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#191c1e]">{op.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{op.dept} • {op.loc}</p>
                </div>
                <Link
                  href="/support"
                  className="bg-[#5e23dc] hover:bg-[#4500b4] text-white text-xs font-bold px-4 py-2 rounded-xl transition w-fit"
                >
                  Apply Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
