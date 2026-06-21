import type { ExperimentRecord } from './types';

export interface CreateExperimentRecordParams {
  experiment_id: string;
  media_type: ExperimentRecord['media_type'];
  compression_method: string;
  embedding_method: string;
  payload_size_bits: number;
  payload_capacity_bits: number;
  ecc_mode: ExperimentRecord['ecc_mode'];
  preset_mode: ExperimentRecord['preset_mode'];
}

export function createExperimentRecord(params: CreateExperimentRecordParams): ExperimentRecord {
  // Placeholder logic to satisfy the contract
  return {
    ...params,
    compression_ratio: 0,
    file_size_bytes_before: 0,
    file_size_bytes_after: 0,
    payload_used_bits: params.payload_size_bits,
    payload_density: 0,
    payload_utilization_ratio: params.payload_size_bits / params.payload_capacity_bits,
    ecc_method: 'none',
    degradation_estimate: null,
    ber_before_ecc: null,
    ber_after_ecc: null,
    psnr_db: null,
    snr_db: null,
    ssim: null,
    extraction_success: false,
    crc_valid: false,
    integrity_badge: 'failed',
    test_condition: null,
    chi_square_score: null,
    rs_score: null,
    processing_time_total_ms: 0,
    processing_time_compression_ms: null,
    processing_time_decompression_ms: null,
    processing_time_embedding_ms: null,
    processing_time_extraction_ms: null,
    result_file_name: null,
    config_file_name: null,
    bundle_file_name: null,
    config_json: null,
    local_saved: false,
    share_enabled: false,
    share_id: null,
    share_url: null,
    share_expires_at: null,
    rerun_source_experiment_id: null,
    compared_with_experiment_id: null,
    timestamp: new Date().toISOString()
  };
}

export function logExperiment(record: ExperimentRecord): void {
  // We log the updated V5 schema. Later we might save to IndexedDB.
  console.log(`[Metrics Logger v5] Logged experiment: ${record.experiment_id}`, record);
}

export function exportMetricsJSON(records: ExperimentRecord[]): Blob {
  const jsonString = JSON.stringify(records, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

export function exportMetricsCSV(records: ExperimentRecord[]): Blob {
  if (records.length === 0) return new Blob([''], { type: 'text/csv' });
  const headers = Object.keys(records[0]).join(',');
  const rows = records.map(record => {
    return Object.values(record).map(val => 
      typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
    ).join(',');
  });
  const csvContent = [headers, ...rows].join('\n');
  return new Blob([csvContent], { type: 'text/csv' });
}

const HISTORY_KEY = 'stegocodec_history';
const MAX_HISTORY = 50;

export function getExperimentHistory(): ExperimentRecord[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveExperimentToHistory(record: ExperimentRecord): void {
  try {
    let history = getExperimentHistory();
    history = history.filter(h => h.experiment_id !== record.experiment_id);
    history.unshift(record);
    if (history.length > MAX_HISTORY) {
      history = history.slice(0, MAX_HISTORY);
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error("Failed to save experiment to history", err);
  }
}

export function deleteExperimentFromHistory(experimentId: string): void {
  try {
    let history = getExperimentHistory();
    history = history.filter(h => h.experiment_id !== experimentId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error("Failed to delete experiment from history", err);
  }
}

