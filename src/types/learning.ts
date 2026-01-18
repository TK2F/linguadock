// ============================================
// LinguaDock v2.0 - Learning Item Types
// ============================================

// クイズモード制御フラグ（CSV quiz_flags カラム）
export interface QuizFlags {
    choice?: boolean;      // 2択モード
    fillin?: boolean;      // 穴埋めモード
    truefalse?: boolean;   // 正誤モード
}

// デフォルトのクイズフラグ（すべて有効）
export const DEFAULT_QUIZ_FLAGS: QuizFlags = {
    choice: true,
    fillin: true,
    truefalse: true,
};

// ============================================
// 言語設定（多言語対応）
// ============================================
export interface LanguageConfig {
    code: string;           // 言語コード (pl, en, de, etc.)
    name: string;           // 日本語名
    ttsLang: string;        // TTS言語コード (pl-PL, en-US, etc.)
    emoji: string;          // 国旗絵文字
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
    { code: 'pl', name: 'ポーランド語', ttsLang: 'pl-PL', emoji: '🇵🇱' },
    { code: 'en', name: '英語', ttsLang: 'en-US', emoji: '🇬🇧' },
    { code: 'de', name: 'ドイツ語', ttsLang: 'de-DE', emoji: '🇩🇪' },
    { code: 'fr', name: 'フランス語', ttsLang: 'fr-FR', emoji: '🇫🇷' },
    { code: 'es', name: 'スペイン語', ttsLang: 'es-ES', emoji: '🇪🇸' },
    { code: 'it', name: 'イタリア語', ttsLang: 'it-IT', emoji: '🇮🇹' },
    { code: 'pt', name: 'ポルトガル語', ttsLang: 'pt-PT', emoji: '🇵🇹' },
    { code: 'id', name: 'インドネシア語', ttsLang: 'id-ID', emoji: '🇮🇩' },
    { code: 'ru', name: 'ロシア語', ttsLang: 'ru-RU', emoji: '🇷🇺' },
    { code: 'ko', name: '韓国語', ttsLang: 'ko-KR', emoji: '🇰🇷' },
    { code: 'zh', name: '中国語', ttsLang: 'zh-CN', emoji: '🇨🇳' },
    { code: 'th', name: 'タイ語', ttsLang: 'th-TH', emoji: '🇹🇭' },
    { code: 'vi', name: 'ベトナム語', ttsLang: 'vi-VN', emoji: '🇻🇳' },
    { code: 'other', name: 'その他', ttsLang: '', emoji: '🌐' },
];

// 言語コードから設定を取得（フォールバック付き）
export function getLanguageConfig(code: string): LanguageConfig {
    return SUPPORTED_LANGUAGES.find(l => l.code === code)
        ?? SUPPORTED_LANGUAGES.find(l => l.code === 'other')!;
}

// データから使用されている言語を取得
export function getUsedLanguages(items: LearningItem[]): LanguageConfig[] {
    const usedCodes = new Set(items.map(item => item.lang));
    return SUPPORTED_LANGUAGES.filter(l =>
        usedCodes.has(l.code) || l.code === 'other'
    );
}

// ============================================
// データセット管理
// ============================================
export interface DataSet {
    id: string;           // ユニークID（UUID形式）
    name: string;         // 表示名
    langCode: string;     // 言語コード
    isBuiltIn: boolean;   // 同梱CSV（削除不可だが非ロード可）
    isLoaded: boolean;    // 現在ロード中か
    isLocked: boolean;    // ロック状態（削除・アンロード不可）
    items: LearningItem[]; // アイテムデータ
    createdAt?: string;   // 作成日時
}

// メタデータ（拡張用）
export interface ItemMeta {
    source?: string;        // データソース (anki, ai, manual, etc.)
    ankiId?: string;        // Anki連携ID
    createdAt?: string;     // 作成日時
    updatedAt?: string;     // 更新日時
    [key: string]: unknown; // 任意の拡張
}

// ============================================
// Learning Item (v2.0 - 多言語対応)
// ============================================
export interface LearningItem {
    id: string;

    // コアフィールド
    lang: string;              // 言語コード (pl, en, de, etc.)
    text: string;              // 学習対象テキスト
    reading_kana: string;      // カタカナ読み
    meaning_ja: string;        // 日本語訳

    // TTS設定（明示的に分離）
    tts_text?: string;         // TTS用テキスト（省略時はtext使用）
    tts_lang?: string;         // TTS言語コード（省略時はlang-XX形式推定）

