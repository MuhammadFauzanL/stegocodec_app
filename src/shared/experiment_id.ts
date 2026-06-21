import type { MediaType } from './types';

function generateRandomSuffix(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateExperimentId(mediaType: MediaType): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  
  let mediaPrefix = '';
  if (mediaType === 'image') mediaPrefix = 'IMG';
  else if (mediaType === 'audio') mediaPrefix = 'AUD';
  else if (mediaType === 'video') mediaPrefix = 'VID';

  const suffix = generateRandomSuffix(4);
  return `EXP-${mediaPrefix}-${yyyy}${mm}${dd}-${suffix}`;
}
