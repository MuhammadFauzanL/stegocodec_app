import type { IntegrityBadge } from './types';

export function determineIntegrityBadge(isCrcValid: boolean, ber: number | null): IntegrityBadge {
    if (isCrcValid) {
        return 'valid';
    }
    if (ber !== null && ber > 0 && ber <= 0.2) {
        return 'partial';
    }
    return 'failed';
}
