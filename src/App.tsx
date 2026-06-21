import React, { useState, useEffect } from 'react';
import { MetricsDashboard } from './components/MetricsDashboard';
import { UploadPanel } from './components/UploadPanel';
import { RecentExperimentsPanel } from './components/RecentExperimentsPanel';
import { CompareExperimentsPanel } from './components/CompareExperimentsPanel';
import { ConfigImportPanel } from './components/ConfigImportPanel';
import { AboutPanel } from './components/AboutPanel';
import type { ExperimentRecord } from './shared/types';

type NavTab = 'encode' | 'history' | 'compare' | 'about';

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function useLiveClock() {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return now;
}

function App() {
  const [currentRecord, setCurrentRecord] = useState<ExperimentRecord | null>(null);
  const [stegoBlob, setStegoBlob] = useState<Blob | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('encode');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const now = useLiveClock();

  const handleComplete = (record: ExperimentRecord, blob: Blob) => {
      setCurrentRecord(record);
      setStegoBlob(blob);
  };

  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dayStr = DAYS_ID[now.getDay()];
  const dateStr = `${dayStr}, ${now.getDate()} ${MONTHS_ID[now.getMonth()].substring(0,3)} ${now.getFullYear()}`;

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'encode',
      label: 'Encode & Extract',
      icon: <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
    },
    {
      id: 'history',
      label: 'Decode & History',
      icon: <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      id: 'compare',
      label: 'Compare Metrik',
      icon: <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    },
    {
      id: 'about',
      label: 'Tentang Aplikasi',
      icon: <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
  ];

  return (
    <div className="flex h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-blue-200 overflow-hidden">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`
        ${sidebarOpen ? 'translate-x-0 lg:w-64' : '-translate-x-full lg:w-0 lg:border-r-0'}
        fixed lg:relative inset-y-0 left-0 z-30
        w-64 bg-white border-r border-slate-200 h-full shrink-0 shadow-sm
        transition-all duration-300 ease-in-out overflow-hidden
      `}>
        {/* Inner fixed-width container to prevent squishing during animation */}
        <div className="w-64 h-full flex flex-col">
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight">StegoCodec</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-md hover:bg-slate-100 text-slate-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Nav */}
          <nav className="p-4 flex-1 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); if(window.innerWidth < 1024) setSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === item.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* CLOCK BOTTOM SECTION (Figma Style) */}
          <div className="border-t border-slate-200 p-6 text-center">
            <div className="text-[40px] font-bold text-slate-800 leading-none tracking-tight">
              {timeStr.replace('.', ':')}
            </div>
            <div className="text-[15px] font-medium text-slate-400 mt-2">
              {dateStr}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar (with hamburger) */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm lg:shadow-none">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-sm font-semibold text-slate-800 capitalize">
              {activeTab === 'encode' ? 'Encode & Extract' : 
               activeTab === 'history' ? 'Decode & History' : 
               activeTab === 'about' ? 'Tentang Aplikasi' : 'Compare Metrik'}
            </h1>
          </div>
          {/* Mobile clock mini */}
          <div className="lg:hidden text-xs text-slate-500">{timeStr}</div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">
               {activeTab === 'encode' && (
                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                       <div className="lg:col-span-4">
                           <UploadPanel onComplete={handleComplete} />
                       </div>
                       <div className="lg:col-span-8">
                           {currentRecord ? (
                              <MetricsDashboard record={currentRecord} stegoBlob={stegoBlob} />
                           ) : (
                              <div className="border border-dashed border-slate-300 rounded-lg p-16 text-center text-slate-500 bg-white shadow-sm flex flex-col items-center justify-center min-h-[300px] h-full">
                                 <p className="text-base font-medium text-slate-700">Belum Ada Eksperimen Aktif</p>
                                 <p className="text-sm mt-2 text-slate-400 max-w-sm">Isi parameter di sebelah kiri dan jalankan eksperimen untuk melihat metrik di sini.</p>
                              </div>
                           )}
                       </div>
                   </div>
               )}

               {activeTab === 'history' && (
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                       <div className="space-y-6">
                          <h2 className="text-xl font-bold text-slate-900 mb-4">Import Konfigurasi</h2>
                          <ConfigImportPanel />
                       </div>
                       <div className="space-y-6">
                          <h2 className="text-xl font-bold text-slate-900 mb-4">Riwayat Eksperimen</h2>
                          <RecentExperimentsPanel />
                       </div>
                   </div>
               )}

               {activeTab === 'compare' && (
                   <div className="space-y-6">
                      <h2 className="text-xl font-bold text-slate-900 mb-4">Perbandingan Metrik</h2>
                      <CompareExperimentsPanel />
                   </div>
               )}

               {activeTab === 'about' && (
                   <div className="space-y-6">
                      <AboutPanel />
                   </div>
               )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

