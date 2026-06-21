export function generateOutputFileName(experimentId: string, originalFileName: string, fileExtension: string): string {
  return `${experimentId}_${originalFileName}_stego.${fileExtension}`;
}

export function generateMetricsFileName(experimentId: string, format: 'json' | 'csv' = 'json'): string {
  return `${experimentId}_metrics.${format}`;
}

export function generateConfigFileName(experimentId: string): string {
  return `${experimentId}_config.json`;
}

export function generateBundleFileName(experimentId: string): string {
  return `${experimentId}_bundle.zip`;
}
