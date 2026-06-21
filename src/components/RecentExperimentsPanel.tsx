import { useEffect, useState } from 'react';
import { getExperimentHistory, deleteExperimentFromHistory } from '../shared/metrics_logger';
import type { ExperimentRecord } from '../shared/types';
import { Modal } from './Modal';

export const RecentExperimentsPanel = () => {
   const [history, setHistory] = useState<ExperimentRecord[]>(getExperimentHistory());
   const [modal, setModal] = useState<{title: string, message: string, idToDelete?: string} | null>(null);

   const loadHistory = () => {
       setHistory(getExperimentHistory());
   };

   useEffect(() => {
       const interval = setInterval(loadHistory, 2000);
       return () => clearInterval(interval);
   }, []);

   const handleDeleteClick = (id: string) => {
       setModal({
           title: 'Konfirmasi Hapus',
           message: `Apakah Anda yakin ingin menghapus data eksperimen (${id}) ini dari riwayat lokal?`,
           idToDelete: id
       });
   };

   const confirmDelete = () => {
       if (modal?.idToDelete) {
           deleteExperimentFromHistory(modal.idToDelete);
           loadHistory();
       }
       setModal(null);
   };

   const handleReRun = () => {
       setModal({
           title: 'Peringatan Re-run', 
           message: 'File media asli tidak tersimpan di memori browser secara permanen. Silakan upload ulang file media asli Anda, lalu gunakan "Config Import Panel" (tombol JSON) untuk menjalankan ulang konfigurasi ini.'
       });
   };

   return (
      <>
      <div className="bg-white border border-slate-200 rounded-md shadow-sm">
         <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Riwayat Terbaru</h2>
            <span className="text-xs text-slate-400">{history.length} data</span>
         </div>
         <div className="p-0">
            {history.length === 0 ? (
               <div className="p-5 text-center text-xs text-slate-500">Belum ada riwayat eksperimen.</div>
            ) : (
               <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {history.map(rec => (
                     <li key={rec.experiment_id} className="p-4 flex flex-col hover:bg-slate-50">
                        <div className="flex items-center justify-between">
                           <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-slate-900">{rec.experiment_id}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">
                                  {rec.media_type} • {rec.embedding_method} • {rec.ecc_method}
                              </div>
                           </div>
                           <div className="flex space-x-2">
                               <button onClick={handleReRun} className="text-[10px] font-bold text-white bg-emerald-600 px-3 py-1.5 rounded hover:bg-emerald-700 transition-colors shadow-sm">
                                  Jalankan Ulang
                               </button>
                               <button onClick={() => handleDeleteClick(rec.experiment_id)} className="text-[10px] font-bold text-white bg-red-600 px-3 py-1.5 rounded hover:bg-red-700 transition-colors shadow-sm">
                                  Hapus
                               </button>
                           </div>
                        </div>
                     </li>
                  ))}
               </ul>
            )}
         </div>
      </div>
      
      {modal && (
         <Modal 
             title={modal.title} 
             message={modal.message} 
             onClose={() => setModal(null)} 
             onConfirm={modal.idToDelete ? confirmDelete : undefined}
             confirmText={modal.idToDelete ? "Hapus" : undefined}
         />
      )}
      </>
   );
};
