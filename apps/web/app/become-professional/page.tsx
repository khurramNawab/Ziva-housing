'use client';

import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function BecomeProfessionalPage() {
  const serviceCategories = [
    {
      name: 'Electrician',
      verified: false,
      img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Plumber',
      verified: false,
      img: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Carpenter',
      verified: false,
      img: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Painter',
      verified: false,
      img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Home Cleaner',
      verified: false,
      img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Cook / Chef',
      verified: true,
      img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Babysitter',
      verified: true,
      img: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Caregiver',
      verified: true,
      img: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Driver',
      verified: true,
      img: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Beautician',
      verified: true,
      img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Gardener',
      verified: false,
      img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Pest Control',
      verified: false,
      img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'AC Technician',
      verified: false,
      img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80',
    },
  ];

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] font-[Rubik] antialiased flex flex-col min-h-screen">
      {/* Top Navigation Bar */}
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="max-w-[1280px] mx-auto px-4 md:px-8 py-12 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <span className="bg-[#e8faf4] text-[#16a373] px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
              <span className="material-symbols-outlined text-sm">verified</span>
              Ziva Professional Network
            </span>

            <h1 className="text-[36px] md:text-[48px] leading-[44px] md:leading-[56px] font-bold text-[#191c1e] tracking-tight">
              Turn your skill into income — <span className="text-[#5e23dc]">get verified, get booked.</span>
            </h1>

            <p className="text-[16px] leading-[26px] text-[#494455] max-w-lg">
              Join thousands of professionals on Ziva. Build your reputation, manage your schedule, and grow your local service business with zero upfront costs.
            </p>

            <div className="pt-2">
              <Link
                href="/become-professional/register"
                className="bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all inline-flex items-center gap-2 text-sm"
              >
                Start Listing — Takes 5 minutes
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>

          <div className="relative h-[380px] md:h-[480px] rounded-2xl overflow-hidden shadow-2xl group border border-[#cbc3d8]">
            <img
              src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1000&q=80"
              alt="Ziva Service Professional"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-xl border border-white/50 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#16a373] text-white flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">shield</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#191c1e]">Escrow Protection &amp; Direct Deposit</h4>
                  <p className="text-[11px] text-[#494455]">Get paid immediately upon job completion with 100% guarantee.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who Can List (Charcoal Zone with High Quality Real Photos) */}
        <section className="bg-[#2d3133] py-16 md:py-24 text-white">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <div className="text-center mb-12 space-y-2">
              <h2 className="text-[28px] md:text-[38px] leading-[36px] md:leading-[46px] font-bold">Who can list?</h2>
              <p className="text-[15px] text-[#c9c7c6]">Over 15 categories of home and personal care services.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {serviceCategories.map((cat) => (
                <Link
                  key={cat.name}
                  href="/become-professional/register"
                  className="group relative h-48 rounded-2xl overflow-hidden border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 block"
                >
                  <img
                    src={cat.img}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  {cat.verified && (
                    <div className="absolute top-2.5 right-2.5 bg-[#e8faf4] text-[#16a373] px-2 py-0.5 rounded-full flex items-center gap-1 text-[9px] font-extrabold shadow-sm">
                      <span className="material-symbols-outlined text-[10px]">verified</span>
                      <span>Verified</span>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 text-center">
                    <span className="text-xs font-bold text-white tracking-wide block drop-shadow-md">
                      {cat.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why list with Ziva (Bento Grid) */}
        <section className="max-w-[1280px] mx-auto px-4 md:px-8 py-16 md:py-24">
          <h2 className="text-[28px] md:text-[36px] font-bold text-[#191c1e] mb-12 text-center">Why list with Ziva?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: 'visibility',
                title: 'Verified badge visibility',
                desc: 'Stand out from the crowd. Our background verification earns you a premium badge that customers trust instantly.',
              },
              {
                icon: 'trending_up',
                title: 'Steady job requests',
                desc: 'Access a massive network of homeowners actively looking for reliable services in your specific area.',
              },
              {
                icon: 'account_balance_wallet',
                title: 'Secure payments',
                desc: 'No more chasing invoices. Get paid securely and dependably through our integrated platform directly to your bank.',
              },
              {
                icon: 'schedule',
                title: 'Flexible hours',
                desc: 'You are your own boss. Accept bookings only when it suits your schedule and availability.',
              },
            ].map((benefit) => (
              <div
                key={benefit.title}
                className="bg-white p-6 md:p-8 rounded-2xl border border-[#cbc3d8] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 bg-[#e8ddff] text-[#4500b4] rounded-xl flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-2xl">{benefit.icon}</span>
                  </div>
                  <h3 className="text-[18px] font-bold text-[#191c1e] mb-2">{benefit.title}</h3>
                  <p className="text-[13px] leading-[20px] text-[#494455]">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3-Step Explainer */}
        <section className="bg-[#f2f4f6] py-16 md:py-24 border-y border-[#e0e3e5]">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <h2 className="text-[28px] md:text-[36px] font-bold text-[#191c1e] mb-16 text-center">How it works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-white rounded-full border-4 border-[#e8ddff] shadow-md flex items-center justify-center text-[#5e23dc]">
                  <span className="material-symbols-outlined text-3xl">edit_document</span>
                </div>
                <h3 className="text-[18px] font-bold text-[#191c1e]">1. Submit your details</h3>
                <p className="text-[13px] leading-[20px] text-[#494455] max-w-xs">
                  Create your profile, list your skills, and set your service area in less than 5 minutes.
                </p>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-white rounded-full border-4 border-[#e8faf4] shadow-md flex items-center justify-center text-[#16a373]">
                  <span className="material-symbols-outlined text-3xl">verified_user</span>
                </div>
                <h3 className="text-[18px] font-bold text-[#191c1e]">2. Get verified</h3>
                <p className="text-[13px] leading-[20px] text-[#494455] max-w-xs">
                  Complete a quick background check &amp; ID verification to earn your trust badge.
                </p>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-[#5e23dc] text-white rounded-full border-4 border-[#e8ddff] shadow-md flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">notifications_active</span>
                </div>
                <h3 className="text-[18px] font-bold text-[#191c1e]">3. Start receiving jobs</h3>
                <p className="text-[13px] leading-[20px] text-[#494455] max-w-xs">
                  Get notified when customers in your area request your services and get paid direct.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 text-center px-4">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-[32px] md:text-[42px] font-bold text-[#191c1e]">Ready to grow your income?</h2>
            <Link
              href="/become-professional/register"
              className="bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2 text-base"
            >
              Start Listing — takes 5 minutes
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
