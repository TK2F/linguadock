import { create } from 'zustand';
import type {
    LearningItem, Question, QuizMode, Progress,
    ChoiceQuestion, TrueFalseQuestion, FillInQuestion, SessionSettings,
    ItemHistory, QuizSettings, CategoryGroup, DataSet
} from '@/types/learning';
import { itemMatchesCategoryGroup, itemSupportsQuizMode, getLanguageConfig } from '@/types/learning';
import {
    loadProgress, saveProgress, resetTodayProgress,
    loadItemHistory, saveItemHistory, clearItemHistory,
    loadSettings, saveSettings, saveDataSets, clearAllStorage
} from '@/lib/storage';
import { speak, stopSpeaking } from '@/lib/tts';
import { setDebugMode } from '@/lib/debug';

// ============================================
// Store Interface
// ============================================

interface QuizStore {
    // State
    items: LearningItem[];
    dataSets: DataSet[];
    currentQuestion: Question | null;
    mode: QuizMode;
    progress: Progress;
    session: SessionSettings;
    settings: QuizSettings;
    itemHistory: Map<string, ItemHistory>;
    showFeedback: boolean;
    lastAnswerCorrect: boolean | null;
    isSettingsOpen: boolean;
    isLoading: boolean;
    showSessionSetup: boolean;
    timerRemaining: number | null;

    // Actions
    setItems: (items: LearningItem[]) => void;
    addDataSet: (dataSet: DataSet) => void;
    removeDataSet: (dataSetId: string) => void;
    toggleDataSet: (dataSetId: string) => void;
    toggleDataSetLock: (dataSetId: string) => void;
    setMode: (mode: QuizMode) => void;
    setCategoryGroup: (group: CategoryGroup) => void;
    generateQuestion: () => void;
    submitAnswer: (answer: 'A' | 'B' | boolean) => void;
    nextQuestion: () => void;
    toggleSettings: () => void;
    initializeProgress: () => Promise<void>;
    startSession: (questionCount: number, wrongOnlyMode?: boolean) => void;
    endSession: () => void;
    toggleSessionSetup: () => void;
    resetTodayProgress: () => Promise<void>;
    clearHistory: () => Promise<void>;
    updateSettings: (settings: Partial<QuizSettings>) => void;
    speakItem: (item: LearningItem) => void;
    speakText: (text: string, lang?: string) => void;
    setTimerRemaining: (seconds: number | null) => void;
    getFilteredItems: () => LearningItem[];
    resetToDefault: () => Promise<void>;
}

// ============================================
// Utility Functions
// ============================================

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

// Get TTS text and lang from item (using SUPPORTED_LANGUAGES for correct ttsLang)
function getTTSParams(item: LearningItem): { text: string; lang: string } {
    // Prefer tts_lang from item, otherwise look up from SUPPORTED_LANGUAGES
    const langConfig = getLanguageConfig(item.lang);
    return {
        text: item.tts_text || item.text,
        lang: item.tts_lang || langConfig.ttsLang || `${item.lang}-${item.lang.toUpperCase()}`,
    };
}

// ============================================
// Question Generators (v2.0 対応)
// ============================================

const CHOICE_PROMPTS = [
    '「{meaning}」はどちら？',
    '{meaning} を表すのは？',
    '次のうち「{meaning}」は？',
];

const TF_STATEMENTS = [
    'これは「{meaning}」という意味である',
    '「{text}」は「{meaning}」を意味する',
    'この表現は「{meaning}」と訳せる',
];

function createChoiceQuestion(items: LearningItem[]): ChoiceQuestion | null {
    const eligible = items.filter(i => itemSupportsQuizMode(i, 'choice'));
    if (eligible.length < 2) return null;

    const shuffled = shuffleArray(eligible);
    const correctItem = shuffled[0];
    const incorrectItem = shuffled[1];

    const isACorrect = Math.random() > 0.5;
    const promptTemplate = getRandomItem(CHOICE_PROMPTS);
    const prompt = promptTemplate.replace('{meaning}', correctItem.meaning_ja);

    return {
        type: 'choice',
        prompt,
        optionA: isACorrect ? correctItem : incorrectItem,
        optionB: isACorrect ? incorrectItem : correctItem,
        correctAnswer: isACorrect ? 'A' : 'B',
    };
}

