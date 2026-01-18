// ============================================
// 同梱データセット定義
// ============================================

export interface BuiltInDataSetMeta {
    id: string;
    name: string;
    langCode: string;
    fileName: string;
    emoji: string;
    defaultLoaded: boolean;  // 初回起動時にロード
}

export const BUILT_IN_DATASETS: BuiltInDataSetMeta[] = [
    {
        id: 'builtin-pl',
        name: 'ポーランド語入門',
        langCode: 'pl',
        fileName: 'polish_sample',
        emoji: '🇵🇱',
        defaultLoaded: true
    },
    {
        id: 'builtin-en',
        name: '英語入門',
        langCode: 'en',
        fileName: 'english_sample',
        emoji: '🇬🇧',
        defaultLoaded: true
    },
    {
        id: 'builtin-de',
        name: 'ドイツ語入門',
        langCode: 'de',
        fileName: 'german_sample',
        emoji: '🇩🇪',
        defaultLoaded: false
    },
    {
        id: 'builtin-fr',
        name: 'フランス語入門',
        langCode: 'fr',
        fileName: 'french_sample',
        emoji: '🇫🇷',
        defaultLoaded: false
    },
    {
        id: 'builtin-es',
        name: 'スペイン語入門',
        langCode: 'es',
        fileName: 'spanish_sample',
        emoji: '🇪🇸',
        defaultLoaded: false
    },
    {
        id: 'builtin-id',
        name: 'インドネシア語入門',
        langCode: 'id',
        fileName: 'indonesian_sample',
        emoji: '🇮🇩',
        defaultLoaded: false
    },
    {
        id: 'builtin-ko',
        name: '韓国語入門',
        langCode: 'ko',
        fileName: 'korean_sample',
        emoji: '🇰🇷',
        defaultLoaded: false
    },
    {
        id: 'builtin-zh',
        name: '中国語入門',
        langCode: 'zh',
        fileName: 'chinese_sample',
        emoji: '🇨🇳',
        defaultLoaded: false
    },
];

// 同梱CSVのIDかどうか
export function isBuiltInDataSetId(id: string): boolean {
    return BUILT_IN_DATASETS.some(ds => ds.id === id);
}

// IDからメタデータを取得
export function getBuiltInDataSetMeta(id: string): BuiltInDataSetMeta | undefined {
    return BUILT_IN_DATASETS.find(ds => ds.id === id);
}
