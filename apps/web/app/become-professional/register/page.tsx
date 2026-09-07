'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function ProfessionalRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [category, setCategory] = useState('electrician');
  const [locality, setLocality] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleGetOtp = () => {
    if (!mobileNumber || mobileNumber.length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    setOtpSent(true);
    alert('OTP sent to +91 ' + mobileNumber + '. Enter 123456 to verify!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !mobileNumber || !locality) {
      alert('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const token = localStorage.getItem('Ziva_access');

      if (token) {
        await fetch(`${apiBase}/api/v1/services/providers/onboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            serviceArea: [locality],
            categoryName: category,
          }),
        });
      }

      localStorage.setItem('Ziva_vendor_app_status', 'UNDER_REVIEW');
      localStorage.setItem('Ziva_vendor_name', fullName);
      localStorage.setItem('Ziva_vendor_category', category);
      router.push('/become-professional/status');
    } catch (err) {
      console.error(err);
      router.push('/become-professional/status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f4f6f8] text-[#191c1e] font-[Rubik] antialiased min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-4 md:py-12">
        <div className="w-full max-w-[560px] bg-white rounded-2xl shadow-lg border border-[#cbc3d8] overflow-hidden relative p-6 md:p-8 space-y-6">
          {submitting && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin w-8 h-8 border-3 border-[#5e23dc] border-t-transparent rounded-full" />
              <p className="text-sm font-bold text-[#191c1e]">Creating your professional account...</p>
            </div>
          )}

          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-[24px] font-bold text-[#191c1e]">Join Ziva Professionals</h1>
            <p className="text-xs text-[#494455]">List your services and grow your business today.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#191c1e]">Full Name</label>
              <div className="border border-[#cbc3d8] rounded-xl bg-white px-4 py-3 flex items-center focus-within:border-[#5e23dc] focus-within:ring-2 focus-within:ring-[#5e23dc]/10 transition-all">
                <span className="material-symbols-outlined text-[#7a7487] mr-3 text-lg">person</span>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full bg-transparent outline-none text-xs text-[#191c1e] placeholder:text-[#7a7487]"
                />
              </div>
            </div>

            {/* Mobile Number & OTP */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#191c1e]">Mobile Number</label>
              <div className="flex gap-2">
                <div className="flex-1 border border-[#cbc3d8] rounded-xl bg-white px-4 py-3 flex items-center focus-within:border-[#5e23dc] transition-all">
                  <span className="material-symbols-outlined text-[#7a7487] mr-2 text-lg">phone_iphone</span>
                  <span className="text-xs font-bold text-[#494455] mr-2">+91</span>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    required
                    className="w-full bg-transparent outline-none text-xs text-[#191c1e] placeholder:text-[#7a7487]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGetOtp}
                  className="bg-[#e8ddff] text-[#4500b4] hover:bg-[#5e23dc] hover:text-white text-xs font-bold px-4 rounded-xl transition-colors whitespace-nowrap"
                >
                  {otpSent ? 'Resend OTP' : 'Get OTP'}
                </button>
              </div>
            </div>

            {/* OTP Verification Code (if sent) */}
            {otpSent && (
              <div className="space-y-1 animate-in fade-in duration-200">
                <label className="block text-xs font-bold text-[#16a373]">Enter Verification Code (Demo: 123456)</label>
                <div className="border border-[#16a373] rounded-xl bg-[#e8faf4] px-4 py-3 flex items-center">
                  <span className="material-symbols-outlined text-[#16a373] mr-3 text-lg">pin</span>
                  <input
                    type="text"
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-transparent outline-none text-xs font-bold text-[#191c1e]"
                  />
                </div>
              </div>
            )}

            {/* Category Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#191c1e]">Select Service Category</label>
              <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-1 pb-1">
                {[
                  { id: 'electrician', name: 'Electrician', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&q=80' },
                  { id: 'plumbing', name: 'Plumbing', img: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=300&q=80' },
                  { id: 'cleaning', name: 'Cleaning', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80' },
                  { id: 'carpentry', name: 'Carpenter', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=300&q=80' },
                  { id: 'painting', name: 'Painter', img: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=300&q=80' },
                  { id: 'ac-technician', name: 'AC Technician', img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80' },
                  { id: 'pest-control', name: 'Pest Control', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80' },
                  { id: 'gardening', name: 'Gardener', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=300&q=80' },
                  { id: 'packers-movers', name: 'Packers & Movers', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80' },
                  { id: 'babysitting', name: 'Babysitter', img: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=300&q=80' },
                  { id: 'elderly-care', name: 'Elderly Care', img: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=300&q=80' },
                  { id: 'cook', name: 'Cook / Chef', img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=300&q=80' },
                  { id: 'driver', name: 'Driver', img: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=300&q=80' },
                  { id: 'beautician', name: 'Beautician', img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80' },
                  { id: 'spa', name: 'Spa / Wellness', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=300&q=80' },
                ].map((item) => (
                  <label key={item.id} className="cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={item.id}
                      checked={category === item.id}
                      onChange={() => setCategory(item.id)}
                      className="sr-only peer"
                    />
                    <div className="relative h-20 rounded-xl overflow-hidden border-2 border-[#cbc3d8] peer-checked:border-[#5e23dc] peer-checked:ring-2 peer-checked:ring-[#5e23dc]/20 transition-all group">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <span className="absolute bottom-1.5 left-1 right-1 text-center text-[10px] font-bold text-white drop-shadow leading-tight">
                        {item.name}
                      </span>
                      {category === item.id && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#5e23dc] rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-[10px]">check</span>
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              {category && (
                <p className="text-xs text-[#5e23dc] font-medium pl-1">
                  Selected: <strong>{category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</strong>
                </p>
              )}
            </div>

            {/* City / Locality */}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#191c1e]">City / Locality</label>
              <div className="border border-[#cbc3d8] rounded-xl bg-white px-4 py-3 flex items-center focus-within:border-[#5e23dc] transition-all">
                <span className="material-symbols-outlined text-[#7a7487] mr-3 text-lg">location_on</span>
                <input
                  type="text"
                  placeholder="e.g. Koramangala, Bangalore"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  required
                  className="w-full bg-transparent outline-none text-xs text-[#191c1e] placeholder:text-[#7a7487]"
                />
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
            >
              Continue to Onboarding
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </form>

          <p className="text-center text-[11px] text-[#7a7487]">
            Already registered as a provider?{' '}
            <Link href="/auth/login" className="text-[#5e23dc] font-bold hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
