# LinguaDock 🌐

A Chrome Extension for multi-language learning, designed for Japanese learners.
Runs in Chrome's side panel for seamless integration with your browsing experience.

**[日本語ドキュメントはこちら](docs/README_JA.md)**

---

## Features

- **Multiple Quiz Modes**: 2-choice, True/False, and Fill-in-the-blank
- **8 Languages Supported**: Polish, English, German, French, Spanish, Indonesian, Korean, Chinese
- **Category Filtering**: Focus on greetings, phrases, or vocabulary
- **Text-to-Speech**: Hear authentic pronunciation (Chrome TTS / Web Speech API)
- **Progress Tracking**: Daily stats and weak-point review mode
- **CSV Import/Export**: Add your own vocabulary lists
- **AI Prompt Generator**: Create new vocabulary CSVs with your favorite AI tool
- **Dataset Management**: Lock/Unlock/Load/Unload individual datasets
- **Data Safety**: Import confirmation dialogs and data reset protection

---

## Installation

### From Source

```bash
git clone https://github.com/tk2f/linguadock.git
cd linguadock
npm install
npm run build
```

1. Open Chrome → `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → Select the `dist` folder
4. Right-click on any page → Open side panel

---

## Bundled Datasets

| Language | File | Words |
|----------|------|:-----:|
| 🇵🇱 Polish Intro | polish_sample.csv | 250 |
| 🇬🇧 English Intro | english_sample.csv | 250 |
| 🇩🇪 German Intro | german_sample.csv | 250 |
| 🇫🇷 French Intro | french_sample.csv | 250 |
| 🇪🇸 Spanish Intro | spanish_sample.csv | 250 |
| 🇮🇩 Indonesian Intro | indonesian_sample.csv | 250 |
| 🇰🇷 Korean Intro | korean_sample.csv | 250 |
| 🇨🇳 Chinese Intro | chinese_sample.csv | 250 |

---

## Usage

### Quiz Modes

| Mode | Description |
|------|-------------|
| 🎯 **2-Choice** | Select the correct word for a Japanese meaning |
| ⭕ **True/False** | Judge if the displayed pair is correct |
| ✏️ **Fill-in** | Complete the blank in a phrase |

### Dataset Management

| Icon | Meaning |
|------|---------|
| ☑️ | Loaded (active) |
| ☐ | Unloaded (standby) |
| 🔒 | Locked (cannot delete/unload) |
| 🔓 | Unlocked |
| 📦 | Built-in CSV |
| 🗑️ | Delete (user CSV only) |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` / `A` / `←` | Select option A |
| `2` / `B` / `→` | Select option B |
| `O` | True (True/False mode) |
| `X` | False (True/False mode) |
| `Enter` / `Space` | Next question |

---

## CSV Format (v2.0)

```csv
id,lang,text,reading_kana,meaning_ja,tts_text,tts_lang,hint,example,quiz_flags,tags,meta
1,pl,Dzień dobry,ジェン・ドブリ,こんにちは,,,朝〜昼の挨拶,,,挨拶,
```

| Field | Required | Description |
|-------|:--------:|-------------|
| id | ✓ | Sequential number |
| lang | ✓ | Language code (pl, en, de, etc.) |
| text | ✓ | Target language text |
| reading_kana | ✓ | Katakana pronunciation |
| meaning_ja | ✓ | Japanese translation |
| tts_text | | Text for TTS (defaults to `text`) |
| tts_lang | | TTS language code (e.g., pl-PL) |
| hint | | Hint or note |
| example | | Example sentence |
| quiz_flags | | JSON for quiz mode control |
| tags | | Comma-separated tags |
| meta | | Extension metadata (JSON) |

> **Note**: Legacy v1.0 format (`polish,kana,japanese,category`) is auto-converted on import.

---

## Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 19 | UI Framework |
| Zustand | 5 | State Management |
| Tailwind CSS | 4 | Styling |
| Radix UI | - | UI Components |
| shadcn/ui | - | Component Library |
| papaparse | - | CSV Parsing |
| Vite | 7 | Build Tool |
| TypeScript | 5.8 | Type System |

---

## Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Save progress and settings locally |
| `sidePanel` | Display in Chrome's side panel |
| `tts` | Text-to-Speech for pronunciation |

**No data is sent to external servers.** All data is stored locally in your browser.

---

## Storage

| Storage | Limit | Usage |
|---------|-------|-------|
| `chrome.storage.sync` | 100KB | Progress, settings, history |
| `chrome.storage.local` | 5MB | Datasets |

---

## Documentation

| File | Content |
|------|---------|
| [USER_GUIDE.md](docs/USER_GUIDE.md) | User Manual |
| [TECHNICAL.md](docs/TECHNICAL.md) | Technical Specification |
| [PRIVACY_POLICY.md](PRIVACY_POLICY.md) | Privacy Policy |
| [DISCLAIMER.md](DISCLAIMER.md) | Disclaimer |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution Guide |

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

This project was developed using Google Antigravity, an experimental AI-assisted coding tool.
All AI-generated code is released under the MIT License.

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
