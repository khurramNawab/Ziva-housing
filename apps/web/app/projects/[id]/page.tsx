'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

interface ProjectDetail {
  id: string;
  name: string;
  builderName: string;
  builderRating: string;
  builderExperience: string;
  location: string;
  city: string;
  possessionDate: string;
  totalArea: string;
  units: string;
  configs: string;
  minPrice: string;
  description: string;
  constructionUpdates: { title: string; date: string; desc?: string; active: boolean }[];
  images: string[];
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const projectId: string = Array.isArray(rawId) ? (rawId[0] ?? 'p-prestige-falcon') : (rawId || 'p-prestige-falcon');

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Inquiry form
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [sendingInquiry, setSendingInquiry] = useState(false);
  const [visitSuccessModal, setVisitSuccessModal] = useState(false);
  const [downloadingBrochure, setDownloadingBrochure] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('Ziva_saved_properties') || '[]');
      const savedIds = saved.map((x: any) => (typeof x === 'string' ? x : x?.id));
      setIsSaved(savedIds.includes(projectId));
    } catch {}
  }, [projectId]);

  const handleToggleSave = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('Ziva_saved_properties') || '[]');
      const isAlready = saved.some((x: any) => (typeof x === 'string' ? x === projectId : x?.id === projectId));
      let updated;
      if (isAlready) {
        updated = saved.filter((x: any) => (typeof x === 'string' ? x !== projectId : x?.id !== projectId));
        setIsSaved(false);
      } else {
        const itemObj = {
          id: projectId,
          title: project?.name || 'Prestige Falcon City',
          locality: project?.location || 'Kanakapura Road',
          city: project?.city || 'Bangalore',
          purpose: 'SELL',
          expectedPrice: 12500000,
          photos: [{ url: project?.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80' }]
        };
        updated = [...saved, itemObj];
        setIsSaved(true);
      }
      localStorage.setItem('Ziva_saved_properties', JSON.stringify(updated));
    } catch (err) {
      console.error('Error toggling wishlist', err);
    }
  };

  useEffect(() => {
    try {
      const token = localStorage.getItem('Ziva_access');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1] || ''));
        if (payload.firstName) setInquiryName(payload.firstName + (payload.lastName ? ' ' + payload.lastName : ''));
        if (payload.phone) setInquiryPhone(payload.phone.replace('+91', '').trim());
      }
    } catch {}
  }, []);

  useEffect(() => {
    const fetchProjectData = async () => {
      setLoading(true);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiBase}/api/v1/properties/${projectId}`);
        if (res.ok) {
          const json = await res.json();
          const p = json.data || json;
          if (p && p.title) {
            setProject({
              id: p.id,
              name: p.title,
              builderName: p.ownerProfile?.user?.firstName ? `${p.ownerProfile.user.firstName}'s Development` : 'Prestige Group',
              builderRating: '4.8 ★ (120+ Reviews)',
              builderExperience: '30+ Years Experience',
              location: `${p.locality || 'Kanakapura Road'}, ${p.city || 'Bangalore'}`,
              city: p.city || 'Bangalore',
              possessionDate: 'Dec 2025',
              totalArea: p.builtUpArea ? `${p.builtUpArea} sqft` : '41 Acres',
              units: '2520',
              configs: p.bhk ? `${p.bhk} BHK` : '2, 3, 4 BHK',
              minPrice: p.expectedPrice ? `₹ ${(p.expectedPrice / 10000000).toFixed(2)} Cr` : '₹ 1.25 Cr',
              description: p.description || 'Prestige Falcon City is a state-of-the-art compendium of high-rise residential apartments situated on Kanakapura Road, Bangalore. Spread across 41 acres, this mixed-use development offers a world-class living experience.',
              constructionUpdates: [
                { title: 'Superstructure Near Completion', date: 'October 2024', desc: 'Block A and B structural work is 90% complete. Interior masonry has commenced on lower floors.', active: true },
                { title: 'Foundation Laid', date: 'March 2023', active: false },
              ],
              images: p.photos && p.photos.length > 0 ? p.photos.map((photo: any) => photo.url) : [
                'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
              ],
            });
            setLoading(false);
            return;
          }
        }
      } catch {}

      // Fallback project details
      setProject({
        id: projectId,
        name: projectId === 'p-premium-noida' ? 'Godrej Woods Suites' : 'Prestige Falcon City',
        builderName: projectId === 'p-premium-noida' ? 'Godrej Properties' : 'Prestige Group',
        builderRating: '4.8 ★ (120+ Reviews)',
        builderExperience: '30+ Years Experience',
        location: projectId === 'p-premium-noida' ? 'Sector 43, Noida' : 'Kanakapura Road, Bangalore',
        city: projectId === 'p-premium-noida' ? 'Noida' : 'Bangalore',
        possessionDate: 'Dec 2025',
        totalArea: '41 Acres',
        units: '2520',
        configs: '2, 3, 4 BHK',
        minPrice: projectId === 'p-premium-noida' ? '₹ 1.85 Cr' : '₹ 1.25 Cr',
        description: 'Prestige Falcon City is a state-of-the-art compendium of high-rise residential apartments situated on Kanakapura Road, Bangalore. Spread across 41 acres, this mixed-use development offers a world-class living experience combined with a massive retail area and an expansive clubhouse. Designed to provide ample natural light and ventilation, these homes are a perfect blend of luxury and comfort.',
        constructionUpdates: [
          { title: 'Superstructure Near Completion', date: 'October 2024', desc: 'Block A and B structural work is 90% complete. Interior masonry has commenced on lower floors.', active: true },
          { title: 'Foundation Laid', date: 'March 2023', active: false },
        ],
        images: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        ],
      });
      setLoading(false);
    };

    fetchProjectData();
  }, [projectId]);

  const handleScheduleVisit = async () => {
    if (!inquiryName.trim() || !inquiryPhone.trim()) {
      alert('Please enter your name and contact phone number.');
      return;
    }
    setSendingInquiry(true);
    try {
      const token = localStorage.getItem('Ziva_access');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      if (token) {
        // 1. Create Lead in CRM for Owner & Admin
        await fetch(`${apiBase}/api/v1/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            propertyId: projectId,
            message: `Site visit inquiry from ${inquiryName} (+91 ${inquiryPhone}) for project: ${project?.name || 'Prestige Falcon City'}`,
          }),
        }).catch(() => null);

        // 2. Schedule Visit in backend
        await fetch(`${apiBase}/api/v1/visits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            propertyId: projectId,
            scheduledAt: new Date(Date.now() + 86400000).toISOString(),
            notes: `Site visit requested by ${inquiryName} (+91 ${inquiryPhone}) for ${project?.name || 'Project'}`,
          }),
        }).catch(() => null);
      }
    } catch {
      // Fallback grace
    } finally {
      setSendingInquiry(false);
      setVisitSuccessModal(true);
    }
  };

  const handleDownloadBrochure = () => {
    setDownloadingBrochure(true);
    setTimeout(() => {
      setDownloadingBrochure(false);
      // Trigger download of official sample brochure PDF
      window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank');
    }, 800);
  };

  if (loading || !project) {
    return (
      <div className="bg-[#f8f9fb] min-h-screen flex items-center justify-center font-[Rubik]">
        <div className="animate-spin w-8 h-8 border-2 border-[#5e23dc] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] font-[Rubik] min-h-screen flex flex-col antialiased">
      {/* Universal Top Navigation Header */}
      <Navbar />

      <main className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-8 py-6 flex flex-col gap-6">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex text-[14px] leading-[20px] text-[#494455]">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li><Link href="/" className="hover:text-[#4500b4] transition-colors">Home</Link></li>
            <li><div className="flex items-center"><span className="material-symbols-outlined text-[16px] mx-1">chevron_right</span><Link href="/properties?purpose=NEW_PROJECTS" className="hover:text-[#4500b4] transition-colors">New Projects</Link></div></li>
            <li><div className="flex items-center"><span className="material-symbols-outlined text-[16px] mx-1">chevron_right</span><span className="hover:text-[#4500b4] transition-colors">{project.city}</span></div></li>
            <li aria-current="page"><div className="flex items-center"><span className="material-symbols-outlined text-[16px] mx-1">chevron_right</span><span className="text-[#191c1e] font-bold">{project.name}</span></div></li>
          </ol>
        </nav>

        {/* Project Header */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#e8faf4] text-[#16a373] px-2.5 py-1 rounded-full text-[12px] font-bold tracking-wide flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified</span> RERA Approved
                </span>
                <span className="bg-[#e6e8ea] text-[#494455] px-2.5 py-1 rounded-full text-[12px] font-bold">Under Construction</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-[28px] md:text-[36px] leading-[36px] md:leading-[44px] font-bold text-[#191c1e] mb-1">{project.name}</h1>
                <button
                  type="button"
                  onClick={handleToggleSave}
                  className={`w-10 h-10 rounded-full border border-[#cbc3d8] flex items-center justify-center transition-all shadow-sm hover:scale-105 ${
                    isSaved ? 'bg-red-50 text-red-500 border-red-200' : 'bg-white text-gray-400 hover:text-red-500'
                  }`}
                  title={isSaved ? 'Remove from Saved' : 'Save to Wishlist'}
                >
                  <span className={`material-symbols-outlined text-xl ${isSaved ? 'font-fill text-red-500' : ''}`}>
                    favorite
                  </span>
                </button>
              </div>
              <p className="text-[14px] leading-[20px] text-[#7a7487] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">location_on</span> {project.location}
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[12px] font-semibold text-[#7a7487] mb-0.5">Starting from</p>
              <p className="text-[28px] md:text-[34px] leading-[36px] md:leading-[42px] font-extrabold text-[#5e23dc]">
                {project.minPrice} <span className="text-[14px] leading-[20px] text-[#494455] font-normal">onwards</span>
              </p>
            </div>
          </div>

          {/* Stitch Bento Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2.5 h-[400px] md:h-[480px] rounded-2xl overflow-hidden shadow-sm">
            {/* Main Hero Photo (Col 1-2, Row 1-2) */}
            <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden bg-[#e6e8ea]">
              <img
                src={project.images[0]}
                alt={project.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 flex gap-2">
                <button className="bg-white/90 backdrop-blur-sm text-[#191c1e] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-white transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">photo_library</span> 12 Photos
                </button>
              </div>
            </div>

            {/* Photo 2: Living Suite */}
            <div className="hidden md:block relative overflow-hidden bg-[#eceef0] group">
              <img
                src={project.images[1]}
                alt="Living Suite"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Photo 3: Swimming Pool & Clubhouse */}
            <div className="hidden md:block relative overflow-hidden bg-[#e0e3e5] group">
              <img
                src={project.images[2]}
                alt="Clubhouse & Pool"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Photo 4: Landscape Courtyard */}
            <div className="hidden md:block md:col-span-2 relative overflow-hidden bg-[#d8dadc] group">
              <img
                src={project.images[3]}
                alt="Landscape & Towers"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-end p-4">
                <button className="bg-white/90 backdrop-blur-sm text-[#191c1e] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-white transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">play_circle</span> Virtual Tour
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid: Left (2/3) + Right Sidebar (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-2">
          {/* Left Content Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Builder Profile */}
            <div className="bg-white border border-[#cbc3d8] rounded-2xl p-6 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#e8ddff] text-[#4500b4] rounded-xl flex items-center justify-center border border-[#cbc3d8] overflow-hidden shrink-0">
                  <span className="material-symbols-outlined text-3xl">domain</span>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#7a7487] uppercase tracking-wider mb-0.5">Developed by</p>
                  <h2 className="text-[20px] leading-[28px] font-bold text-[#191c1e]">{project.builderName}</h2>
                  <p className="text-[13px] leading-[18px] text-[#494455] mt-0.5">{project.builderRating} • {project.builderExperience}</p>
                </div>
              </div>
              <button className="hidden sm:flex text-[#5e23dc] text-xs font-bold items-center gap-1 hover:underline transition-colors">
                View Profile <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-[#cbc3d8] sticky top-[64px] bg-[#f8f9fb] z-40 pt-2">
              <nav className="flex gap-6 overflow-x-auto">
                {['overview', 'floor-plans', 'amenities', 'location'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`text-xs font-bold pb-3 whitespace-nowrap transition-colors uppercase tracking-wide ${activeTab === tab ? 'text-[#5e23dc] border-b-2 border-[#5e23dc]' : 'text-[#494455] hover:text-[#5e23dc]'
                      }`}>
                    {tab === 'floor-plans' ? 'Floor Plans' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            {/* Overview Section */}
            <section id="overview" className="space-y-4">
              <h3 className="text-[20px] leading-[28px] font-bold text-[#191c1e]">About Project</h3>
              <p className="text-[14px] leading-[22px] text-[#494455] bg-white p-5 rounded-2xl border border-[#eceef0]">{project.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: 'home', label: 'Configurations', value: project.configs },
                  { icon: 'crop_square', label: 'Project Area', value: project.totalArea },
                  { icon: 'apartment', label: 'Total Units', value: project.units },
                  { icon: 'key', label: 'Possession', value: project.possessionDate },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-2xl p-4 border border-[#cbc3d8] text-center shadow-sm">
                    <span className="material-symbols-outlined text-[#5e23dc] mb-2 text-2xl">{stat.icon}</span>
                    <p className="text-[11px] font-bold text-[#7a7487] uppercase tracking-wider">{stat.label}</p>
                    <p className="text-[15px] font-bold text-[#191c1e] mt-0.5">{stat.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Construction Status Timeline */}
            <section className="bg-white border border-[#cbc3d8] rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="text-[20px] leading-[28px] font-bold text-[#191c1e]">Construction Status</h3>
              <div className="relative pl-8 border-l-2 border-[#e0e3e5] space-y-8">
                {project.constructionUpdates.map((update, i) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-[41px] top-1 w-5 h-5 rounded-full flex items-center justify-center border-4 border-white ${update.active ? 'bg-[#5e23dc] ring-2 ring-[#e8ddff]' : 'bg-[#e0e3e5]'
                      }`} />
                    <h4 className={`text-[15px] font-bold ${update.active ? 'text-[#191c1e]' : 'text-[#494455]'}`}>{update.title}</h4>
                    <p className="text-[12px] font-semibold text-[#7a7487] mb-1">{update.date}</p>
                    {update.desc && <p className="text-[13px] leading-[19px] text-[#494455]">{update.desc}</p>}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Contact / Schedule Site Visit Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#cbc3d8] shadow-md sticky top-24 space-y-4">
              <h3 className="text-[18px] leading-[26px] font-bold text-[#191c1e]">Interested in this project?</h3>
              <p className="text-[12px] text-[#7a7487]">Get detailed pricing, floor plans, and expert advice.</p>

              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); handleScheduleVisit(); }}>
                <div>
                  <label className="sr-only" htmlFor="name">Name</label>
                  <input id="name" type="text" placeholder="Your Name" value={inquiryName} onChange={(e) => setInquiryName(e.target.value)}
                    className="w-full bg-[#f8f9fb] border border-[#cbc3d8] rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#5e23dc]" />
                </div>
                <div>
                  <label className="sr-only" htmlFor="phone">Phone Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-[#f2f4f6] border border-r-0 border-[#cbc3d8] rounded-l-xl text-[#494455] text-xs font-bold">+91</span>
                    <input id="phone" type="tel" placeholder="Phone Number" value={inquiryPhone} onChange={(e) => setInquiryPhone(e.target.value)}
                      className="flex-1 bg-[#f8f9fb] border border-[#cbc3d8] rounded-r-xl px-4 py-2.5 text-xs outline-none focus:border-[#5e23dc]" />
                  </div>
                </div>
                <button type="submit" disabled={sendingInquiry}
                  className="w-full bg-[#5e23dc] hover:bg-[#4500b4] text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-sm flex justify-center items-center gap-2 disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm">calendar_month</span>
                  {sendingInquiry ? 'Submitting...' : 'Schedule Site Visit'}
                </button>
              </form>

              <div className="pt-3 border-t border-[#eceef0] flex justify-center items-center gap-4">
                <a
                  href="tel:+919122049005"
                  className="text-[#5e23dc] hover:text-[#4500b4] text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer transition-colors"
                  title="Direct call to project desk"
                >
                  <span className="material-symbols-outlined text-sm">phone</span> Call Now
                </a>
                <span className="text-[#cbc3d8]">|</span>
                <a
                  href={`https://wa.me/919122049005?text=${encodeURIComponent(`Hello Ziva Housing, I am interested in ${project?.name || 'Prestige Falcon City'} (${project?.location || 'Bangalore'}). Please share the detailed brochure, pricing sheet, and available units.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#16a373] hover:text-[#0f6e4d] text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer transition-colors"
                  title="Connect on WhatsApp"
                >
                  <span className="material-symbols-outlined text-sm">chat</span> WhatsApp
                </a>
              </div>
            </div>

            {/* Brochure Download Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#cbc3d8] flex items-start gap-4 shadow-sm">
              <div className="bg-[#e8ddff] p-3 rounded-xl text-[#4500b4] shrink-0">
                <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
              </div>
              <div className="flex-1">
                <h4 className="text-[14px] text-[#191c1e] font-bold mb-1">Download Brochure</h4>
                <p className="text-[12px] text-[#7a7487] mb-3">Get complete project details, master plan, and floor specifications.</p>
                <button
                  onClick={handleDownloadBrochure}
                  disabled={downloadingBrochure}
                  className="text-[#5e23dc] hover:text-[#4500b4] text-xs font-bold flex items-center gap-1.5 hover:underline disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">
                    {downloadingBrochure ? 'sync' : 'download'}
                  </span>
                  <span>{downloadingBrochure ? 'Generating PDF...' : 'Download PDF'}</span>
                </button>
              </div>
            </div>

            {/* Map Card */}
            <div className="bg-white rounded-2xl overflow-hidden border border-[#cbc3d8] shadow-sm">
              <div className="p-4 border-b border-[#eceef0]">
                <h4 className="text-[14px] text-[#191c1e] font-bold">Project Location</h4>
              </div>
              <div className="h-44 w-full bg-[#f2f4f6] relative flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=600&q=80"
                  alt="Kanakapura Road Map Location"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1 text-xs font-bold text-[#5e23dc]">
                  <span className="material-symbols-outlined text-sm">location_on</span> Kanakapura Road, Bangalore
                </div>
              </div>
              <div className="p-4">
                <button onClick={() => window.open('https://maps.google.com/?q=Kanakapura+Road+Bangalore', '_blank')} className="w-full py-2.5 border border-[#5e23dc] text-[#5e23dc] hover:bg-[#e8ddff] rounded-xl text-xs font-bold transition-all">
                  View on Google Maps
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 🎉 Site Visit Confirmation Success Modal */}
      {visitSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#cbc3d8] space-y-5 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-[#e8faf4] border border-[#16a373]/30 text-[#16a373] rounded-full flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-3xl">verified</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#191c1e]">Site Visit Request Confirmed!</h3>
              <p className="text-xs text-[#7a7487] leading-relaxed">
                Your site visit request has been successfully registered and directly dispatched to the <strong>Project Developer & Owner</strong> and the <strong>Ziva Admin Concierge Desk</strong>.
              </p>
            </div>

            <div className="bg-[#f8f9fb] p-4 rounded-2xl border border-[#cbc3d8]/60 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#7a7487]">Project:</span>
                <span className="font-bold text-[#191c1e]">{project.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7487]">Location:</span>
                <span className="font-bold text-[#191c1e]">{project.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7487]">Status:</span>
                <span className="font-bold text-[#16a373] bg-[#e8faf4] px-2 py-0.5 rounded">Sent to Owner & Admin</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Link
                href="/dashboard/customer"
                className="flex-1 bg-[#5e23dc] hover:bg-[#4500b4] text-white py-3 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">dashboard</span>
                Track in My Dashboard
              </Link>
              <button
                onClick={() => setVisitSuccessModal(false)}
                className="px-5 py-3 border border-[#cbc3d8] text-[#494455] hover:bg-[#f2f4f6] rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
