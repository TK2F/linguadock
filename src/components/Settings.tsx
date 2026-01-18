import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { showToast } from '@/components/Toast';
import { useQuizStore } from '@/store/useQuizStore';
import { parseCSV, downloadCSV, generateAIPrompt, CSV_STRUCTURE_GUIDE } from '@/lib/csvHandler';
import { generateDataSetHash } from '@/lib/storage';
import { speak, getAvailableEngines } from '@/lib/tts';
import type { TTSEngineType } from '@/types/learning';
import { getLanguageConfig, SUPPORTED_LANGUAGES, CATEGORY_GROUPS } from '@/types/learning';

export function Settings() {
    const { items, dataSets, addDataSet, toggleDataSet, toggleDataSetLock, removeDataSet, toggleSettings, settings, updateSettings, resetToDefault } = useQuizStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [testText] = useState("Dzień dobry");

    // AI Prompt Generator state
    const [showAIPrompt, setShowAIPrompt] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiWordCount, setAiWordCount] = useState(20);
    const [aiLangCode, setAiLangCode] = useState('pl');
    const [aiCategory, setAiCategory] = useState('all');
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);
    const [showCSVGuide, setShowCSVGuide] = useState(false);

    // Confirm dialog states
    const [showImportConfirm, setShowImportConfirm] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    const availableEngines = getAvailableEngines();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show confirmation dialog before overwriting
        if (items.length > 0) {
            setPendingFile(file);
            setShowImportConfirm(true);
        } else {
            await processImport(file);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const processImport = async (file: File) => {
        try {
            const text = await file.text();
            const newItems = parseCSV(text);
            if (newItems.length > 0) {
                // データセットにユニークIDを付与
                const maxId = items.reduce((max, item) => {
                    const numId = parseInt(item.id, 10);
                    return isNaN(numId) ? max : Math.max(max, numId);
                }, 0);
                const itemsWithNewIds = newItems.map((item, index) => ({
                    ...item,
                    id: `${maxId + index + 1}`,
                }));

                // 言語を検出（最初のアイテムの言語を使用）
                const langCode = newItems[0]?.lang || 'other';
                const langConfig = getLanguageConfig(langCode);

                // 重複検出
                const newHash = generateDataSetHash(itemsWithNewIds);
                const isDuplicate = dataSets.some(ds =>
                    generateDataSetHash(ds.items) === newHash
                );

                if (isDuplicate) {
                    showToast('同じ内容のCSVが既に読み込まれています', 'warning');
                    return;
                }

                // データセットとして追加
                addDataSet({
                    id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: `${langConfig.emoji} ${file.name.replace('.csv', '')}`,
                    langCode: langCode,
                    isBuiltIn: false,
                    isLoaded: true,
                    isLocked: false,
                    items: itemsWithNewIds,
                    createdAt: new Date().toISOString(),
                });
                showToast(`${newItems.length}件のデータを追加しました！`, 'success');
            } else {
                showToast('CSVファイルにデータがありません', 'warning');
            }
        } catch (error) {
            console.error('Failed to parse CSV:', error);
            showToast('CSVファイルの読み込みに失敗しました', 'error');
        }
    };

    const handleImportConfirm = async () => {
        setShowImportConfirm(false);
        if (pendingFile) {
            await processImport(pendingFile);
            setPendingFile(null);
        }
    };

    const handleImportCancel = () => {
        setShowImportConfirm(false);
        setPendingFile(null);
    };

    const handleResetConfirm = async () => {
        setShowResetConfirm(false);
        await resetToDefault();
        showToast('すべてのデータが初期化されました。再読み込みします...', 'success');
        // Reload to trigger App.tsx initialization with fresh built-in CSVs
        setTimeout(() => window.location.reload(), 1000);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleExportClick = () => {
        if (items.length === 0) {
            showToast('エクスポートするデータがありません', 'warning');
            return;
        }

        setIsExporting(true);
        try {
            const date = new Date().toISOString().split('T')[0];
            downloadCSV(items, `linguadock-${date}.csv`);
        } catch (error) {
            console.error('Failed to export CSV:', error);
            showToast('CSVエクスポートに失敗しました', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const handleTestAudio = () => {
        speak(testText, 'pl-PL', {
            engine: settings.ttsEngine,
            rate: settings.ttsRate,
            pitch: settings.ttsPitch,
        });
    };

    const handleGeneratePrompt = () => {
        if (!aiTopic.trim()) {
            showToast('トピックを入力してください', 'warning');
            return;
        }
        const langConfig = getLanguageConfig(aiLangCode);
        const prompt = generateAIPrompt({
            topic: aiTopic,
            wordCount: aiWordCount,
            langCode: aiLangCode,
            langName: langConfig.name,
            category: aiCategory !== 'all' ? aiCategory : undefined,
        });
        setGeneratedPrompt(prompt);
    };

    const handleCopyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(generatedPrompt);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch {
            alert('クリップボードへのコピーに失敗しました');
        }
    };

    const engineLabels: Record<TTSEngineType, string> = {
        chrome: 'Chrome TTS',
        web: 'Web Speech',
        none: 'オフ',
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
            <Card className="w-full max-w-md animate-in zoom-in-95 duration-200 my-4">
                <CardHeader className="pb-3">
                    <CardTitle className="text-center text-lg">⚙️ 設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Current data info */}
                    <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            現在のデータ: <span className="font-bold text-foreground">{items.length}</span> 語
                        </p>
                    </div>

                    {/* DataSet Management */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium">📚 データセット管理</p>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {dataSets.map(ds => (
                                <div
                                    key={ds.id}
                                    className={`flex items-center justify-between p-2 rounded-lg text-xs ${ds.isLoaded ? 'bg-primary/10' : 'bg-muted/50 opacity-60'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <button
                                            onClick={() => toggleDataSet(ds.id)}
                                            className="text-lg"
                                        >
                                            {ds.isLoaded ? '☑️' : '☐'}
                                        </button>
                                        <span className="truncate">{ds.name}</span>
                                        <span className="text-muted-foreground shrink-0">
                                            ({ds.items.length}語)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {/* ロック切り替えボタン */}
                                        <button
                                            onClick={() => toggleDataSetLock(ds.id)}
                                            className="p-1 hover:bg-muted rounded"
                                            title={ds.isLocked ? "ロック解除" : "ロック"}
                                        >
                                            {ds.isLocked ? '🔒' : '🔓'}
                                        </button>
                                        {ds.isBuiltIn && (
                                            <span className="text-xs text-muted-foreground" title="同梱CSV">📦</span>
                                        )}
                                        {/* 削除ボタン（ユーザーCSVかつ非ロック時のみ） */}
                                        {!ds.isBuiltIn && !ds.isLocked && (
                                            <button
                                                onClick={() => removeDataSet(ds.id)}
                                                className="p-1 text-destructive hover:bg-destructive/10 rounded"
                                                title="データセットを削除"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {dataSets.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                    データセットがありません
                                </p>
                            )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            ☑️ ロード中 / ☐ アンロード / 🔒 削除不可
                        </p>
                    </div>

                    {/* UI Theme Settings - FIRST */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium">🎨 表示設定</p>

                        {/* Dark Mode */}
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <span className="text-xs">テーマ</span>
                            <select
                                value={settings.darkMode}
                                onChange={(e) => updateSettings({ darkMode: e.target.value as 'light' | 'dark' | 'system' })}
                                className="h-7 px-2 rounded border bg-background text-xs"
                            >
                                <option value="light">☀️ ライト</option>
                                <option value="dark">🌙 ダーク</option>
                                <option value="system">🖥️ システム</option>
                            </select>
                        </div>
                    </div>

                    {/* TTS Settings - SECOND */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium">🔊 音声設定</p>

                        {/* Engine Selection */}
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <span className="text-xs">エンジン</span>
                            <select
                                value={settings.ttsEngine}
                                onChange={(e) => updateSettings({ ttsEngine: e.target.value as TTSEngineType })}
                                className="h-7 px-2 rounded border bg-background text-xs"
                            >
                                {availableEngines.map(engine => (
                                    <option key={engine} value={engine}>{engineLabels[engine]}</option>
                                ))}
                            </select>
                        </div>

                        {/* Rate */}
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <span className="text-xs">速度 ({settings.ttsRate.toFixed(1)})</span>
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={settings.ttsRate}
                                onChange={(e) => updateSettings({ ttsRate: parseFloat(e.target.value) })}
                                className="w-24"
                            />
                        </div>

                        {/* Pitch */}
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <span className="text-xs">音程 ({settings.ttsPitch.toFixed(1)})</span>
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={settings.ttsPitch}
                                onChange={(e) => updateSettings({ ttsPitch: parseFloat(e.target.value) })}
                                className="w-24"
                            />
                        </div>

                        {/* Test button */}
                        <Button
                            onClick={handleTestAudio}
                            variant="outline"
                            size="sm"
                            className="w-full"
                            disabled={settings.ttsEngine === 'none'}
                        >
                            🔊 テスト再生: "{testText}"
                        </Button>
                    </div>



                    {/* CSV Import/Export */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium">📁 CSVデータ管理</p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                onClick={handleImportClick}
                                variant="outline"
                                size="sm"
                                className="w-full"
                            >
                                📥 インポート
                            </Button>
                            <Button
                                onClick={handleExportClick}
                                variant="outline"
                                size="sm"
                                className="w-full"
                                disabled={items.length === 0 || isExporting}
                            >
                                📤 エクスポート
                            </Button>
                        </div>
                    </div>

                    {/* AI CSV Generator */}
                    <div className="space-y-3">
                        <button
                            onClick={() => setShowAIPrompt(!showAIPrompt)}
                            className="flex items-center justify-between w-full text-sm font-medium p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <span>🤖 CSV生成用プロンプト</span>
                            <span className="text-muted-foreground">{showAIPrompt ? '▲' : '▼'}</span>
                        </button>

                        {showAIPrompt && (
                            <div className="space-y-3 p-3 bg-muted/30 rounded-lg animate-in fade-in duration-200">
                                {/* Language Selection */}
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">言語</label>
                                    <select
                                        value={aiLangCode}
                                        onChange={(e) => setAiLangCode(e.target.value)}
                                        className="w-full h-8 px-2 rounded border bg-background text-sm"
                                    >
                                        {SUPPORTED_LANGUAGES.filter(l => l.code !== 'other').map(lang => (
                                            <option key={lang.code} value={lang.code}>
                                                {lang.emoji} {lang.name}
                                            </option>
                                        ))}
                                        <option value="other">🌐 その他（手動で指定）</option>
                                    </select>
                                </div>

                                {/* Topic */}
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">トピック/テーマ</label>
                                    <input
                                        type="text"
                                        value={aiTopic}
                                        onChange={(e) => setAiTopic(e.target.value)}
                                        placeholder="例: レストラン、旅行、買い物..."
                                        className="w-full h-8 px-3 rounded border bg-background text-sm"
                                    />
                                </div>

                                {/* Category */}
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">カテゴリ（任意）</label>
                                    <select
                                        value={aiCategory}
                                        onChange={(e) => setAiCategory(e.target.value)}
                                        className="w-full h-8 px-2 rounded border bg-background text-sm"
                                    >
                                        <option value="all">指定なし</option>
                                        {CATEGORY_GROUPS.filter(g => g.value !== 'all').map(cat => (
                                            <option key={cat.value} value={cat.label}>
                                                {cat.emoji} {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Word Count */}
                                <div className="flex items-center justify-between">
                                    <label className="text-xs text-muted-foreground">単語数: {aiWordCount}</label>
                                    <input
                                        type="range"
                                        min="5"
                                        max="50"
                                        step="5"
                                        value={aiWordCount}
                                        onChange={(e) => setAiWordCount(parseInt(e.target.value))}
                                        className="w-32"
                                    />
                                </div>

                                {/* CSV Structure Guide Button */}
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleGeneratePrompt}
                                        size="sm"
                                        className="flex-1"
                                    >
                                        プロンプト生成
                                    </Button>
                                    <Button
                                        onClick={() => setShowCSVGuide(true)}
                                        variant="outline"
                                        size="sm"
                                        title="CSV構造ガイド"
                                    >
                                        ℹ️
                                    </Button>
                                </div>

                                {generatedPrompt && (
                                    <div className="space-y-2">
                                        <div className="text-xs text-muted-foreground">
                                            以下をClaude/Gemini/ChatGPTにコピペ:
                                        </div>
                                        <pre className="p-2 bg-background rounded text-[10px] max-h-32 overflow-y-auto whitespace-pre-wrap border">
                                            {generatedPrompt}
                                        </pre>
                                        <Button
                                            onClick={handleCopyPrompt}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            {copySuccess ? '✅ コピーしました！' : '📋 クリップボードにコピー'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* CSV Format hint */}
                    <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">CSV形式 (v2.0):</p>
                        <code className="block overflow-x-auto whitespace-nowrap text-[10px]">
                            id,lang,text,reading_kana,meaning_ja,hint,tags
                        </code>
                        <p className="text-[10px] mt-1">
                            ※ v1.0形式（polish,kana,japanese）も自動変換でインポート可能
                        </p>
                        <p className="text-[10px]">
                            ※ UTF-8 BOM形式で保存（Excel対応）
                        </p>
                    </div>

                    {/* Developer Mode */}
                    <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-muted">
                        <p className="text-sm font-medium">🔧 開発者向け</p>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">デバッグモード</p>
                                <p className="text-[10px] text-muted-foreground">コンソールに詳細ログを出力</p>
                            </div>
                            <button
                                onClick={() => updateSettings({ debugMode: !settings.debugMode })}
                                className={`w-10 h-5 rounded-full transition-colors ${settings.debugMode ? 'bg-primary' : 'bg-muted'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.debugMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="space-y-2 pt-2 border-t border-destructive/20">
                        <p className="text-sm font-medium text-destructive">🚨 危険な操作</p>
                        <Button
                            onClick={() => setShowResetConfirm(true)}
                            variant="outline"
                            size="sm"
                            className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                        >
                            🗑️ すべてのデータを初期化
                        </Button>
                    </div>

                    {/* Close button */}
                    <Button
                        onClick={toggleSettings}
                        className="w-full"
                    >
                        閉じる
                    </Button>
                </CardContent>
            </Card>

            {/* Import Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showImportConfirm}
                title="データ追加確認"
                message="CSVのデータを既存データに追加します。"
                hint="重複するデータがあっても自動的にIDが割り振られます。"
                confirmLabel="追加する"
                cancelLabel="キャンセル"
                onConfirm={handleImportConfirm}
                onCancel={handleImportCancel}
            />

            {/* Reset Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showResetConfirm}
                title="初期化確認"
                message="すべてのデータと設定が初期化されます。この操作は取り消せません！"
                hint="必要に応じて先にCSVをエクスポートしてください。"
                confirmLabel="初期化する"
                cancelLabel="キャンセル"
                variant="danger"
                onConfirm={handleResetConfirm}
                onCancel={() => setShowResetConfirm(false)}
            />

            {/* CSV Structure Guide Popup */}
            {showCSVGuide && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <Card className="w-full max-w-md max-h-[80vh] overflow-hidden animate-in zoom-in-95">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">📋 CSV構造ガイド</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 overflow-y-auto max-h-[60vh]">
                            <pre className="text-[11px] whitespace-pre-wrap bg-muted p-3 rounded-lg leading-relaxed">
                                {CSV_STRUCTURE_GUIDE}
                            </pre>
                            <Button
                                onClick={() => setShowCSVGuide(false)}
                                className="w-full"
                                size="sm"
                            >
                                閉じる
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
