# LinguaDock 🌐

Chrome サイドパネルで動作する多言語学習クイズアプリです。
日本人学習者向けに設計されています。

---

## 特徴

- **3種類のクイズモード**: 2択、正誤判定、穴埋め
- **多言語対応**: ポーランド語、英語、ドイツ語、フランス語、スペイン語、インドネシア語、韓国語、中国語
- **カテゴリフィルタ**: 挨拶、フレーズ、単語で絞り込み
- **音声読み上げ**: ネイティブ発音を確認（Chrome TTS / Web Speech API）
- **学習進捗管理**: 今日の成績、間違い重点モード
- **CSV インポート/エクスポート**: 独自の単語リストを追加
- **AIプロンプト生成**: お好みのAIツールで新しい単語CSVを作成
- **データセット管理**: ロック/アンロード/削除（ユーザーCSV）機能
- **データ保護**: インポート確認ダイアログと初期化保護機能

---

## インストール

### ソースからビルド

```bash
git clone https://github.com/tk2f/linguadock.git
cd linguadock
npm install
npm run build
```

1. Chrome → `chrome://extensions` を開く
2. 「デベロッパーモード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」→ `dist` フォルダを選択
4. 任意のページで右クリック → サイドパネルを開く

---

## 使い方

### クイズモード

| モード | 説明 |
|--------|------|
| 🎯 **2択** | 日本語訳に対応する単語を選択 |
| ⭕ **正誤** | 表示された組み合わせが正しいか判断 |
| ✏️ **穴埋め** | フレーズの空欄を埋める |

### データセット管理

| アイコン | 意味 |
|----------|------|
| ☑️ | ロード中（クイズに使用） |
| ☐ | アンロード（待機中） |
| 🔒 | ロック（削除・アンロード不可） |
| 🔓 | アンロック（操作可能） |
| 📦 | 同梱CSV（削除不可） |
| 🗑️ | 削除（ユーザーCSVのみ） |

### キーボードショートカット

| キー | 動作 |
|------|------|
| `1` / `A` / `←` | 選択肢A |
| `2` / `B` / `→` | 選択肢B |
| `O` | 正解（正誤モード） |
| `X` | 不正解（正誤モード） |
| `Enter` / `Space` | 次の問題 |

---

## 同梱データセット

| 言語 | ファイル | 語数 |
|------|----------|:----:|
| 🇵🇱 ポーランド語入門 | polish_sample.csv | 250 |
| 🇺🇸 英語入門 | english_sample.csv | 250 |
| 🇩🇪 ドイツ語入門 | german_sample.csv | 250 |
| 🇫🇷 フランス語入門 | french_sample.csv | 250 |
| 🇪🇸 スペイン語入門 | spanish_sample.csv | 250 |
| 🇮🇩 インドネシア語入門 | indonesian_sample.csv | 250 |
| 🇰🇷 韓国語入門 | korean_sample.csv | 250 |
| 🇨🇳 中国語入門 | chinese_sample.csv | 250 |

---

## CSV形式 (v2.0)

```csv
id,lang,text,reading_kana,meaning_ja,tts_text,tts_lang,hint,example,quiz_flags,tags,meta
1,pl,Dzień dobry,ジェン・ドブリ,こんにちは,,,朝〜昼の挨拶,,,挨拶,
```

| フィールド | 必須 | 説明 |
|-----------|:----:|------|
| id | ✓ | 連番 |
| lang | ✓ | 言語コード (pl, en, de等) |
| text | ✓ | 学習対象テキスト |
| reading_kana | ✓ | カタカナ読み |
| meaning_ja | ✓ | 日本語訳 |
| tts_text | | TTS用テキスト（省略可） |
| tts_lang | | TTS言語コード（省略可） |
| hint | | ヒント・補足 |
| example | | 例文 |
| quiz_flags | | クイズモード制御（JSON） |
| tags | | タグ（カンマ区切り） |
| meta | | 拡張メタデータ（JSON） |

> **注意**: 旧形式（v1.0: polish,kana,japanese,category）もインポート時に自動変換されます。

---

## AIでCSV生成（プロンプト生成機能）

**APIキー不要** - プロンプトをコピーしてAIに貼り付ける形式です。

1. 設定 → 「🤖 AI でCSV生成」を開く
2. 学習言語を選択（対応8言語）
3. トピック入力（例: レストラン、旅行）
4. 単語数選択（5〜50語）
5. 「プロンプト生成」→「クリップボードにコピー」
6. Claude / ChatGPT / Gemini に貼り付け
7. 生成されたCSVをダウンロード → インポート

---

## 使用している権限

| 権限 | 目的 |
|------|------|
| `storage` | 学習進捗と設定をローカルに保存 |
| `sidePanel` | Chromeサイドパネルに表示 |
| `tts` | 多言語の音声読み上げ |

**データは外部サーバーに送信されません。** すべてのデータはブラウザ内にローカル保存されます。

---

## ストレージ仕様

| ストレージ | 上限 | 用途 |
|-----------|------|------|
| `chrome.storage.sync` | 100KB | 進捗、設定、履歴 |
| `chrome.storage.local` | 5MB | データセット |

---

## 使用ライブラリ

| ライブラリ | ライセンス | 用途 |
|------------|-----------|------|
| [React](https://react.dev/) 19 | MIT | UIフレームワーク |
| [Zustand](https://github.com/pmndrs/zustand) 5 | MIT | 状態管理 |
| [Tailwind CSS](https://tailwindcss.com/) 4 | MIT | スタイリング |
| [Radix UI](https://www.radix-ui.com/) | MIT | UIコンポーネント |
| [shadcn/ui](https://ui.shadcn.com/) | MIT | コンポーネントライブラリ |
| [papaparse](https://www.papaparse.com/) | MIT | CSVパース |
| [Vite](https://vite.dev/) 7 | MIT | ビルドツール |
| [TypeScript](https://www.typescriptlang.org/) 5.8 | Apache-2.0 | 型システム |

---

## ドキュメント

| ファイル | 内容 |
|----------|------|
| [USER_GUIDE.md](USER_GUIDE.md) | 操作マニュアル |
| [TECHNICAL.md](TECHNICAL.md) | 技術仕様書 |
| [PRIVACY_POLICY.md](../PRIVACY_POLICY.md) | プライバシーポリシー |
| [DISCLAIMER.md](../DISCLAIMER.md) | 免責事項 |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | 貢献ガイドライン |

---

## ライセンス

MIT License - 詳細は [LICENSE](../LICENSE) をご覧ください。

---

## 開発について

このプロジェクトは、実験的なAIアシスト開発ツール Google Antigravity を使用して開発されました。
すべてのAI生成コードは、MITライセンスの下で公開されています。

---

## Support

LinguaDockが皆さまの語学学習のお役に立ちましたら、とても嬉しいです。

TK2LAB として、
学びを試し、楽しみ、その過程を共有する活動を続けています。
LinguaDockは、その取り組みから生まれたプロジェクトの一つです。

もしご共感いただけましたら、
[GitHub Sponsors](https://github.com/sponsors/tk2f) を通じて応援していただけると励みになります。

どうぞよろしくお願いします。

