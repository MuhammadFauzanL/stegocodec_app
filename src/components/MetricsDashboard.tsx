
import type { ExperimentRecord } from '../shared/types';
import { ResultBundleDownload } from './ResultBundleDownload';

export const MetricsDashboard = ({ record, stegoBlob, loading }: { record: ExperimentRecord | null, stegoBlob: Blob | null, loading?: boolean }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm h-full flex flex-col justify-between">
       <div>
         <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between bg-slate-50 rounded-t-md">
            <div className="flex items-center space-x-3">
               <h2 className="text-sm font-semibold">Ringkasan Metrik</h2>
               {record && <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded">{record.experiment_id}</span>}
               {loading && <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded animate-pulse w-32 h-5"></span>}
            </div>
            <div className="flex items-center space-x-2">
               {record && (
                 <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide ${record.integrity_badge === 'valid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                   Integritas: {record.integrity_badge.toUpperCase()}
                 </span>
               )}
               {loading && (
                 <span className="text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide bg-blue-100 text-blue-800 animate-pulse">
                   MEMPROSES...
                 </span>
               )}
            </div>
         </div>
         <div className="p-5 grid grid-cols-3 gap-4">
            <div className="border border-slate-100 p-4 rounded-md">
               <div className="text-xs text-slate-500 mb-1">Ukuran Pesan</div>
               <div className="text-lg font-semibold text-slate-900">
                 {loading ? <div className="h-6 w-16 bg-slate-200 rounded animate-pulse mt-1"></div> : record ? <>{record.payload_size_bits} <span className="text-xs font-normal text-slate-400">bits</span></> : '-'}
               </div>
            </div>
            <div className="border border-slate-100 p-4 rounded-md">
               <div className="text-xs text-slate-500 mb-1">Kapasitas Terpakai</div>
               <div className="text-lg font-semibold text-slate-900">
                 {loading ? <div className="h-6 w-16 bg-slate-200 rounded animate-pulse mt-1"></div> : record ? <>{(record.payload_utilization_ratio * 100).toFixed(2)}%</> : '-'}
               </div>
            </div>
            <div className="border border-slate-100 p-4 rounded-md">
               <div className="text-xs text-slate-500 mb-1">Integritas Data (CRC)</div>
               <div className="text-lg font-semibold text-slate-900">
                 {loading ? <div className="h-6 w-16 bg-slate-200 rounded animate-pulse mt-1"></div> : record ? <>{record.crc_valid ? 'Lulus' : 'Gagal'}</> : '-'}
               </div>
            </div>
         </div>
       </div>
       <div className="px-5 pb-5 mt-auto">
         <ResultBundleDownload record={record} stegoBlob={stegoBlob} loading={loading} />
       </div>
    </div>
  );
};
