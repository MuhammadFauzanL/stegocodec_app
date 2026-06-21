import type { ExperimentConfig } from './types';

export function exportConfigJSON(config: ExperimentConfig): Blob {
  const jsonString = JSON.stringify(config, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

export function parseConfigJSON(jsonText: string): ExperimentConfig {
  const config = JSON.parse(jsonText);
  if (config.version !== '5.0') {
    throw new Error('Incompatible configuration version. Expected 5.0');
  }
  return config as ExperimentConfig;
}
