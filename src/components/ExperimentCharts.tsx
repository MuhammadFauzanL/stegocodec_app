import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ExperimentRecord } from '../shared/types';

interface ExperimentChartsProps {
    expA: ExperimentRecord;
    expB: ExperimentRecord;
}

export const ExperimentCharts = ({ expA, expB }: ExperimentChartsProps) => {
    
    // Prepare data for the charts
    // We create separate datasets because the units and scales are completely different.
    
    const psnrData = [
        {
            name: 'Kualitas (PSNR/SNR dB)',
            [expA.experiment_id]: expA.psnr_db ?? expA.snr_db ?? 0,
            [expB.experiment_id]: expB.psnr_db ?? expB.snr_db ?? 0,
        }
    ];

    const timeData = [
        {
            name: 'Waktu Proses (ms)',
            [expA.experiment_id]: expA.processing_time_total_ms || 0,
            [expB.experiment_id]: expB.processing_time_total_ms || 0,
        }
    ];

    const compressionData = [
        {
            name: 'Rasio Kompresi',
            [expA.experiment_id]: Number(expA.compression_ratio?.toFixed(4)) || 0,
            [expB.experiment_id]: Number(expB.compression_ratio?.toFixed(4)) || 0,
        }
    ];

    const utilizationData = [
        {
            name: 'Utilisasi Payload (%)',
            [expA.experiment_id]: Number((expA.payload_utilization_ratio * 100).toFixed(2)) || 0,
            [expB.experiment_id]: Number((expB.payload_utilization_ratio * 100).toFixed(2)) || 0,
        }
    ];

    const renderChart = (data: any[], title: string) => (
        <div className="bg-white p-4 border border-slate-200 rounded-md shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 mb-4 text-center">{title}</h3>
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip 
                            contentStyle={{ fontSize: '11px', borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                            cursor={{ fill: '#f8fafc' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
                        <Bar dataKey={expA.experiment_id} name={`Exp A: ${expA.experiment_id}`} fill="#0f172a" radius={[2, 2, 0, 0]} barSize={32} />
                        <Bar dataKey={expB.experiment_id} name={`Exp B: ${expB.experiment_id}`} fill="#94a3b8" radius={[2, 2, 0, 0]} barSize={32} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    return (
        <div className="p-5 bg-slate-50 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Visualisasi Perbandingan Head-to-Head</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderChart(psnrData, 'Kualitas (Semakin Tinggi Semakin Baik)')}
                {renderChart(timeData, 'Waktu Eksekusi (Semakin Rendah Semakin Baik)')}
                {renderChart(utilizationData, 'Efisiensi Payload (Semakin Tinggi Semakin Baik)')}
                {renderChart(compressionData, 'Rasio Kompresi File')}
            </div>
        </div>
    );
};
