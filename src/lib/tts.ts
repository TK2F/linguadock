// TTS Engine Types
export type TTSEngine = 'chrome' | 'web' | 'none';

import { debugLog } from '@/lib/debug';

export interface TTSConfig {
    engine: TTSEngine;
    rate: number;      // 0.5 - 2.0
    pitch: number;     // 0.5 - 2.0
}

export const DEFAULT_TTS_CONFIG: TTSConfig = {
    engine: 'chrome',
    rate: 0.9,
    pitch: 1.0,
};

// Cache for voices
let cachedVoices: SpeechSynthesisVoice[] = [];

// Initialize voices when available
function initVoices(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        cachedVoices = speechSynthesis.getVoices();
        if (cachedVoices.length === 0) {
            speechSynthesis.onvoiceschanged = () => {
                cachedVoices = speechSynthesis.getVoices();
                debugLog('TTS', 'Voices loaded:', cachedVoices.length);
            };
        }
    }
}

// Call on module load
initVoices();

// Check available TTS engines
export function getAvailableEngines(): TTSEngine[] {
    const engines: TTSEngine[] = ['none'];

    // Check chrome.tts
    if (typeof chrome !== 'undefined' && chrome.tts) {
        engines.unshift('chrome');
    }

    // Check Web Speech API
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        engines.unshift('web');
    }

    return engines;
}

// Chrome TTS implementation
function speakWithChromeTTS(text: string, lang: string, config: TTSConfig): Promise<boolean> {
    return new Promise((resolve) => {
        if (typeof chrome === 'undefined' || !chrome.tts) {
            console.warn('[TTS:Chrome] chrome.tts not available');
            resolve(false);
            return;
        }

        debugLog('TTS:Chrome', 'Speaking:', text);

        // Stop any ongoing speech first
        chrome.tts.stop();

        let resolved = false;
        const safeResolve = (value: boolean) => {
            if (!resolved) {
                resolved = true;
                resolve(value);
            }
        };

        // Timeout safety
        setTimeout(() => safeResolve(true), 10000);

        // Small delay to ensure previous speech is stopped
        setTimeout(() => {
            chrome.tts.speak(text, {
                lang: lang,
                rate: config.rate,
                pitch: config.pitch,
                onEvent: (event) => {
                    debugLog('TTS:Chrome', 'Event:', event.type);
                    if (event.type === 'end') {
                        safeResolve(true);
                    } else if (event.type === 'error') {
                        // "interrupted" is not a real error - it happens when we cancel previous speech
                        if (event.errorMessage === 'interrupted') {
                            debugLog('TTS:Chrome', 'Speech was interrupted (normal)');
                            safeResolve(true);
                        } else {
                            console.error('[TTS:Chrome] Error:', event.errorMessage);
                            safeResolve(false);
                        }
                    }
                }
            });
        }, 50);
    });
}

// Web Speech API implementation
function speakWithWebSpeech(text: string, lang: string, config: TTSConfig): Promise<boolean> {
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            console.warn('[TTS:Web] speechSynthesis not available');
            resolve(false);
            return;
        }

        debugLog('TTS:Web', 'Speaking:', text);

        // Cancel any ongoing speech
        speechSynthesis.cancel();

        let resolved = false;
        const safeResolve = (value: boolean) => {
            if (!resolved) {
                resolved = true;
                resolve(value);
            }
        };

        // Timeout safety
        setTimeout(() => safeResolve(true), 10000);

        // Small delay to allow cancel to complete
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);

            // Get fresh voices list
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                cachedVoices = voices;
            }

            // Find voice for language (prefer Polish, then any matching language)
            let voice = cachedVoices.find(v => v.lang === lang);
            if (!voice) {
                voice = cachedVoices.find(v => v.lang.startsWith(lang.substring(0, 2)));
            }

            if (voice) {
                utterance.voice = voice;
                debugLog('TTS:Web', 'Using voice:', voice.name, voice.lang);
            } else {
                debugLog('TTS:Web', 'No matching voice found, using default. Available:',
                    cachedVoices.slice(0, 5).map(v => `${v.name}(${v.lang})`).join(', '));
            }

            utterance.lang = lang;
            utterance.rate = config.rate;
            utterance.pitch = config.pitch;

            utterance.onend = () => {
                debugLog('TTS:Web', 'Ended successfully');
                safeResolve(true);
            };

            utterance.onerror = (e) => {
                // "interrupted" and "canceled" are not real errors
                if (e.error === 'interrupted' || e.error === 'canceled') {
                    debugLog('TTS:Web', 'Speech was interrupted/canceled (normal)');
                    safeResolve(true);
                } else {
                    console.error('[TTS:Web] Error:', e.error);
                    safeResolve(false);
                }
            };

            speechSynthesis.speak(utterance);
        }, 100);
    });
}

// Main speak function
export async function speak(text: string, lang: string = 'pl-PL', config: TTSConfig = DEFAULT_TTS_CONFIG): Promise<boolean> {
    debugLog('TTS', `Request: "${text}" lang=${lang} engine=${config.engine}`);

    if (config.engine === 'none') {
        debugLog('TTS', 'Engine disabled');
        return false;
    }

    if (config.engine === 'chrome') {
        const success = await speakWithChromeTTS(text, lang, config);
        if (success) return true;
        // Fallback to web
        debugLog('TTS', 'Chrome failed, trying Web Speech API');
        return speakWithWebSpeech(text, lang, config);
    }

    if (config.engine === 'web') {
        return speakWithWebSpeech(text, lang, config);
    }

    return false;
}

// Stop any ongoing speech
export function stopSpeaking(): void {
    if (typeof chrome !== 'undefined' && chrome.tts) {
        chrome.tts.stop();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        speechSynthesis.cancel();
    }
}

// Get available voices (for debugging)
export function getAvailableVoices(): { name: string; lang: string }[] {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
            cachedVoices = voices;
        }
        return cachedVoices.map(v => ({
            name: v.name,
            lang: v.lang
        }));
    }
    return [];
}

// Test TTS (for debugging in console)
export function testTTS(): void {
    debugLog('TTS', 'Available engines:', getAvailableEngines());
    debugLog('TTS', 'Available voices:', getAvailableVoices().slice(0, 10));
    speak('Test', 'en-US', { engine: 'web', rate: 1.0, pitch: 1.0 });
}
