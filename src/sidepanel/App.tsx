import { useEffect, useState, useRef, useCallback } from 'react';
import { useQuizStore } from '@/store/useQuizStore';
import { QuizCard } from '@/components/QuizCard';
import { TrueFalseCard } from '@/components/TrueFalseCard';
import { FillInCard } from '@/components/FillInCard';
import { Settings } from '@/components/Settings';
import { WelcomePopup } from '@/components/WelcomePopup';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ToastContainer } from '@/components/Toast';
import { parseCSV } from '@/lib/csvHandler';
import { loadDataSets, isFirstLaunch, markLaunched } from '@/lib/storage';
import { BUILT_IN_DATASETS } from '@/lib/builtInDataSets';
import { PRESET_QUESTION_COUNTS, QUIZ_MODES, CATEGORY_GROUPS, getAvailableCategories, getUsedLanguages } from '@/types/learning';
import type { QuizMode, CategoryGroup, DataSet } from '@/types/learning';
import { debugLog } from '@/lib/debug';

// 同梱CSVファイルをインポート
import polishCSV from '@/data/polish_sample.csv?raw';
import englishCSV from '@/data/english_sample.csv?raw';
import germanCSV from '@/data/german_sample.csv?raw';
import frenchCSV from '@/data/french_sample.csv?raw';
import spanishCSV from '@/data/spanish_sample.csv?raw';
import indonesianCSV from '@/data/indonesian_sample.csv?raw';
import koreanCSV from '@/data/korean_sample.csv?raw';
import chineseCSV from '@/data/chinese_sample.csv?raw';

// CSV raw data mapping
const BUILT_IN_CSV_MAP: Record<string, string> = {
    'builtin-pl': polishCSV,
    'builtin-en': englishCSV,
    'builtin-de': germanCSV,
    'builtin-fr': frenchCSV,
    'builtin-es': spanishCSV,
    'builtin-id': indonesianCSV,
    'builtin-ko': koreanCSV,
    'builtin-zh': chineseCSV,
};

