export type MediaType = 'image' | 'audio' | 'video';

export type ECCMode = 'manual' | 'adaptive';

export type ECCMethod = 'none' | 'hamming74' | 'repetition3';

export type IntegrityBadge = 'valid' | 'partial' | 'failed';

export type PresetMode = 'manual' | 'fast' | 'balanced' | 'robust';

export interface ExperimentConfig {
  version: '5.0';
  media_type: MediaType;
  compression_method: string;
  compression_quality?: number;
  compression_level?: string;
  embedding_method: string;
  ecc_mode: ECCMode;
  ecc_method?: ECCMethod;
  seed: string;
  test_condition?: string;
  preset_mode: PresetMode;
  payload_settings: {
    payload_size_bits?: number;
    include_header: boolean;
    include_crc: boolean;
  };
  created_at: string;
}

export interface ExperimentRecord {
  experiment_id: string;

  media_type: MediaType;

  compression_method: string;
  compression_ratio: number;
  file_size_bytes_before: number;
  file_size_bytes_after: number;

  embedding_method: string;

  payload_size_bits: number;
  payload_capacity_bits: number;
  payload_used_bits: number;
  payload_density: number;
  payload_utilization_ratio: number;

  ecc_mode: ECCMode;
  degradation_estimate: number | null;
  ecc_method: ECCMethod;

  ber_before_ecc: number | null;
  ber_after_ecc: number | null;

  psnr_db: number | null;
  snr_db: number | null;
  ssim: number | null;

  extraction_success: boolean;
  crc_valid: boolean;

  integrity_badge: IntegrityBadge;

  test_condition: string | null;

  chi_square_score: number | null;
  rs_score: number | null;

  processing_time_total_ms: number;
  processing_time_compression_ms: number | null;
  processing_time_decompression_ms: number | null;
  processing_time_embedding_ms: number | null;
  processing_time_extraction_ms: number | null;

  preset_mode: PresetMode;

  result_file_name: string | null;
  config_file_name: string | null;
  bundle_file_name: string | null;

  config_json: ExperimentConfig | null;

  local_saved: boolean;

  share_enabled: boolean;
  share_id: string | null;
  share_url: string | null;
  share_expires_at: string | null;

  rerun_source_experiment_id: string | null;
  compared_with_experiment_id: string | null;

  timestamp: string;
}