    // 補足情報
    hint?: string;             // ヒント
    example?: string;          // 例文

    // クイズ制御
    quiz_flags?: QuizFlags;    // クイズモード制御

    // タグ・メタデータ
    tags?: string[];           // タグ（フィルタ用）
    meta?: ItemMeta;           // 拡張用メタデータ

    // データセット管理
    dataSetId?: string;        // 所属データセットID
}

// ============================================
// 後方互換用: v1.0形式の型（インポート時に変換）
// ============================================
export interface LearningItemV1 {
    id: string;
    polish: string;
    kana: string;
    japanese: string;
    category: string;
    subcategory?: string;
    level?: number;
    note?: string;
    example?: string;
    exampleKana?: string;
    exampleJp?: string;
}

// v1.0 → v2.0 変換関数
export function migrateV1toV2(v1: LearningItemV1): LearningItem {
    const tags: string[] = [];
    if (v1.category) tags.push(v1.category);
    if (v1.subcategory) tags.push(v1.subcategory);

    return {
        id: v1.id,
        lang: 'pl',
        text: v1.polish,
        reading_kana: v1.kana,
        meaning_ja: v1.japanese,
        tts_text: v1.polish,
        tts_lang: 'pl-PL',
        hint: v1.note,
        example: v1.example,
        quiz_flags: DEFAULT_QUIZ_FLAGS,
        tags: tags.length > 0 ? tags : undefined,
        meta: v1.level ? { level: v1.level } : undefined,
    };
}

// ============================================
// カテゴリ・フィルタ（タグベースに移行）
// ============================================

// 24カテゴリシステム
export type CategoryGroup =
    | 'all'
    | '挨拶'
    | '自己紹介'
    | '曜日'
    | '月'
    | '数字'
    | '天気'
    | '食べ物'
    | '好き嫌い'
    | '質問'
    | '応答'
    | '家族'
    | '動詞'
    | '買い物'
    | '感情表現'
    // 新規追加カテゴリ
    | '時間'
    | '場所'
    | '色'
    | '体'
    | '仕事'
    | '趣味'
    | '旅行'
    | '医療'
    | '緊急'
    | 'その他';

export const CATEGORY_GROUPS: { value: CategoryGroup; label: string; emoji: string; includeTags: string[] }[] = [
    { value: 'all', label: 'すべて', emoji: '📚', includeTags: [] },
    { value: '挨拶', label: '挨拶', emoji: '👋', includeTags: ['挨拶'] },
    { value: '自己紹介', label: '自己紹介', emoji: '🙋', includeTags: ['自己紹介'] },
    { value: '曜日', label: '曜日', emoji: '📆', includeTags: ['曜日'] },
    { value: '月', label: '月', emoji: '🗓️', includeTags: ['月'] },
    { value: '数字', label: '数字', emoji: '🔢', includeTags: ['数字'] },
    { value: '天気', label: '天気', emoji: '⛅', includeTags: ['天気'] },
    { value: '食べ物', label: '食べ物', emoji: '🍽️', includeTags: ['食べ物'] },
    { value: '好き嫌い', label: '好き嫌い', emoji: '❤️', includeTags: ['好き嫌い'] },
    { value: '質問', label: '質問', emoji: '❓', includeTags: ['質問'] },
    { value: '応答', label: '応答', emoji: '💬', includeTags: ['応答'] },
    { value: '家族', label: '家族', emoji: '👨‍👩‍👧', includeTags: ['家族'] },
    { value: '動詞', label: '動詞', emoji: '🏃', includeTags: ['動詞'] },
    { value: '買い物', label: '買い物', emoji: '🛒', includeTags: ['買い物'] },
    { value: '感情表現', label: '感情表現', emoji: '😤', includeTags: ['感情表現'] },
    // 新規追加カテゴリ
    { value: '時間', label: '時間', emoji: '⏰', includeTags: ['時間'] },
    { value: '場所', label: '場所', emoji: '📍', includeTags: ['場所'] },
    { value: '色', label: '色', emoji: '🎨', includeTags: ['色'] },
    { value: '体', label: '体の部位', emoji: '🫀', includeTags: ['体'] },
    { value: '仕事', label: '仕事', emoji: '💼', includeTags: ['仕事'] },
    { value: '趣味', label: '趣味', emoji: '🎮', includeTags: ['趣味'] },
    { value: '旅行', label: '旅行', emoji: '✈️', includeTags: ['旅行'] },
    { value: '医療', label: '医療', emoji: '🏥', includeTags: ['医療'] },
    { value: '緊急', label: '緊急', emoji: '🚨', includeTags: ['緊急'] },
    { value: 'その他', label: 'その他', emoji: '📎', includeTags: ['その他'] },
];