function createTrueFalseQuestion(items: LearningItem[]): TrueFalseQuestion | null {
    const eligible = items.filter(i => itemSupportsQuizMode(i, 'truefalse'));
    if (eligible.length < 2) return null;

    const correctItem = getRandomItem(eligible);
    const isTrue = Math.random() > 0.5;

    let displayedMeaning: string;
    if (isTrue) {
        displayedMeaning = correctItem.meaning_ja;
    } else {
        const otherItems = eligible.filter(i => i.id !== correctItem.id);
        displayedMeaning = getRandomItem(otherItems).meaning_ja;
    }

    const statementTemplate = getRandomItem(TF_STATEMENTS);
    const statement = statementTemplate
        .replace('{meaning}', displayedMeaning)
        .replace('{text}', correctItem.text);

    return {
        type: 'truefalse',
        item: correctItem,
        statement,
        isTrue,
    };
}

function createFillInQuestion(items: LearningItem[]): FillInQuestion | null {
    // 2単語以上のフレーズで穴埋め可能なものをフィルタ
    const eligible = items.filter(i =>
        itemSupportsQuizMode(i, 'fillin') && i.text.includes(' ')
    );
    if (eligible.length < 2) return null;

    const correctItem = getRandomItem(eligible);
    const words = correctItem.text.split(' ');

    const blankIndex = Math.floor(Math.random() * words.length);
    const correctPart = words[blankIndex];

    const maskedWords = [...words];
    maskedWords[blankIndex] = '___';
    const maskedText = maskedWords.join(' ');

    const otherItems = eligible.filter(i => i.id !== correctItem.id);
    const wrongItem = getRandomItem(otherItems);
    const wrongWords = wrongItem.text.split(' ');
    const wrongPart = wrongWords[Math.floor(Math.random() * wrongWords.length)];

    const isACorrect = Math.random() > 0.5;

    return {
        type: 'fillin',
        item: correctItem,
        maskedText,
        correctPart,
        wrongPart: wrongPart === correctPart ? wrongWords[0] : wrongPart,
        correctAnswer: isACorrect ? 'A' : 'B',
    };
}

// ============================================
// Store Implementation
// ============================================

