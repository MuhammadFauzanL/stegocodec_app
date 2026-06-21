import { useRef, useState } from 'react';
import { parseConfigJSON } from '../shared/config_utils';
import { Modal } from './Modal';

export const ConfigImportPanel = () => {
   const fileInputRef = useRef<HTMLInputElement>(null);
   const [errorMsg, setErrorMsg] = useState<string | null>(null);
   const [modal, setModal] = useState<{title: string, message: string} | null>(null);

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
         try {
            const text = event.target?.result as string;
            const config = parseConfigJSON(text);
            // In a real app, this would dispatch config to global state
            console.log('Successfully imported config:', config);
            setErrorMsg(null);
            setModal({ title: 'Berhasil', message: 'Konfigurasi eksperimen berhasil diimpor.' });
         } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to parse config file.';
            setErrorMsg(message);
         }
         // reset input
         if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
   };

   return (
      <>
      <div className="bg-white border border-slate-200 rounded-md shadow-sm">
         <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Import Settings</h2>
         </div>
         <div className="p-5">
            <p className="text-xs text-slate-500 mb-4">Upload a <code className="bg-slate-100 px-1 rounded text-slate-700">_config.json</code> file to replicate a previous experiment's exact parameters.</p>
            <input 
               type="file" 
               accept=".json" 
               ref={fileInputRef}
               onChange={handleFileChange}
               className="hidden" 
               id="config-upload" 
            />
            <label htmlFor="config-upload" className="block w-full text-center bg-slate-900 rounded-md py-3 text-sm font-medium text-white hover:bg-slate-800 cursor-pointer transition-colors shadow-sm">
               Pilih File Konfigurasi (.json)
            </label>
            {errorMsg && <div className="mt-3 text-xs text-red-600 font-medium bg-red-50 p-2 rounded border border-red-100">{errorMsg}</div>}
         </div>
      </div>
      
      {modal && (
         <Modal title={modal.title} message={modal.message} onClose={() => setModal(null)} />
      )}
      </>
   );
};
