import type { Progress, ItemHistory, QuizSettings, DataSet } from '@/types/learning';

const STORAGE_KEY = 'polishbridge_progress';
const HISTORY_KEY = 'polishbridge_history';
const SETTINGS_KEY = 'polishbridge_settings';
const DATASETS_KEY = 'linguadock_datasets';
const FIRST_LAUNCH_KEY = 'linguadock_first_launch';

// All storage keys used by this extension
const ALL_STORAGE_KEYS = [STORAGE_KEY, HISTORY_KEY, SETTINGS_KEY, DATASETS_KEY, FIRST_LAUNCH_KEY];

// Get today's date as YYYY-MM-DD
function getTodayString(): string {
    return new Date().toISOString().split('T')[0];
}

// Default progress state
function getDefaultProgress(): Progress {
    return {
        todayCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudyDate: getTodayString(),
    };
}

// Default settings (v2.0)
function getDefaultSettings(): QuizSettings {
    return {
        timerSeconds: 5,
        timerEnabled: false,
        audioEnabled: false,
        ttsEngine: 'chrome',
        ttsRate: 0.9,
        ttsPitch: 1.0,
        showAdvancedSettings: false,
        shareEnabled: false,
        darkMode: 'system',
        currentLanguage: 'all',
        debugMode: false,
    };
}

// Storage helper (chrome.storage.sync - limited to 100KB)
async function getStorage<T>(key: string): Promise<T | null> {
    try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            const result = await chrome.storage.sync.get(key);
            return result[key] as T | null;
        }
    } catch {
        console.warn('Chrome storage not available');
    }
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : null;
    } catch {
        console.warn('Failed to load from localStorage');
    }
    return null;
}

async function setStorage<T>(key: string, value: T): Promise<void> {
    try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.sync.set({ [key]: value });
            return;
        }
    } catch {
        console.warn('Chrome storage not available');
    }
    localStorage.setItem(key, JSON.stringify(value));
}

// Large storage helper (chrome.storage.local - up to 5MB)
async function getLocalStorage<T>(key: string): Promise<T | null> {
    try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            const result = await chrome.storage.local.get(key);
            return result[key] as T | null;
        }
    } catch {
        console.warn('Chrome local storage not available');
    }
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : null;
    } catch {
        console.warn('Failed to load from localStorage');
    }
    return null;
}

async function setLocalStorage<T>(key: string, value: T): Promise<void> {
    try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.set({ [key]: value });
            return;
        }
    } catch {
        console.warn('Chrome local storage not available');
    }
    localStorage.setItem(key, JSON.stringify(value));
}

// Progress
export async function loadProgress(): Promise<Progress> {
    const progress = await getStorage<Progress>(STORAGE_KEY);
    if (progress) {
        if (progress.lastStudyDate !== getTodayString()) {
            return {
                ...progress,
                todayCount: 0,
                correctCount: 0,
                incorrectCount: 0,
                lastStudyDate: getTodayString(),
            };
        }
        return progress;
    }
    return getDefaultProgress();
}

export async function saveProgress(progress: Progress): Promise<void> {
    await setStorage(STORAGE_KEY, progress);
}

export async function resetTodayProgress(): Promise<Progress> {
    const newProgress = getDefaultProgress();
    await saveProgress(newProgress);
    return newProgress;
}

// Item history (for wrong-only mode)
export async function loadItemHistory(): Promise<Map<string, ItemHistory>> {
    const data = await getStorage<ItemHistory[]>(HISTORY_KEY);
    const map = new Map<string, ItemHistory>();
    if (data) {
        data.forEach(h => map.set(h.itemId, h));
    }
    return map;
}

export async function saveItemHistory(history: Map<string, ItemHistory>): Promise<void> {
    await setStorage(HISTORY_KEY, Array.from(history.values()));
}

export async function clearItemHistory(): Promise<void> {
    await setStorage(HISTORY_KEY, []);
}

// Settings (v2.0 - with migration)
export async function loadSettings(): Promise<QuizSettings> {
    const settings = await getStorage<Partial<QuizSettings>>(SETTINGS_KEY);
    if (settings) {
        // Merge with defaults to handle missing v2.0 fields
        return { ...getDefaultSettings(), ...settings };
    }
    return getDefaultSettings();
}

export async function saveSettings(settings: QuizSettings): Promise<void> {
    await setStorage(SETTINGS_KEY, settings);
}

// ============================================
// DataSets (chrome.storage.local for larger data)
// ============================================
export async function loadDataSets(): Promise<DataSet[]> {
    const dataSets = await getLocalStorage<DataSet[]>(DATASETS_KEY);
    return dataSets || [];
}

export async function saveDataSets(dataSets: DataSet[]): Promise<void> {
    // Built-in datasets: save only metadata (no items) - items will be parsed fresh from CSV
    // User datasets: save everything including items
    const dataToSave = dataSets.map(ds => ({
        ...ds,
        items: ds.isBuiltIn ? [] : ds.items, // Don't save built-in items to storage
    }));

    // Check storage size (chrome.storage.local limit is 5MB)
    const dataStr = JSON.stringify(dataToSave);
    const sizeBytes = new Blob([dataStr]).size;
    const maxBytes = 5 * 1024 * 1024; // 5MB

    if (sizeBytes > maxBytes) {
        const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
        throw new Error(`データセットが容量上限を超えています（${sizeMB}MB / 5MB）`);
    }

    await setLocalStorage(DATASETS_KEY, dataToSave);
}

export async function clearDataSets(): Promise<void> {
    await setLocalStorage(DATASETS_KEY, []);
}

// Generate simple hash for duplicate detection
export function generateDataSetHash(items: { text: string; lang: string }[]): string {
    const content = items.map(i => `${i.lang}:${i.text}`).sort().join('|');
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `hash_${Math.abs(hash).toString(16)}`;
}

// ============================================
// First Launch Detection
// ============================================
export async function isFirstLaunch(): Promise<boolean> {
    const launched = await getStorage<boolean>(FIRST_LAUNCH_KEY);
    return launched !== true;
}

export async function markLaunched(): Promise<void> {
    await setStorage(FIRST_LAUNCH_KEY, true);
}

export async function resetFirstLaunch(): Promise<void> {
    await setStorage(FIRST_LAUNCH_KEY, false);
}

// ============================================
// Complete Storage Clear (for debugging/reset)
// ============================================
export async function clearAllStorage(): Promise<void> {
    console.log('[Storage] Clearing ALL storage keys:', ALL_STORAGE_KEYS);

    // Clear all keys from chrome.storage.sync
    try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.sync.remove(ALL_STORAGE_KEYS);
            console.log('[Storage] chrome.storage.sync cleared');
        }
    } catch (e) {
        console.warn('[Storage] Failed to clear chrome.storage.sync:', e);
    }

    // Clear all keys from chrome.storage.local
    try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.remove(ALL_STORAGE_KEYS);
            console.log('[Storage] chrome.storage.local cleared');
        }
    } catch (e) {
        console.warn('[Storage] Failed to clear chrome.storage.local:', e);
    }

    // Also clear localStorage fallback
    ALL_STORAGE_KEYS.forEach(key => {
        try {
            localStorage.removeItem(key);
        } catch {
            // Ignore
        }
    });
    console.log('[Storage] localStorage cleared');
}