// 現在のデータで使用されているカテゴリのみ取得
export function getAvailableCategories(items: LearningItem[]): typeof CATEGORY_GROUPS {
    const usedTags = new Set(items.flatMap(item => item.tags || []));
    return CATEGORY_GROUPS.filter(cat =>
        cat.value === 'all' ||
        cat.includeTags.some(tag => usedTags.has(tag))
    );
}

// アイテムがカテゴリグループに含まれるか判定
export function itemMatchesCategoryGroup(item: LearningItem, group: CategoryGroup): boolean {
    if (group === 'all') return true;
    const groupDef = CATEGORY_GROUPS.find(g => g.value === group);
    if (!groupDef || groupDef.includeTags.length === 0) return true;
    return item.tags?.some(tag => groupDef.includeTags.includes(tag)) ?? false;
}

// ============================================
// Quiz Mode Types
// ============================================
export type QuizMode = 'choice' | 'truefalse' | 'fillin';

export const QUIZ_MODES: { value: QuizMode; label: string; emoji: string; description: string }[] = [
    { value: 'choice', label: '2択', emoji: '🎯', description: '日本語訳から正しい選択肢を選ぶ' },
    { value: 'truefalse', label: '正誤', emoji: '⭕', description: '表示された組み合わせが正しいか判断' },
    { value: 'fillin', label: '穴埋め', emoji: '✏️', description: '空欄に入る単語を選ぶ' },
];

// アイテムが特定のクイズモードで使用可能か判定
export function itemSupportsQuizMode(item: LearningItem, mode: QuizMode): boolean {
    const flags = item.quiz_flags ?? DEFAULT_QUIZ_FLAGS;
    return flags[mode] !== false;
}

// ============================================
// Session Settings
// ============================================
export interface SessionSettings {
    questionCount: number;      // 0 = unlimited
    currentQuestionIndex: number;
    isSessionActive: boolean;
    wrongOnlyMode: boolean;     // 間違い重点モード
    timerEnabled: boolean;      // タイマーモード
    timerSeconds: number;       // 各問題の秒数
    categoryGroup: CategoryGroup;
    quizMode: QuizMode;
}

export const PRESET_QUESTION_COUNTS = [5, 10, 15, 0] as const;
export const PRESET_TIMER_SECONDS = [3, 5, 10] as const;

// ============================================
// Quiz Question Types
// ============================================

export interface ChoiceQuestion {
    type: 'choice';
    prompt: string;
    optionA: LearningItem;
    optionB: LearningItem;
    correctAnswer: 'A' | 'B';
}

export interface TrueFalseQuestion {
    type: 'truefalse';
    item: LearningItem;
    statement: string;
    isTrue: boolean;
}

export interface FillInQuestion {
    type: 'fillin';
    item: LearningItem;
    maskedText: string;         // 空欄表示
    correctPart: string;        // 正解の部分
    wrongPart: string;          // 不正解の選択肢
    correctAnswer: 'A' | 'B';
}

export type Question = ChoiceQuestion | TrueFalseQuestion | FillInQuestion;

// ============================================
// Progress & History
// ============================================

export interface Progress {
    todayCount: number;
    correctCount: number;
    incorrectCount: number;
    lastStudyDate: string;
}

export interface ItemHistory {
    itemId: string;
    correctCount: number;
    incorrectCount: number;
    lastAnsweredAt: string;
}

// ============================================
// Quiz Settings
// ============================================
export type TTSEngineType = 'chrome' | 'web' | 'none';

export interface QuizSettings {
    timerSeconds: number;
    timerEnabled: boolean;
    audioEnabled: boolean;
    ttsEngine: TTSEngineType;
    ttsRate: number;
    ttsPitch: number;
    // v2.0 追加
    showAdvancedSettings: boolean;
    shareEnabled: boolean;
    // UI設定
    darkMode: 'light' | 'dark' | 'system';
    // 多言語対応
    currentLanguage: string; // 選択中の言語コード ('all' = すべて)
    // 開発者向け
    debugMode: boolean;
}

// ============================================
// Share Data (v2.0 外部共有機能)
// ============================================
export interface ShareData {
    date: string;
    totalCount: number;
    correctCount: number;
    accuracy: number;
    message?: string;
}
