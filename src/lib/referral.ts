/**
 * Utility to handle affiliate referral persistence (30 days) 
 * and URL cleaning.
 */

const STORAGE_KEY = 'affiliate_referrer_data';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface ReferralData {
    code: string;
    expiresAt: number;
}

/**
 * Captures referral from URL, stores it for 30 days, and cleans the URL.
 */
export const captureReferral = () => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('aff') || params.get('r');

    if (ref) {
        const data: ReferralData = {
            code: ref,
            expiresAt: Date.now() + THIRTY_DAYS_MS
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log("Referral Captured:", ref);

        // Remove the parameters from URL without reloading
        const url = new URL(window.location.href);
        url.searchParams.delete('ref');
        url.searchParams.delete('aff');
        url.searchParams.delete('r');
        window.history.replaceState({}, '', url.toString());
    }
};

/**
 * Returns the valid stored referral code, if any.
 * Also cleans up expired data.
 */
export const getStoredReferral = (): string | null => {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        // Fallback to legacy key if it exists
        return localStorage.getItem('affiliate_referrer');
    }

    try {
        const data: ReferralData = JSON.parse(stored);
        if (Date.now() < data.expiresAt) {
            return data.code;
        } else {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
    } catch (e) {
        console.error("Referral: Failed to parse stored data", e);
        return null;
    }
};
