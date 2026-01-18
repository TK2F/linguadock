import Papa from 'papaparse';
import type { LearningItem, LearningItemV1, QuizFlags, ItemMeta } from '@/types/learning';
import { migrateV1toV2, DEFAULT_QUIZ_FLAGS } from '@/types/learning';
import { debugLog } from '@/lib/debug';
// CSV Version Detection
// ============================================

type CSVVersion = 'v1' | 'v2' | 'unknown';

function detectCSVVersion(headers: string[]): CSVVersion {
    // v2.0: has 'text' and 'lang' columns
    if (headers.includes('text') && headers.includes('lang')) {
        return 'v2';
    }
    // v1.0: has 'polish' column
    if (headers.includes('polish')) {
        return 'v1';
    }
    return 'unknown';
}

// ============================================
// Parse JSON fields safely
// ============================================

function parseJSONField<T>(value: string | undefined, fallback: T): T {
    if (!value || value.trim() === '') return fallback;
    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}

function parseTagsField(value: string | undefined): string[] | undefined {
    if (!value || value.trim() === '') return undefined;
    // Support both JSON array and comma-separated
    if (value.startsWith('[')) {
        try {
            return JSON.parse(value) as string[];
        } catch {
            return undefined;
        }
    }
    return value.split(',').map(t => t.trim()).filter(t => t);
}

// ============================================
// Parse CSV v2.0
// ============================================

function parseCSVv2(data: Record<string, string>[]): LearningItem[] {
    return data.map((row, index) => ({
        id: row.id || String(index + 1),
        lang: row.lang || 'pl',
        text: row.text || '',
        reading_kana: row.reading_kana || '',
        meaning_ja: row.meaning_ja || '',
        tts_text: row.tts_text || undefined,
        tts_lang: row.tts_lang || undefined,
        hint: row.hint || undefined,
        example: row.example || undefined,
        quiz_flags: parseJSONField<QuizFlags>(row.quiz_flags, DEFAULT_QUIZ_FLAGS),
        tags: parseTagsField(row.tags),
        meta: row.meta ? parseJSONField<ItemMeta>(row.meta, {}) : undefined,
    })).filter(item => item.text && item.meaning_ja);
}

// ============================================
// Parse CSV v1.0 (legacy)
// ============================================

function parseCSVv1(data: Record<string, string>[]): LearningItem[] {
    const v1Items: LearningItemV1[] = data.map((row, index) => ({
        id: row.id || String(index + 1),
        polish: row.polish || '',
        kana: row.kana || '',
        japanese: row.japanese || '',
        category: row.category || 'フレーズ',
        subcategory: row.subcategory || undefined,
        level: row.level ? parseInt(row.level, 10) : undefined,
        note: row.note || undefined,
        example: row.example || undefined,
        exampleKana: row.exampleKana || undefined,
        exampleJp: row.exampleJp || undefined,
    })).filter(item => item.polish && item.japanese);

    // Convert v1 to v2
    return v1Items.map(migrateV1toV2);
}

// ============================================
// Main Parse Function
// ============================================

export function parseCSV(csvString: string): LearningItem[] {
    try {
        const result = Papa.parse<Record<string, string>>(csvString, {
            header: true,
            skipEmptyLines: true,
        });

        if (result.errors.length > 0) {
            console.warn('[CSV] Parse warnings:', result.errors);
        }

        const headers = result.meta.fields || [];
        const version = detectCSVVersion(headers);

        debugLog('CSV', `Detected version: ${version}, headers:`, headers);

        switch (version) {
            case 'v2':
                return parseCSVv2(result.data);
            case 'v1':
                debugLog('CSV', 'Migrating v1 data to v2 format');
                return parseCSVv1(result.data);
            default:
                console.warn('[CSV] Unknown format, attempting v1 parse');
                return parseCSVv1(result.data);
        }
    } catch (error) {
        console.error('[CSV] Parse error:', error);
        return [];
    }
}

// ============================================
// Export to CSV v2.0
// ============================================

export function toCSV(items: LearningItem[]): string {
    const exportData = items.map(item => ({
        id: item.id,
        lang: item.lang,
        text: item.text,
        reading_kana: item.reading_kana,
        meaning_ja: item.meaning_ja,
        tts_text: item.tts_text || '',
        tts_lang: item.tts_lang || '',
        hint: item.hint || '',
        example: item.example || '',
        quiz_flags: item.quiz_flags ? JSON.stringify(item.quiz_flags) : '',
        tags: item.tags ? item.tags.join(',') : '',
        meta: item.meta ? JSON.stringify(item.meta) : '',
    }));

    return Papa.unparse(exportData, {
        header: true,
        columns: ['id', 'lang', 'text', 'reading_kana', 'meaning_ja',
            'tts_text', 'tts_lang', 'hint', 'example',
            'quiz_flags', 'tags', 'meta'],
    });
}

