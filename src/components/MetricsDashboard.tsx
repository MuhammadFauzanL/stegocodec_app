
import type { ExperimentRecord } from '../shared/types';
import { ResultBundleDownload } from './ResultBundleDownload';

export const MetricsDashboard = ({ record, stegoBlob }: { record: ExperimentRecord, stegoBlob: Blob | null }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm">
       <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between bg-slate-50 rounded-t-md">
          <div className="flex items-center space-x-3">
             <h2 className="text-sm font-semibold">Ringkasan Metrik</h2>
             <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded">{record.experiment_id}</span>
          </div>
          <div className="flex items-center space-x-2">
             <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide ${record.integrity_badge === 'valid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
               Integritas: {record.integrity_badge.toUpperCase()}
             </span>
          </div>
       </div>
       <div className="p-5 grid grid-cols-3 gap-4">
          <div className="border border-slate-100 p-4 rounded-md">
             <div className="text-xs text-slate-500 mb-1">Ukuran Pesan</div>
             <div className="text-lg font-semibold text-slate-900">{record.payload_size_bits} <span className="text-xs font-normal text-slate-400">bits</span></div>
          </div>
          <div className="border border-slate-100 p-4 rounded-md">
             <div className="text-xs text-slate-500 mb-1">Kapasitas Terpakai</div>
             <div className="text-lg font-semibold text-slate-900">{(record.payload_utilization_ratio * 100).toFixed(2)}%</div>
          </div>
          <div className="border border-slate-100 p-4 rounded-md">
             <div className="text-xs text-slate-500 mb-1">Integritas Data (CRC)</div>
             <div className="text-lg font-semibold text-slate-900">{record.crc_valid ? 'Lulus' : 'Gagal'}</div>
          </div>
       </div>
       <div className="px-5 pb-5">
         <ResultBundleDownload record={record} stegoBlob={stegoBlob} />
       </div>
    </div>
  );
};