export default function App() {
    const {
        items,
        addDataSet,
        currentQuestion,
        mode,
        setMode,
        progress,
        session,
        settings,
        itemHistory,
        isSettingsOpen,
        toggleSettings,
        isLoading,
        initializeProgress,
        showSessionSetup,
        startSession,
        endSession,
        resetTodayProgress,
        updateSettings,
        timerRemaining,
        setTimerRemaining,
        submitAnswer,
        setCategoryGroup,
        getFilteredItems,
    } = useQuizStore();

    const [customCount, setCustomCount] = useState<number>(20);
    const [categoryOpen, setCategoryOpen] = useState<boolean>(false);
    const [showWelcome, setShowWelcome] = useState<boolean>(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize on mount
    useEffect(() => {
        const initializeApp = async () => {
            await initializeProgress();

            // Check if first launch
            const firstLaunch = await isFirstLaunch();

            // Try to load persisted datasets first
            const persistedDataSets = await loadDataSets();
            debugLog('App', 'Loaded persisted datasets:', persistedDataSets.length,
                persistedDataSets.map(ds => ({ id: ds.id, name: ds.name, isBuiltIn: ds.isBuiltIn, storedItemsCount: ds.items?.length || 0 })));

            if (persistedDataSets.length > 0) {
                // Restore persisted datasets
                persistedDataSets.forEach(ds => {
                    if (ds.isBuiltIn) {
                        // Built-in: ALWAYS parse fresh from bundled CSV (never use stored items)
                        const csvRaw = BUILT_IN_CSV_MAP[ds.id];
                        if (csvRaw) {
                            const items = parseCSV(csvRaw);
                            debugLog('App', `Built-in ${ds.id}: stored=${ds.items?.length || 0}, parsed=${items.length}`);
                            addDataSet({ ...ds, items });
                        }
                    } else {
                        // User CSV: use stored items
                        debugLog('App', `User CSV ${ds.id}: items=${ds.items?.length || 0}`);
                        addDataSet(ds);
                    }
                });
            } else if (firstLaunch) {
                debugLog('App', 'First launch - loading default datasets');
                // First launch: load default datasets (English + Polish)
                BUILT_IN_DATASETS.forEach(meta => {
                    const csvRaw = BUILT_IN_CSV_MAP[meta.id];
                    if (csvRaw) {
                        const items = parseCSV(csvRaw);
                        debugLog('App', `First launch ${meta.id}: parsed=${items.length}`);
                        const dataSet: DataSet = {
                            id: meta.id,
                            name: `${meta.emoji} ${meta.name}`,
                            langCode: meta.langCode,
                            isBuiltIn: true,
                            isLoaded: meta.defaultLoaded,
                            isLocked: false,
                            items: items, // Always keep items for word count display
                        };
                        addDataSet(dataSet);
                    }
                });
                setShowWelcome(true);
                await markLaunched();
            }
        };

        initializeApp();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Apply dark mode theme
    useEffect(() => {
        const root = document.documentElement;

        // Dark mode
        if (settings.darkMode === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.toggle('dark', prefersDark);
        } else {
            root.classList.toggle('dark', settings.darkMode === 'dark');
        }
    }, [settings.darkMode]);

    // Auto-reset category when language changes (prevent selecting unavailable category)
    useEffect(() => {
        if (session.categoryGroup !== 'all') {
            // Check if selected category is available in current language-filtered items
            const langFilteredItems = settings.currentLanguage === 'all'
                ? items
                : items.filter(item => item.lang === settings.currentLanguage);
            const availableGroups = getAvailableCategories(langFilteredItems).map(g => g.value);

            if (!availableGroups.includes(session.categoryGroup)) {
                setCategoryGroup('all');
            }
        }
    }, [settings.currentLanguage, items, session.categoryGroup, setCategoryGroup]);

    // Timer effect
    useEffect(() => {
        if (timerRemaining === null || timerRemaining <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            setTimerRemaining(timerRemaining - 1);
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timerRemaining, setTimerRemaining]);

    // Auto-submit when timer reaches 0
    useEffect(() => {
        if (timerRemaining === 0 && currentQuestion) {
            if (currentQuestion.type === 'choice' || currentQuestion.type === 'fillin') {
                submitAnswer(currentQuestion.correctAnswer === 'A' ? 'B' : 'A');
            } else {
                submitAnswer(!currentQuestion.isTrue);
            }
        }
    }, [timerRemaining, currentQuestion, submitAnswer]);

    // Count wrong items
    const wrongItemCount = Array.from(itemHistory.values()).filter(
        h => h.incorrectCount > h.correctCount
    ).length;

    // Get items filtered by current language (for category display)
    const languageFilteredItems = settings.currentLanguage === 'all'
        ? items
        : items.filter(item => item.lang === settings.currentLanguage);

    const filteredItemCount = getFilteredItems().length;

    const handleResetProgress = useCallback(async () => {
        if (confirm('今日の進捗をリセットしますか？')) {
            await resetTodayProgress();
        }
    }, [resetTodayProgress]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="animate-pulse text-muted-foreground">読み込み中...</div>
            </div>
        );
    }

    // Session setup screen
    if (showSessionSetup) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
                {/* Header */}
                <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b shrink-0">
                    <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🌐</span>
                            <h1 className="font-bold text-base">LinguaDock</h1>
                        </div>
                        <Button variant="ghost" size="sm" onClick={toggleSettings}>
                            ⚙️
                        </Button>
                    </div>
                    {/* Language Selector */}
                    <div className="px-3 pb-2">
                        <select
                            value={settings.currentLanguage}
                            onChange={(e) => updateSettings({ currentLanguage: e.target.value })}
                            className="w-full h-8 px-3 rounded-full border bg-gradient-to-r from-primary/10 to-primary/5 text-sm font-medium focus:ring-2 focus:ring-primary/50 cursor-pointer transition-all hover:from-primary/20 hover:to-primary/10"
                        >
                            <option value="all">📚 すべての言語</option>
                            {getUsedLanguages(items).filter(l => l.code !== 'other').map(lang => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.emoji} {lang.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </header>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Stats */}
                    <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
                        <CardContent className="p-3">
                            <div className="grid grid-cols-4 gap-2 text-sm">
                                <div className="text-center">
                                    <p className="text-xl font-bold text-primary">
                                        {settings.currentLanguage === 'all'
                                            ? items.length
                                            : items.filter(item => item.lang === settings.currentLanguage).length}
                                    </p>
                                    <p className="text-xs text-muted-foreground">登録語</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-bold text-orange-600">{getFilteredItems().length}</p>
                                    <p className="text-xs text-muted-foreground">対象</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-bold text-green-600">{progress.todayCount}</p>
                                    <p className="text-xs text-muted-foreground">今日</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-bold text-blue-600">
                                        {progress.todayCount > 0
                                            ? Math.round((progress.correctCount / progress.todayCount) * 100)
                                            : 0}%
                                    </p>
                                    <p className="text-xs text-muted-foreground">正答率</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quiz Mode Selection */}
                    <div>
                        <h2 className="text-sm font-bold mb-2 text-muted-foreground">クイズモード</h2>
                        <div className="grid grid-cols-3 gap-2">
                            {QUIZ_MODES.map(m => (
                                <Card
                                    key={m.value}
                                    className={`cursor-pointer transition-all ${mode === m.value
                                        ? 'border-primary bg-primary/10 ring-2 ring-primary'
                                        : 'hover:border-primary/50'
                                        }`}
                                    onClick={() => setMode(m.value as QuizMode)}
                                >
                                    <CardContent className="p-3 text-center">
                                        <span className="text-2xl">{m.emoji}</span>
                                        <p className="text-xs font-bold mt-1">{m.label}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                            {QUIZ_MODES.find(m => m.value === mode)?.description}
                        </p>
                    </div>

                    {/* Category Selection - Collapsible */}
                    <div>
                        <button
                            onClick={() => setCategoryOpen(!categoryOpen)}
                            className="flex items-center justify-between w-full text-sm font-bold mb-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <span>カテゴリ</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                    {CATEGORY_GROUPS.find(g => g.value === session.categoryGroup)?.emoji}{' '}
                                    {CATEGORY_GROUPS.find(g => g.value === session.categoryGroup)?.label}
                                </span>
                                <span>{categoryOpen ? '▲' : '▼'}</span>
                            </div>
                        </button>
                        {categoryOpen && (
                            <div className="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto p-1 animate-in fade-in duration-200">
                                {getAvailableCategories(languageFilteredItems).map(g => (
                                    <button
                                        key={g.value}
                                        onClick={() => {
                                            setCategoryGroup(g.value as CategoryGroup);
                                            setCategoryOpen(false);
                                        }}
                                        className={`p-2 rounded-lg text-center transition-all ${session.categoryGroup === g.value
                                            ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                                            : 'bg-muted/50 hover:bg-muted'
                                            }`}
                                    >
                                        <span className="text-lg block">{g.emoji}</span>
                                        <span className="text-[9px] font-medium block truncate">{g.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                            対象: {filteredItemCount}語
                        </p>
                    </div>

                    {/* Question Count */}
                    <div>
                        <h2 className="text-sm font-bold mb-2 text-muted-foreground">問題数</h2>
                        <div className="grid grid-cols-4 gap-2">
                            {PRESET_QUESTION_COUNTS.map(count => (
                                <Button
                                    key={count}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => startSession(count)}
                                    disabled={filteredItemCount < 2}
                                >
                                    {count === 0 ? '∞' : count}
                                </Button>
                            ))}
                        </div>
                        {/* Custom count */}
                        <div className="flex gap-2 mt-2">
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={customCount}
                                onChange={e => setCustomCount(parseInt(e.target.value) || 1)}
                                className="flex-1 h-8 px-2 border rounded text-sm"
                            />
                            <Button
                                size="sm"
                                onClick={() => startSession(customCount)}
                                disabled={filteredItemCount < 2}
                            >
                                開始
                            </Button>
                        </div>
                    </div>

                    {/* Special Modes */}
                    {wrongItemCount > 0 && (
                        <Button
                            variant="outline"
                            className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                            onClick={() => startSession(wrongItemCount > 10 ? 10 : wrongItemCount, true)}
                        >
                            🔄 間違い重点モード ({wrongItemCount}語)
                        </Button>
                    )}

                    {/* Settings Toggles */}
                    <div className="grid grid-cols-2 gap-2">
                        <Card
                            className={`cursor-pointer transition-all ${settings.audioEnabled ? 'border-primary bg-primary/10' : ''
                                }`}
                            onClick={() => updateSettings({ audioEnabled: !settings.audioEnabled })}
                        >
                            <CardContent className="p-3 text-center">
                                <span className="text-lg">{settings.audioEnabled ? '🔊' : '🔇'}</span>
                                <p className="text-xs mt-1">音声</p>
                            </CardContent>
                        </Card>
                        <Card
                            className={`cursor-pointer transition-all ${settings.timerEnabled ? 'border-primary bg-primary/10' : ''
                                }`}
                            onClick={() => updateSettings({ timerEnabled: !settings.timerEnabled })}
                        >
                            <CardContent className="p-3 text-center">
                                <span className="text-lg">{settings.timerEnabled ? '⏱️' : '⏸️'}</span>
                                <p className="text-xs mt-1">タイマー {settings.timerEnabled ? `${settings.timerSeconds}秒` : 'OFF'}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Reset Progress */}
                    {progress.todayCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-muted-foreground"
                            onClick={handleResetProgress}
                        >
                            🗑️ 今日の進捗をリセット
                        </Button>
                    )}
                </div>

                {/* Settings Modal */}
                {isSettingsOpen && <Settings />}
            </div>
        );
    }

    // Active quiz screen
    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b shrink-0">
                <div className="flex items-center justify-between p-2">
                    <Button variant="ghost" size="sm" onClick={endSession}>
                        ← 戻る
                    </Button>
                    <div className="flex items-center gap-2 text-sm">
                        {session.questionCount > 0 ? (
                            <span className="font-bold">
                                {session.currentQuestionIndex + (currentQuestion ? 0 : 1)}/{session.questionCount}
                            </span>
                        ) : (
                            <span className="font-bold">#{session.currentQuestionIndex + 1}</span>
                        )}
                        {timerRemaining !== null && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${timerRemaining <= 3
                                ? 'bg-red-100 text-red-600 animate-pulse'
                                : 'bg-primary/10 text-primary'
                                }`}>
                                ⏱️ {timerRemaining}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10">
                            {QUIZ_MODES.find(m => m.value === mode)?.emoji} {QUIZ_MODES.find(m => m.value === mode)?.label}
                        </span>
                    </div>
                </div>
                {/* Progress bar */}
                {session.questionCount > 0 && (
                    <div className="h-1 bg-muted">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{
                                width: `${(session.currentQuestionIndex / session.questionCount) * 100}%`
                            }}
                        />
                    </div>
                )}
            </header>

            {/* Quiz Content */}
            <main className="flex-1 overflow-y-auto p-3">
                {currentQuestion ? (
                    currentQuestion.type === 'choice' ? (
                        <QuizCard question={currentQuestion} />
                    ) : currentQuestion.type === 'fillin' ? (
                        <FillInCard question={currentQuestion} />
                    ) : (
                        <TrueFalseCard question={currentQuestion} />
                    )
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">問題を生成中...</p>
                    </div>
                )}
            </main>

            {/* Footer Stats */}
            <footer className="border-t bg-background/95 backdrop-blur p-2 shrink-0">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                        ✅ {progress.correctCount} / ❌ {progress.incorrectCount}
                    </span>
                    <span>
                        正答率: {progress.todayCount > 0
                            ? Math.round((progress.correctCount / progress.todayCount) * 100)
                            : 0}%
                    </span>
                </div>
            </footer>

            {isSettingsOpen && <Settings />}
            {showWelcome && <WelcomePopup onClose={() => setShowWelcome(false)} />}
            <ToastContainer />
        </div>
    );
}
