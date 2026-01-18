# Creating Custom CSV Files for LinguaDock

This guide explains how to create your own vocabulary CSV files for LinguaDock.

---

## Quick Start

1. Create a CSV file with UTF-8 BOM encoding
2. Include the required columns (id, lang, text, reading_kana, meaning_ja)
3. Import via Settings → CSV Import

---

## CSV Format (v2.0)

### Required Columns

| Column | Description | Example |
|--------|-------------|---------|
| `id` | Unique sequential number | 1, 2, 3... |
| `lang` | Language code | pl, en, de, es, id, ko, zh |
| `text` | Target language text | Dzień dobry |
| `reading_kana` | Katakana pronunciation | ジェン・ドブリ |
| `meaning_ja` | Japanese translation | こんにちは |

### Optional Columns

| Column | Description | Example |
|--------|-------------|---------|
| `hint` | Usage hint or note | 朝〜昼の挨拶 |
| `tags` | Category tags (comma-separated) | 挨拶,基本 |
| `tts_text` | Text for TTS (if different from text) | |
| `tts_lang` | TTS language code | pl-PL, en-US |
| `example` | Example sentence | |
| `quiz_flags` | Quiz mode control (JSON) | {"choice": true} |
| `meta` | Extension metadata (JSON) | |

---

## Example CSV

```csv
id,lang,text,reading_kana,meaning_ja,hint,tags
1,es,¡Hola!,オラ,やあ！,カジュアル,挨拶
2,es,Buenos días,ブエノスディアス,おはようございます,午前中,挨拶
3,es,Gracias,グラシアス,ありがとう,感謝,挨拶
```

---

## Supported Language Codes

| Code | Language | TTS Code |
|------|----------|----------|
| `pl` | Polish | pl-PL |
| `en` | English | en-US |
| `de` | German | de-DE |
| `fr` | French | fr-FR |
| `es` | Spanish | es-ES |
| `it` | Italian | it-IT |
| `pt` | Portuguese | pt-PT |
| `id` | Indonesian | id-ID |
| `ko` | Korean | ko-KR |
| `zh` | Chinese | zh-CN |
| `ru` | Russian | ru-RU |
| `th` | Thai | th-TH |
| `vi` | Vietnamese | vi-VN |

---

## Using AI to Generate CSV

LinguaDock includes an AI Prompt Generator that creates prompts for ChatGPT, Claude, or Gemini.

1. Go to Settings → "🤖 AI CSV Generator"
2. Select the target language
3. Enter a topic (e.g., "restaurant", "travel")
4. Choose word count (5-50)
5. Click "Generate Prompt" → "Copy to Clipboard"
6. Paste into your favorite AI tool
7. Download the generated CSV and import

---

## Tips for Quality CSVs

1. **Use consistent reading styles** - Choose a katakana style and stick with it
2. **Add category tags** - Enables filtering in the app
3. **Include hints** - Helps learners understand context
4. **Test TTS** - Verify pronunciation sounds correct
5. **Keep each entry focused** - One concept per row

---

## Troubleshooting

### Import Errors

- **Encoding**: Save as UTF-8 with BOM
- **Columns**: Ensure all required columns exist
- **Quotes**: Wrap text containing commas in double quotes
- **Empty rows**: Remove any blank rows at the end

### TTS Not Working

- Check `lang` column has valid language code
- Try specifying `tts_lang` explicitly
- Switch TTS engine (Chrome TTS ↔ Web Speech API)
