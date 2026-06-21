import { useState, useEffect } from 'react';
import { getExperimentHistory } from '../shared/metrics_logger';
import type { ExperimentRecord } from '../shared/types';
import { ExperimentCharts } from './ExperimentCharts';

export const CompareExperimentsPanel = () => {
   const [history, setHistory] = useState<ExperimentRecord[]>([]);
   const [expAId, setExpAId] = useState<string>('');
   const [expBId, setExpBId] = useState<string>('');

   useEffect(() => {
       const interval = setInterval(() => {
           setHistory(getExperimentHistory());
       }, 1000);
       return () => clearInterval(interval);
   }, []);

   const expA = history.find(h => h.experiment_id === expAId);
   const expB = history.find(h => h.experiment_id === expBId);

   const renderRow = (label: string, valA: string | number | boolean, valB: string | number | boolean) => (
       <tr key={label} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
           <td className="py-2 px-4 text-xs font-medium text-slate-500 w-1/3">{label}</td>
           <td className="py-2 px-4 text-xs font-medium text-slate-900 w-1/3 border-l border-slate-100">{valA}</td>
           <td className="py-2 px-4 text-xs font-medium text-slate-900 w-1/3 border-l border-slate-100">{valB}</td>
       </tr>
   );

   return (
      <div className="bg-white border border-slate-200 rounded-md shadow-sm">
         <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold">Bandingkan Eksperimen</h2>
            <p className="text-xs text-slate-500 mt-1">Pilih dua eksperimen dari riwayat untuk membandingkan metriknya secara berdampingan.</p>
         </div>
         <div className="p-5 border-b border-slate-100 flex items-center justify-center space-x-4 bg-slate-50">
            <select value={expAId} onChange={e => setExpAId(e.target.value)} className="w-64 text-xs p-2 border border-slate-200 rounded focus:outline-none">
                <option value="">Pilih Eksperimen A</option>
                {history.map(h => <option key={h.experiment_id} value={h.experiment_id}>{h.experiment_id} ({h.media_type})</option>)}
            </select>
            <span className="text-slate-400 text-sm font-bold">VS</span>
            <select value={expBId} onChange={e => setExpBId(e.target.value)} className="w-64 text-xs p-2 border border-slate-200 rounded focus:outline-none">
                <option value="">Pilih Eksperimen B</option>
                {history.map(h => <option key={h.experiment_id} value={h.experiment_id}>{h.experiment_id} ({h.media_type})</option>)}
            </select>
         </div>

         {expA && expB ? (
             <div className="p-0 overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                     <tbody>
                         {renderRow('Tipe Media', expA.media_type, expB.media_type)}
                         {renderRow('Metode Penyisipan', expA.embedding_method, expB.embedding_method)}
                         {renderRow('Metode Kompresi', expA.compression_method, expB.compression_method)}
                         {renderRow('Metode ECC', expA.ecc_method, expB.ecc_method)}
                         {renderRow('Payload Terpakai (bits)', expA.payload_size_bits, expB.payload_size_bits)}
                         {renderRow('Kapasitas Terpakai', `${(expA.payload_utilization_ratio*100).toFixed(2)}%`, `${(expB.payload_utilization_ratio*100).toFixed(2)}%`)}
                         {renderRow('Rasio Kompresi', expA.compression_ratio?.toFixed(4) || 'N/A', expB.compression_ratio?.toFixed(4) || 'N/A')}
                         {renderRow('BER Sebelum ECC', expA.ber_before_ecc ?? 'N/A', expB.ber_before_ecc ?? 'N/A')}
                         {renderRow('BER Sesudah ECC', expA.ber_after_ecc ?? 'N/A', expB.ber_after_ecc ?? 'N/A')}
                         {renderRow('PSNR / SNR (dB)', expA.psnr_db ?? expA.snr_db ?? 'N/A', expB.psnr_db ?? expB.snr_db ?? 'N/A')}
                         {renderRow('Waktu Pemrosesan (ms)', expA.processing_time_total_ms || 0, expB.processing_time_total_ms || 0)}
                         {renderRow('Status Integritas', expA.integrity_badge, expB.integrity_badge)}
                         {renderRow('Integritas CRC', expA.crc_valid ? 'Ya' : 'Tidak', expB.crc_valid ? 'Ya' : 'Tidak')}
                     </tbody>
                 </table>
                 <ExperimentCharts expA={expA} expB={expB} />
             </div>
         ) : (
             <div className="p-8 text-center text-xs text-slate-400">
                 Silakan pilih dua eksperimen yang valid untuk dibandingkan.
             </div>
         )}
      </div>
   );
};