export const useQuizStore = create<QuizStore>((set, get) => ({
    // Initial state
    items: [],
    dataSets: [],
    currentQuestion: null,
    mode: 'choice',
    progress: {
        todayCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastStudyDate: new Date().toISOString().split('T')[0],
    },
    session: {
        questionCount: 0,
        currentQuestionIndex: 0,
        isSessionActive: false,
        wrongOnlyMode: false,
        timerEnabled: false,
        timerSeconds: 5,
        categoryGroup: 'all',
        quizMode: 'choice',
    },
    settings: {
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
    },
    itemHistory: new Map(),
    showFeedback: false,
    lastAnswerCorrect: null,
    isSettingsOpen: false,
    isLoading: true,
    showSessionSetup: true,
    timerRemaining: null,

    // Get filtered items based on category group and language
    getFilteredItems: () => {
        const { items, session, mode, settings } = get();
        return items.filter(item => {
            // Language filter
            const langMatch = settings.currentLanguage === 'all' || item.lang === settings.currentLanguage;
            // Category filter
            const catMatch = itemMatchesCategoryGroup(item, session.categoryGroup);
            // Quiz mode filter
            const modeMatch = itemSupportsQuizMode(item, mode);
            return langMatch && catMatch && modeMatch;
        });
    },

    setItems: (items) => {
        set({ items });
    },

    addDataSet: (dataSet) => {
        // Add dataSet, add items with dataSetId
        const itemsWithDataSetId = dataSet.items.map(item => ({
            ...item,
            dataSetId: dataSet.id,
        }));

        const newDataSet = { ...dataSet, items: itemsWithDataSetId };

        set(state => {
            const newDataSets = [...state.dataSets, newDataSet];
            // Persist to storage (async with error handling)
            saveDataSets(newDataSets).catch(err => {
                console.error('[Store] Failed to save datasets:', err);
            });
            return {
                dataSets: newDataSets,
                // Only add items to store if dataset is loaded
                items: dataSet.isLoaded
                    ? [...state.items, ...itemsWithDataSetId]
                    : state.items,
            };
        });
    },

    removeDataSet: (dataSetId) => {
        const { dataSets } = get();
        const dataSet = dataSets.find(ds => ds.id === dataSetId);
        // Can't remove built-in or locked dataset
        if (!dataSet || dataSet.isBuiltIn || dataSet.isLocked) return;

        set(state => {
            const newDataSets = state.dataSets.filter(ds => ds.id !== dataSetId);
            // Persist to storage (async with error handling)
            saveDataSets(newDataSets).catch(err => {
                console.error('[Store] Failed to save datasets:', err);
            });
            return {
                dataSets: newDataSets,
                items: state.items.filter(item => item.dataSetId !== dataSetId),
            };
        });
    },

    toggleDataSet: (dataSetId) => {
        const { dataSets } = get();
        const dataSet = dataSets.find(ds => ds.id === dataSetId);
        // Can't unload locked dataset
        if (!dataSet || (dataSet.isLocked && dataSet.isLoaded)) return;

        const newIsLoaded = !dataSet.isLoaded;

        set(state => {
            const newDataSets = state.dataSets.map(ds =>
                ds.id === dataSetId ? { ...ds, isLoaded: newIsLoaded } : ds
            );
            // Persist to storage (async with error handling)
            saveDataSets(newDataSets).catch(err => {
                console.error('[Store] Failed to save datasets:', err);
            });
            return {
                dataSets: newDataSets,
                items: newIsLoaded
                    ? [...state.items, ...dataSet.items]
                    : state.items.filter(item => item.dataSetId !== dataSetId),
            };
        });
    },

    toggleDataSetLock: (dataSetId) => {
        const { dataSets } = get();
        const dataSet = dataSets.find(ds => ds.id === dataSetId);
        if (!dataSet) return;

        set(state => {
            const newDataSets = state.dataSets.map(ds =>
                ds.id === dataSetId ? { ...ds, isLocked: !ds.isLocked } : ds
            );
            // Persist to storage (async with error handling)
            saveDataSets(newDataSets).catch(err => {
                console.error('[Store] Failed to save datasets:', err);
            });
            return { dataSets: newDataSets };
        });
    },

    setMode: (mode) => {
        set({ mode, showFeedback: false });
        if (get().session.isSessionActive) {
            get().generateQuestion();
        }
    },

    setCategoryGroup: (group: CategoryGroup) => {
        set(state => ({
            session: { ...state.session, categoryGroup: group }
        }));
    },

    generateQuestion: () => {
        const { mode, session, itemHistory, settings } = get();
        let targetItems = get().getFilteredItems();

        // Filter for wrong-only mode
        if (session.wrongOnlyMode) {
            const wrongItems = targetItems.filter(item => {
                const history = itemHistory.get(item.id);
                return history && history.incorrectCount > history.correctCount;
            });
            targetItems = wrongItems.length >= 2 ? wrongItems : targetItems;
        }

        if (targetItems.length < 2) {
            set({ currentQuestion: null });
            return;
        }

        let question: Question | null = null;
        switch (mode) {
            case 'choice':
                question = createChoiceQuestion(targetItems);
                break;
            case 'truefalse':
                question = createTrueFalseQuestion(targetItems);
                break;
            case 'fillin':
                question = createFillInQuestion(targetItems);
                if (!question) {
                    question = createChoiceQuestion(targetItems);
                }
                break;
        }

        set({
            currentQuestion: question,
            showFeedback: false,
            lastAnswerCorrect: null,
            timerRemaining: settings.timerEnabled ? settings.timerSeconds : null,
        });

        // Auto-play audio if enabled
        if (settings.audioEnabled && question) {
            // 2択モードでは両方のオプションを読み上げ
            if (question.type === 'choice') {
                const textA = question.optionA.tts_text || question.optionA.text;
                const textB = question.optionB.tts_text || question.optionB.text;
                const lang = question.optionA.tts_lang || `${question.optionA.lang}-${question.optionA.lang.toUpperCase()}`;
                get().speakText(`${textA}. ${textB}`, lang);
            } else {
                // 正誤・穴埋めモードではアイテムを読み上げ
                get().speakItem(question.item);
            }
        }
    },

    submitAnswer: (answer) => {
        const { currentQuestion, progress, session, itemHistory } = get();
        if (!currentQuestion) return;

        let isCorrect = false;
        let answeredItemId = '';

        switch (currentQuestion.type) {
            case 'choice':
                isCorrect = answer === currentQuestion.correctAnswer;
                answeredItemId = currentQuestion.correctAnswer === 'A'
                    ? currentQuestion.optionA.id
                    : currentQuestion.optionB.id;
                break;
            case 'truefalse':
                isCorrect = answer === currentQuestion.isTrue;
                answeredItemId = currentQuestion.item.id;
                break;
            case 'fillin':
                isCorrect = answer === currentQuestion.correctAnswer;
                answeredItemId = currentQuestion.item.id;
                break;
        }

        const newHistory = new Map(itemHistory);
        const existing = newHistory.get(answeredItemId) || {
            itemId: answeredItemId,
            correctCount: 0,
            incorrectCount: 0,
            lastAnsweredAt: '',
        };
        newHistory.set(answeredItemId, {
            ...existing,
            correctCount: existing.correctCount + (isCorrect ? 1 : 0),
            incorrectCount: existing.incorrectCount + (isCorrect ? 0 : 1),
            lastAnsweredAt: new Date().toISOString(),
        });

        const newProgress: Progress = {
            ...progress,
            todayCount: progress.todayCount + 1,
            correctCount: progress.correctCount + (isCorrect ? 1 : 0),
            incorrectCount: progress.incorrectCount + (isCorrect ? 0 : 1),
        };

        const newSession: SessionSettings = {
            ...session,
            currentQuestionIndex: session.currentQuestionIndex + 1,
        };

        set({
            showFeedback: true,
            lastAnswerCorrect: isCorrect,
            progress: newProgress,
            session: newSession,
            itemHistory: newHistory,
            timerRemaining: null,
        });

        saveProgress(newProgress);
        saveItemHistory(newHistory);
    },

    nextQuestion: () => {
        const { session } = get();

        if (session.questionCount > 0 && session.currentQuestionIndex >= session.questionCount) {
            set({
                showSessionSetup: true,
                session: { ...session, isSessionActive: false },
                currentQuestion: null,
            });
            return;
        }

        get().generateQuestion();
    },

    toggleSettings: () => {
        set((state) => ({ isSettingsOpen: !state.isSettingsOpen }));
    },

    initializeProgress: async () => {
        const [progress, itemHistory, settings] = await Promise.all([
            loadProgress(),
            loadItemHistory(),
            loadSettings(),
        ]);
        set({ progress, itemHistory, settings, isLoading: false });
    },

    startSession: (questionCount: number, wrongOnlyMode: boolean = false) => {
        const { settings, session, mode } = get();
        set({
            session: {
                questionCount,
                currentQuestionIndex: 0,
                isSessionActive: true,
                wrongOnlyMode,
                timerEnabled: settings.timerEnabled,
                timerSeconds: settings.timerSeconds,
                categoryGroup: session.categoryGroup,
                quizMode: mode,
            },
            showSessionSetup: false,
        });
        get().generateQuestion();
    },

    endSession: () => {
        set({
            session: {
                questionCount: 0,
                currentQuestionIndex: 0,
                isSessionActive: false,
                wrongOnlyMode: false,
                timerEnabled: false,
                timerSeconds: 5,
                categoryGroup: 'all',
                quizMode: 'choice',
            },
            showSessionSetup: true,
            currentQuestion: null,
            timerRemaining: null,
        });
    },

    toggleSessionSetup: () => {
        set((state) => ({ showSessionSetup: !state.showSessionSetup }));
    },

    resetTodayProgress: async () => {
        const newProgress = await resetTodayProgress();
        set((state) => ({
            progress: newProgress,
            // Also reset session's wrongOnlyMode
            session: { ...state.session, wrongOnlyMode: false },
        }));
    },

    clearHistory: async () => {
        await clearItemHistory();
        set({ itemHistory: new Map() });
    },

    updateSettings: (newSettings: Partial<QuizSettings>) => {
        const { settings } = get();
        const updated = { ...settings, ...newSettings };
        set({ settings: updated });
        saveSettings(updated);
        // Sync debug mode with debug utility
        if (newSettings.debugMode !== undefined) {
            setDebugMode(newSettings.debugMode);
        }
    },

    // TTS: アイテムから直接読み上げ（v2.0対応）
    speakItem: (item: LearningItem) => {
        const { settings } = get();
        const { text, lang } = getTTSParams(item);
        speak(text, lang, {
            engine: settings.ttsEngine,
            rate: settings.ttsRate,
            pitch: settings.ttsPitch,
        });
    },

    // TTS: テキスト直接指定
    speakText: (text: string, lang: string = 'pl-PL') => {
        const { settings } = get();
        speak(text, lang, {
            engine: settings.ttsEngine,
            rate: settings.ttsRate,
            pitch: settings.ttsPitch,
        });
    },

    stopSpeaking: () => {
        stopSpeaking();
    },

    setTimerRemaining: (seconds: number | null) => {
        set({ timerRemaining: seconds });
    },

    resetToDefault: async () => {
        // Complete storage clear - removes ALL extension data
        await clearAllStorage();
        console.log('[Store] All storage cleared, resetting state');

        // Reset to initial state
        set({
            items: [],
            dataSets: [],
            currentQuestion: null,
            progress: {
                todayCount: 0,
                correctCount: 0,
                incorrectCount: 0,
                lastStudyDate: new Date().toISOString().split('T')[0],
            },
            session: {
                questionCount: 0,
                currentQuestionIndex: 0,
                isSessionActive: false,
                wrongOnlyMode: false,
                timerEnabled: false,
                timerSeconds: 5,
                categoryGroup: 'all',
                quizMode: 'choice',
            },
            settings: {
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
            },
            itemHistory: new Map(),
            showFeedback: false,
            lastAnswerCorrect: null,
            showSessionSetup: true,
        });
    },
}));
