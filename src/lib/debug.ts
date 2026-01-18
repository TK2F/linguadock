/**
 * Debug Logging Utility
 * Centralized debug logging controlled by settings.debugMode
 */

// In-memory cache for debug mode state
// This is refreshed from storage when needed
let cachedDebugMode = false;

/**
 * Update debug mode from settings
 * Call this when settings change
 */
export function setDebugMode(enabled: boolean): void {
    cachedDebugMode = enabled;
}

/**
 * Check if debug mode is enabled
 */
export function isDebugMode(): boolean {
    return cachedDebugMode;
}

/**
 * Conditional debug log - only outputs when debugMode is ON
 * @param tag - Log category tag (e.g., 'App', 'TTS', 'CSV')
 * @param args - Arguments to log
 */
export function debugLog(tag: string, ...args: unknown[]): void {
    if (cachedDebugMode) {
        console.log(`[${tag}]`, ...args);
    }
}

/**
 * Error log - always outputs regardless of debugMode
 * @param tag - Log category tag
 * @param args - Arguments to log
 */
export function errorLog(tag: string, ...args: unknown[]): void {
    console.error(`[${tag}]`, ...args);
}

/**
 * Warning log - always outputs regardless of debugMode
 * @param tag - Log category tag
 * @param args - Arguments to log
 */
export function warnLog(tag: string, ...args: unknown[]): void {
    console.warn(`[${tag}]`, ...args);
}
