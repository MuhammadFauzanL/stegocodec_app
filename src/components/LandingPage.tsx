import React from 'react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="flex h-screen w-full bg-[#FAFAFA] text-slate-900 font-sans selection:bg-blue-200">
      {/* Left Panel */}
      <div className="w-full lg:w-5/12 flex flex-col justify-between items-center p-8 lg:p-12 bg-white relative z-20 shadow-2xl">
        {/* Spacer for top balance */}
        <div className="w-full"></div>

        <div className="w-full max-w-md flex flex-col items-center text-center">
          
          <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">StegoCodec Studio</h1>
          <p className="text-sm text-slate-500 mb-10 leading-relaxed max-w-sm">
            Selamat datang di platform interaktif steganografi dan codec multimedia. Uji efisiensi algoritma kompresi dan ketahanan penyisipan data Anda.
          </p>

          <button 
            onClick={onEnter}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-slate-900/30 flex items-center justify-center space-x-2"
          >
            <span>Masuk Aplikasi</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
        
        {/* Bottom copyright */}
        <div className="w-full text-center text-xs text-slate-400 mt-8">
          &copy; {new Date().getFullYear()} StegoCodec Studio. Hak Cipta Dilindungi.
        </div>
      </div>

      {/* Right Panel (Image) */}
      <div className="hidden lg:block lg:w-7/12 relative bg-slate-900 overflow-hidden">
        <img 
          src="/OIP.jpg" 
          alt="StegoCodec Background" 
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        {/* Soft overlay so the text card is readable without hiding the photo */}
        <div className="absolute inset-0 bg-slate-900/20 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent z-10"></div>
        
        {/* Floating Glass Card */}
        <div className="absolute inset-0 z-20 flex flex-col justify-center items-center p-16">
           <div className="bg-white/10 backdrop-blur-md border border-white/20 p-10 rounded-3xl max-w-lg shadow-2xl">
              <h2 className="text-lg font-semibold text-white mb-1">StegoCodec Studio</h2>
              <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">Hello!</h1>
              <p className="text-xl font-medium text-white mb-4 italic">"Keamanan Lebih Baik, Efisiensi Lebih Tinggi"</p>
              <p className="text-sm text-slate-200 leading-relaxed">
                 Platform evaluasi steganografi dan kompresi multimedia yang interaktif, akurat, dan mudah digunakan.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};
