# Privacy Policy / プライバシーポリシー

**Last Updated: 2026-01-18**

## English

### Data Collection

LinguaDock does **NOT** collect, transmit, or share any personal data. All user data is stored locally in your browser using Chrome's built-in storage APIs.

### Data Stored Locally

The following data is stored locally on your device:

| Data Type | Storage Method | Purpose |
|-----------|----------------|---------|
| Learning progress | chrome.storage.sync | Track daily statistics |
| Quiz history | chrome.storage.sync | Enable weak-point review mode |
| User settings | chrome.storage.sync | Remember preferences |
| Vocabulary datasets | chrome.storage.local | Store imported CSV data |

### Network Communications

This extension makes **NO** external network requests. All functionality operates entirely offline within your browser.

### Third-Party Services

- **Text-to-Speech**: Uses Chrome's built-in TTS API and Web Speech API. Audio is synthesized locally; no text is sent to external servers.
- **AI Prompt Generator**: Only generates text for you to copy. Does NOT connect to any AI services.

### Data Sharing

Your data is **NEVER**:
- Sent to external servers
- Shared with third parties
- Used for advertising
- Sold or monetized

### Data Deletion

To delete all stored data:
1. Open the extension settings
2. Click "すべてのデータを初期化" (Reset all data)

Or remove the extension from Chrome to delete all associated data.

### Permissions Explained

| Permission | Why We Need It |
|------------|----------------|
| `storage` | Save your progress and settings locally |
| `sidePanel` | Display the learning interface in Chrome's side panel |
| `tts` | Pronounce vocabulary using text-to-speech |

### Contact

For privacy-related questions, please open an issue on our GitHub repository.

---

## 日本語

### データ収集について

LinguaDock は個人データの収集、送信、共有を**一切行いません**。すべてのユーザーデータは Chrome の組み込みストレージ API を使用してブラウザ内にローカル保存されます。

### ローカルに保存されるデータ

以下のデータがデバイス上にローカル保存されます：

| データ種別 | 保存方法 | 目的 |
|-----------|---------|------|
| 学習進捗 | chrome.storage.sync | 日次統計の追跡 |
| クイズ履歴 | chrome.storage.sync | 苦手モードの有効化 |
| ユーザー設定 | chrome.storage.sync | 設定の記憶 |
| 語彙データセット | chrome.storage.local | インポートしたCSVデータの保存 |

### ネットワーク通信

この拡張機能は外部へのネットワークリクエストを**一切行いません**。すべての機能はブラウザ内で完全にオフラインで動作します。

### サードパーティサービス

- **音声合成**: Chrome 組み込みの TTS API と Web Speech API を使用。音声はローカルで合成され、テキストは外部サーバーに送信されません。
- **AI プロンプト生成**: コピー用のテキストを生成するだけです。AI サービスには接続しません。

### データ共有

あなたのデータは**決して**：
- 外部サーバーに送信されません
- 第三者と共有されません
- 広告に使用されません
- 販売・収益化されません

### データの削除

保存されたすべてのデータを削除するには：
1. 拡張機能の設定を開く
2. 「すべてのデータを初期化」をクリック

または、Chrome から拡張機能を削除すると、関連するすべてのデータが削除されます。

### 権限の説明

| 権限 | 必要な理由 |
|------|-----------|
| `storage` | 進捗と設定をローカルに保存 |
| `sidePanel` | Chrome のサイドパネルに学習画面を表示 |
| `tts` | 音声合成で語彙を発音 |

### お問い合わせ

プライバシーに関するご質問は、GitHub リポジトリで Issue を作成してください。
