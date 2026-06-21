import { useState } from 'react';
import type { ExperimentRecord, ECCMethod } from '../shared/types';
import { saveExperimentToHistory } from '../shared/metrics_logger';
import { runImageExperiment, runAudioExperiment, runVideoExperiment, extractImagePipeline, extractAudioPipeline, extractVideoPipeline, runCodecExperiment } from '../modules/pipeline';
import { Modal } from './Modal';

export const UploadPanel = ({ onComplete }: { onComplete: (r: ExperimentRecord, stegoBlob: Blob) => void }) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [embedMethod, setEmbedMethod] = useState<string>('lsb');
  const [eccMethod, setEccMethod] = useState<ECCMethod>('none');
  const [compression, setCompression] = useState<string>('none');

  const [mode, setMode] = useState<'embedding' | 'extraction' | 'codec'>('embedding');
  const [extractedPayload, setExtractedPayload] = useState<string | null>(null);
  const [codecResult, setCodecResult] = useState<{ratio: number, original: number, compressed: number, time: number, blob: Blob} | null>(null);
  
  // Custom Modal State
  const [modal, setModal] = useState<{title: string, message: string} | null>(null);

  const fileType = file?.type.split('/')[0] || 'image';

  const compressionOptions = () => {
      if (fileType === 'audio') {
          return (
              <>
                <option value="none">Tanpa Serangan (None / Clean Channel)</option>
                <option value="adpcm_8bit">Kompresi ADPCM 8-bit Ringan (Light)</option>
                <option value="adpcm_6bit">Kompresi ADPCM 6-bit Sedang (Medium)</option>
                <option value="adpcm_4bit">Kompresi ADPCM 4-bit Berat (Heavy)</option>
              </>
          );
      }
      if (fileType === 'video') {
          return (
              <>
                <option value="none">Tanpa Serangan (None / Clean Channel)</option>
                <option value="frame_diff_rle">Kompresi Frame Differencing (Frame Diff + RLE)</option>
              </>
          );
      }
      return (
          <>
             <option value="none">Tanpa Serangan (None / Clean Channel)</option>
             <option value="dct">Simulasi DCT Ringan (Simulate Custom DCT Loss)</option>
             <option value="jpeg_q90">Kompresi JPEG Q90 Ringan (Light)</option>
             <option value="jpeg_q70">Kompresi JPEG Q70 Sedang (Medium)</option>
             <option value="jpeg_q50">Kompresi JPEG Q50 Berat (Heavy)</option>
          </>
      );
  };

  const handleRun = async () => {
    if (!file) return setModal({ title: 'Peringatan', message: 'Silakan pilih file media terlebih dahulu.' });
    setLoading(true);
    setExtractedPayload(null);
    setCodecResult(null);

    try {
      if (mode === 'codec') {
          if (fileType !== 'image') {
              throw new Error("Algoritma kompresi RLE saat ini hanya didukung untuk format Gambar (PNG/JPEG).");
          }
          const result = await runCodecExperiment(file);
          setCodecResult({
              ratio: result.compression_ratio,
              original: result.file_size_bytes_before,
              compressed: result.file_size_bytes_after,
              time: result.processing_time_ms,
              blob: result.reconstructedBlob
          });
          setLoading(false);
          return;
      }

      if (mode === 'extraction') {
         let result;
         if (fileType === 'image') result = await extractImagePipeline(file);
         else if (fileType === 'audio') result = await extractAudioPipeline(file);
         else if (fileType === 'video') result = await extractVideoPipeline(file);
         else throw new Error("Format media tidak didukung.");
         
         if (result.isValid && result.message) {
            setExtractedPayload(result.message);
         } else {
            setModal({ title: 'Ekstraksi Gagal', message: 'File mungkin rusak, tidak mengandung pesan steganografi, atau CRC tidak valid.' });
         }
         setLoading(false);
         return;
      }

      let result;
      if (fileType === 'image') {
          result = await runImageExperiment(file, message, embedMethod, eccMethod, compression);
      } else if (fileType === 'audio') {
          result = await runAudioExperiment(file, message, embedMethod, eccMethod, compression);
      } else if (fileType === 'video') {
          result = await runVideoExperiment(file, message, embedMethod, eccMethod, compression);
      } else {
          throw new Error("Format media tidak didukung.");
      }
      
      saveExperimentToHistory(result.record);
      onComplete(result.record, result.stegoBlob);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan internal.';
      setModal({ title: 'Terjadi Kesalahan', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="bg-white border border-slate-200 rounded-md shadow-sm p-5 relative">
      <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
        <button
          onClick={() => setMode('embedding')}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'embedding' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Embedding
        </button>
        <button
          onClick={() => setMode('extraction')}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'extraction' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Extraction
        </button>
        <button
          onClick={() => setMode('codec')}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'codec' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Codec (RLE)
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Pilih Sumber Media</label>
          <input type="file" id="media-upload" accept="image/png, image/jpeg, audio/wav, video/mp4" className="hidden" onChange={e => {
              setFile(e.target.files?.[0] || null);
              setCompression('none'); 
              setEmbedMethod('lsb');
          }} />
          <label htmlFor="media-upload" className="inline-block bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-semibold py-2 px-4 rounded-md cursor-pointer mr-3">
             Choose Media
          </label>
          <span className="text-sm text-slate-500">
             {file ? file.name : "Tidak ada file yang dipilih"}
          </span>
        </div>

        {mode === 'embedding' && (
          <>
            <div>
               <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Masukan Pesan Rahasia</label>
               <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Masukkan pesan rahasia..." className="w-full border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" rows={2}></textarea>
            </div>
            <div className="space-y-3">
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Metode Penyisipan</label>
                    <select value={embedMethod} onChange={e => setEmbedMethod(e.target.value)} className="w-full border border-slate-200 rounded text-xs p-2 focus:outline-none">
                        <option value="lsb">Standar LSB (Standard LSB)</option>
                        <option value="lsb_opap">LSB + Penyesuaian Piksel (LSB + OPAP)</option>
                        {fileType === 'image' && <option value="dct_domain">Simulasi Domain Frekuensi (DCT-Domain)</option>}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Error Correction (ECC)</label>
                    <select value={eccMethod} onChange={e => setEccMethod(e.target.value as ECCMethod)} className="w-full border border-slate-200 rounded text-xs p-2 focus:outline-none">
                        <option value="none">Tanpa Proteksi (None)</option>
                        <option value="repetition3">Pengulangan 3x (Repetition 3x)</option>
                        <option value="hamming74">Kode Hamming 7,4 (Hamming 7,4)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Simulasi Serangan (Robustness Attack)</label>
                    <select value={compression} onChange={e => setCompression(e.target.value)} className="w-full border border-slate-200 rounded text-xs p-2 focus:outline-none">
                        {compressionOptions()}
                    </select>
                    <div className="mt-1 text-[9px] text-slate-400 italic">
                       {compression.includes('q50') || compression.includes('4bit') ? 'Rekomendasi: Gunakan Hamming (7,4) untuk kompresi berat.' : 'Rekomendasi: None / Repetition (3x) untuk media bersih.'}
                    </div>
                </div>
            </div>
            <button onClick={handleRun} disabled={loading || !file} className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3 rounded-md transition-colors mt-2 shadow-sm disabled:opacity-50">
              {loading ? 'Sedang Memproses...' : 'Jalankan Eksperimen'}
            </button>
          </>
        )}

        {mode === 'extraction' && (
          <>
            <button onClick={handleRun} disabled={loading || !file} className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3 rounded-md transition-colors mt-2 shadow-sm disabled:opacity-50">
              {loading ? 'Mengekstrak...' : 'Ekstrak Pesan'}
            </button>
            {extractedPayload && (
              <div className="mt-4 p-4 border border-slate-200 bg-white rounded-lg shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pesan Berhasil Diekstrak</h3>
                <div className="text-sm font-semibold text-slate-900 break-words">
                  {extractedPayload}
                </div>
              </div>
            )}
          </>
        )}

        {mode === 'codec' && (
          <>
            <button onClick={handleRun} disabled={loading || !file} className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3 rounded-md transition-colors mt-2 shadow-sm disabled:opacity-50">
              {loading ? 'Sedang Memproses...' : 'Kompres & Dekompres (RLE)'}
            </button>
            {codecResult && (
              <div className="mt-4 p-4 border border-slate-200 bg-white rounded-lg shadow-sm">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hasil Codec RLE</h3>
                 <div className="text-sm font-semibold text-slate-900 mb-2">Rasio Kompresi: {codecResult.ratio.toFixed(4)}x</div>
                 <div className="text-xs text-slate-500 mb-4">
                    Original: {(codecResult.original/1024).toFixed(2)} KB &rarr; Compressed: {(codecResult.compressed/1024).toFixed(2)} KB <br/>
                    (Waktu: {codecResult.time.toFixed(2)} ms)
                 </div>
                 <button onClick={() => {
                     const url = URL.createObjectURL(codecResult.blob);
                     const a = document.createElement('a'); a.href = url; a.download = 'decompressed_rle.png'; a.click();
                     URL.revokeObjectURL(url);
                 }} className="w-full text-xs font-bold border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-md transition-colors">
                    Unduh Hasil Dekompresi
                 </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>

    {modal && (
      <Modal title={modal.title} message={modal.message} onClose={() => setModal(null)} />
    )}
    </>
  );
};
