export const AboutPanel = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm p-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Tentang StegoCodec Studio</h2>
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left: Original Description */}
        <div className="xl:col-span-5 space-y-4 text-slate-600 leading-relaxed text-sm">
          <p>
            <strong>StegoCodec Studio</strong> adalah platform eksperimen komprehensif untuk pengujian algoritma steganografi dan kompresi media (Gambar, Audio, dan Video). Sistem ini dirancang untuk memfasilitasi siklus pengujian otomatis (Pipeline) yang mencakup proses penyisipan pesan (Embedding), simulasi serangan/kompresi (Robustness Attack), dan ekstraksi pesan (Extraction).
          </p>
          <p className="font-medium text-slate-800 mt-6">Fitur Utama:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Multi-Format & Standalone Codec:</strong> Mendukung manipulasi file Gambar, Audio, dan Video. Memiliki mode eksekusi <strong>Codec (RLE)</strong> mandiri untuk melakukan kompresi/dekompresi secara terpisah dari steganografi.</li>
            <li><strong>Algoritma Steganografi:</strong> Tersedia metode LSB, LSB + OPAP (Optimized Pixel Adjustment Process), dan pendekatan simulasi DCT-Domain.</li>
            <li><strong>Adaptive ECC Recommendation:</strong> Fitur Error Correction Code (Repetition & Hamming) yang dilengkapi sistem rekomendasi dinamis untuk memandu pengguna memilih proteksi yang tepat saat menghadapi serangan.</li>
            <li><strong>Analisis Metrik Otomatis:</strong> Menghitung Rasio Kompresi, Utilisasi Payload, BER, PSNR, SNR, serta integritas (CRC32) dengan visualisasi grafik interaktif.</li>
          </ul>
        </div>

        {/* Right: Glossary Table */}
        <div className="xl:col-span-7">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-800 w-1/4">Istilah & Algoritma</th>
                  <th className="px-4 py-3 font-semibold text-slate-800">Penjelasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900 align-top">Steganografi</td>
                  <td className="px-4 py-3 text-slate-600">Seni menyembunyikan pesan rahasia di dalam media (gambar/audio/video) agar tidak disadari keberadaannya oleh pihak ketiga.</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900 align-top">Codec & Encode</td>
                  <td className="px-4 py-3 text-slate-600"><strong>Codec</strong>: Fitur algoritma mandiri untuk menekan ukuran data asli (contoh: kompresi RLE). <strong>Encode/Decode</strong>: Proses memasukkan/mengeluarkan data.</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900 align-top">LSB</td>
                  <td className="px-4 py-3 text-slate-600"><strong>Least Significant Bit</strong>. Teknik dasar mengganti bit paling tidak signifikan dari data media dengan bit pesan rahasia.</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900 align-top">OPAP</td>
                  <td className="px-4 py-3 text-slate-600"><strong>Optimized Pixel Adjustment</strong>. Peningkatan dari LSB yang menyesuaikan nilai piksel di sekitarnya untuk menekan error visual (MSE).</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900 align-top">Simulasi DCT</td>
                  <td className="px-4 py-3 text-slate-600">Pemodelan konseptual penyisipan data pada frekuensi ruang gambar. Secara teori dirancang agar kebal terhadap kompresi JPEG.</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900 align-top">ECC</td>
                  <td className="px-4 py-3 text-slate-600"><strong>Error Correction Code</strong>. Sistem perbaikan error (Repetition/Hamming) dengan panduan otomatis untuk mendeteksi tingkat keparahan serangan kompresi.</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900 align-top">BER</td>
                  <td className="px-4 py-3 text-slate-600"><strong>Bit Error Rate</strong>. Rasio pesan yang rusak saat diekstrak. Angka 0% berarti pesan terekstrak utuh tanpa cacat.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