// ============================================
// Export to CSV v1.0 (legacy compatibility)
// ============================================

export function toCSVv1(items: LearningItem[]): string {
    const exportData = items.map(item => ({
        id: item.id,
        polish: item.text,
        kana: item.reading_kana,
        japanese: item.meaning_ja,
        category: item.tags?.[0] || 'フレーズ',
        subcategory: item.tags?.[1] || '',
        level: (item.meta as { level?: number })?.level || '',
        note: item.hint || '',
    }));

    return Papa.unparse(exportData, {
        header: true,
        columns: ['id', 'polish', 'kana', 'japanese', 'category', 'subcategory', 'level', 'note'],
    });
}

// ============================================
// File Export Utilities
// ============================================

export function exportCSVWithBOM(items: LearningItem[], version: 'v1' | 'v2' = 'v2'): Blob {
    const csvString = version === 'v1' ? toCSVv1(items) : toCSV(items);
    const bom = '\uFEFF';
    return new Blob([bom + csvString], { type: 'text/csv;charset=utf-8' });
}

export function downloadCSV(
    items: LearningItem[],
    filename: string = 'polish-bridge-data.csv',
    version: 'v1' | 'v2' = 'v2'
): void {
    const blob = exportCSVWithBOM(items, version);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ============================================
// AI Prompt Generator (v2.0 format)
// ============================================

export interface AIPromptOptions {
    topic: string;
    wordCount: number;
    langCode: string;
    langName: string;
    category?: string;
}

export function generateAIPrompt(options: AIPromptOptions): string {
    const { topic, wordCount, langCode, langName, category } = options;

    const categoryHint = category && category !== 'all'
        ? `\nカテゴリ: ${category}（tags列に「${category}」を含めてください）`
        : '';

    return `${langName}学習用のCSVデータを作成してください。

テーマ: ${topic}
単語/フレーズ数: ${wordCount}${categoryHint}

【CSVフォーマット (v2.0)】
id,lang,text,reading_kana,meaning_ja,hint,tags

【カラム説明】
- id: 連番（1から開始）
- lang: 言語コード「${langCode}」← 必ずこの値を使用
- text: ${langName}テキスト
- reading_kana: カタカナ読み（日本人学習者向け発音表記）
- meaning_ja: 日本語訳
- hint: ヒント・補足説明（任意）
- tags: カテゴリタグ（挨拶,曜日,数字 など）

【出力例】
1,${langCode},Hello,ハロー,こんにちは,カジュアルな挨拶,挨拶
2,${langCode},Good morning,グッドモーニング,おはようございます,午前中の挨拶,挨拶

【重要な注意事項】
⚠️ lang列は必ず「${langCode}」を指定（言語判定に使用）
⚠️ reading_kanaは日本人が読める発音表記に
⚠️ tags列でカテゴリを指定（フィルタ機能で使用）
⚠️ CSVヘッダー行を必ず含める
⚠️ カンマを含むテキストは""で囲む

実用的で日常会話に役立つ表現を優先してください。`;
}

// CSV構造説明（ポップアップ用）
export const CSV_STRUCTURE_GUIDE = `
【必須カラム】
• id - 連番（重複不可）
• lang - 言語コード（en, es, id など）
• text - 学習対象テキスト
• reading_kana - カタカナ読み
• meaning_ja - 日本語訳

【推奨カラム】
• tags - カテゴリタグ（挨拶, 曜日 など）
• hint - 補足説明・ヒント

【オプション】
• tts_text - TTS読み上げ用テキスト
• tts_lang - TTS言語コード（en-US など）
• example - 例文
• quiz_flags - クイズモード制御（JSON）
• meta - 拡張用メタデータ（JSON）

【重要な注意事項】
⚠️ lang列は必須です。未指定の場合、言語判定やフィルタが正しく動作しません。
⚠️ tags列で指定したカテゴリのみがフィルタで表示されます。
⚠️ UTF-8 BOM形式で保存してください（Excel対応・文字化け防止）。
⚠️ 対応していない言語の場合は、対応言語のCSVを参考に作成してください。
`.trim();
