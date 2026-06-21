import { useState } from 'react';
import type { ExperimentRecord } from '../shared/types';
import { generateOutputFileName } from '../shared/file_naming';
import { exportMetricsCSV } from '../shared/metrics_logger';
import JSZip from 'jszip';
import { Modal } from './Modal';

export const ResultBundleDownload = ({ record, stegoBlob }: { record: ExperimentRecord, stegoBlob: Blob | null }) => {
  const [zipping, setZipping] = useState(false);

  const [modal, setModal] = useState<{title: string, message: string} | null>(null);

  const handleDownloadMetrics = () => {
     const blob = exportMetricsCSV([record]);
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     // generateMetricsFileName might return .json by default if we don't pass extension, 
     // but we can just force .csv
     a.download = `${record.experiment_id}_metrics.csv`;
     a.click();
     URL.revokeObjectURL(url);
  };

  const getExt = () => record.media_type === 'audio' ? 'wav' : 'png';

  const handleDownloadStego = () => {
     if (!stegoBlob) return;
     const url = URL.createObjectURL(stegoBlob);
     const a = document.createElement('a');
     a.href = url;
     a.download = generateOutputFileName(record.experiment_id, 'media', getExt());
     a.click();
     URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
      if (!stegoBlob) return;
      setZipping(true);
      try {
          const zip = new JSZip();
          
          // Add Stego Media
          zip.file(`stego_media.${getExt()}`, stegoBlob);
          
          // Add Metrics as CSV
          const metricsBlob = exportMetricsCSV([record]);
          zip.file('metrics.csv', metricsBlob);
          
          // Add Metrics as JSON
          zip.file('metrics.json', JSON.stringify([record], null, 2));
          
          // Add Config
          const configObj = {
              experiment_id: record.experiment_id,
              media_type: record.media_type,
              embedding_method: record.embedding_method,
              compression_method: record.compression_method,
              ecc_mode: record.ecc_mode,
              timestamp: record.timestamp
          };
          zip.file('config.json', JSON.stringify(configObj, null, 2));

          // Add README_result.txt
          const readmeText = `Experiment ID: ${record.experiment_id}
Created At: ${record.timestamp}
Media Type: ${record.media_type}
Compression Method: ${record.compression_method}
Embedding Method: ${record.embedding_method}
ECC Mode: ${record.ecc_mode}
ECC Method: ${record.ecc_method}
Payload Size: ${record.payload_size_bits}
Payload Capacity: ${record.payload_capacity_bits}
Payload Utilization: ${(record.payload_utilization_ratio * 100).toFixed(2)}%
Compression Ratio: ${record.compression_ratio}
BER Before ECC: ${record.ber_before_ecc ?? 'N/A'}
BER After ECC: ${record.ber_after_ecc ?? 'N/A'}
PSNR or SNR: ${record.psnr_db ?? record.snr_db ?? 'N/A'}
CRC Valid: ${record.crc_valid}
Integrity Badge: ${record.integrity_badge}
Processing Time Total: ${record.processing_time_total_ms} ms
`;
          zip.file('README_result.txt', readmeText);
          
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          const url = URL.createObjectURL(zipBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${record.experiment_id}_bundle.zip`;
          a.click();
          URL.revokeObjectURL(url);
      } catch (e) {
          console.error("ZIP Error", e);
          setModal({ title: 'Gagal', message: 'Gagal menggenerasi bundle ZIP.' });
      } finally {
          setZipping(false);
      }
  };

  return (
    <>
    <div className="flex space-x-3 mt-4 pt-4 border-t border-slate-100">
       <button onClick={handleDownloadMetrics} className="text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-1.5 px-3 rounded-md">
          Unduh Metrik (CSV)
       </button>
       <button onClick={handleDownloadStego} disabled={!stegoBlob} className="text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-1.5 px-3 rounded-md disabled:opacity-50">
          Unduh Media Stego
       </button>
       <button onClick={handleDownloadZip} disabled={!stegoBlob || zipping} className="text-xs font-medium border border-slate-900 bg-slate-900 hover:bg-slate-800 text-white py-1.5 px-3 rounded-md disabled:opacity-50">
          {zipping ? 'Membungkus ZIP...' : 'Unduh Paket Lengkap (ZIP)'}
       </button>
    </div>
    {modal && (
       <Modal title={modal.title} message={modal.message} onClose={() => setModal(null)} />
    )}
    </>
  );
};
