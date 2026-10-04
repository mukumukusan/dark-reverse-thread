# Gmail Thread Reverser & Dark Mode (v1.6.7)

Web版Gmailのスレッドを最新順に反転表示し、スレッド画面とメール本文を公式Google風マテリアルダークモードに対応させるChrome拡張機能（Manifest V3対応）です。
A lightweight Chrome extension (Manifest V3) that reverses Gmail conversation threads (newest emails first) and provides a polished Google Material Dark mode for threads, email bodies, AI summaries, and print workflows.

---

## 主な機能 / Key Features

1. **スレッド表示順の反転 / Thread Chronological Reversal**
   - 日本語: 最新のメッセージがスレッド最上部に並ぶように自動で並び替え、スレッドを開くと最新メッセージの位置（先頭）を表示します。
   - English: Reverses conversation threads so the newest messages appear at the very top, and opens each thread scrolled to the newest message.
2. **公式Google風マテリアルダークモード / Official Material Dark Theme**
   - 日本語: Google公式Gmailの上品なマテリアルダーク調（#1f1f1f / #28292c / #303134）に統一し、目に優しく洗練された表示を提供。受信トレイ・サイドバー・ヘッダーには干渉せず、Gmail本体のテーマ設定をそのまま使います。
   - English: Unified with Google's official Material Dark palette (#1f1f1f / #28292c / #303134) for an eye-friendly, native feel. Applied to the conversation view only — the inbox list, sidebar and header are left to Gmail's own theme.
3. **本文白飛びの根本解消 / Direct Email Body Darkening**
   - 日本語: HTMLメールの文字色・背景色を、色相と彩度を保ったまま明るさだけ暗い背景向けに調整（黒文字→明るい灰色、白背景→暗色、赤字や黄色のハイライトは色味を残す）。画像やロゴは本来の色を保護し、透過画像（黒いロゴなど）の背後には元のメールでの背景色を敷いて見えるように。印刷時は元の色で出力。
   - English: Adapts HTML email text and background colors for dark mode by remapping only their lightness, keeping the original hue and saturation (black text becomes light gray, white backgrounds turn dark, red text and highlights keep their color). Images keep their colors, transparent ones (e.g. dark logos) get their original backdrop back so they stay visible, and printing uses the original colors.
4. **星アイコン・マーク・ラベルの視認性と操作性 / High-Contrast & Interactive UI**
   - 日本語: 星アイコンの完全なクリック・選択操作性、タイトル横マークのGoogleブルー復元、「受信トレイ」ラベル文字のくっきり表示を実現。
   - English: Fully interactive star toggling, restored Google Blue title-adjacent indicators, and crisp, legible label pill text.
5. **返信欄の位置制御 / Flexible Reply Box Position**
   - 日本語: 返信・転送・リアクションのボタンと返信の入力欄を、最新メールの「下」（Gmail標準）または「上」に表示。
   - English: Show the Reply / Forward / reaction buttons and the reply composer either below (Gmail default) or above the newest email.
6. **印刷・PDF出力の最適化 (@media print) / Print Optimization**
   - 日本語: 印刷・PDF保存時は自動で白背景・黒文字（インク節約仕様）・正順表示に戻ります。
   - English: Automatically reverts to a white background with sharp black text and natural chronological order when printing or exporting to PDF.
7. **クイック操作バー / Floating Quick Toggle Bar**
   - 日本語: 画面右下にコンパクトな切り替えバーを表示。
   - English: Features a sleek, floating quick bar in the bottom-right corner for instant toggles.
8. **多言語対応 / Internationalization**
   - 日本語: 拡張機能名・説明・ポップアップ・クイックバーはブラウザの言語に合わせて表示（現在は英語・日本語。その他の言語は英語）。
   - English: Extension name, description, popup and quick bar follow the browser language (English and Japanese included; other languages fall back to English).

---

## 構成ファイル一覧 / Included Files

- `manifest.json`: 拡張機能定義ファイル / Extension manifest (Manifest V3)
- `settings.js`: 設定の初期値（content.js と popup.js で共有） / Default settings shared by the content script and popup
- `content.js`: スレッド並び替え・DOMスタイル制御・入力時軽量化スクリプト / Core script with keystroke filtering
- `styles.css`: スレッド反転レイアウト、公式マテリアルダークCSS、印刷用スタイル / Stylesheet for layout, dark theme, and @media print
- `popup.html` & `popup.js` & `popup.css`: ツールバー設定ポップアップ / Extension popup settings UI
- `_locales/<lang>/messages.json`: 表示文字列（英語 `en` が既定） / UI strings per language (`en` is the default)
- `icons/`: アイコンアセット (16x16, 48x48, 128x128 PNG) / App icons

---

## 言語の追加 / Adding a language

### 拡張機能の表示文字列 / Extension UI strings
- 日本語: `_locales/en/messages.json` を `_locales/<言語コード>/messages.json`（例: `fr`, `zh_CN`）にコピーし、各 `message` を翻訳します。`description` は翻訳者向けの説明で、翻訳は不要です。ストアの制限により `extName` は75文字、`extDescription` は132文字以内にしてください。
- English: Copy `_locales/en/messages.json` to `_locales/<locale>/messages.json` (e.g. `fr`, `zh_CN`) and translate each `message`. The `description` fields are notes for translators. Keep `extName` within 75 and `extDescription` within 132 characters (Web Store limits).

### Gmailの表示言語への対応 / Gmail display language
- 日本語: Gmail画面上の要素はすべてクラス名や構造で判定しており、Gmail画面の文言には依存しません。Gmailをどの言語で表示していても、追加作業なしで動作します。
- English: Gmail elements are matched by class names and structure only, never by on-screen text, so the extension works with any Gmail display language without extra work.

---

## パッケージ化されていない拡張機能としての導入手順 / How to Load Unpacked Extension

### 日本語
1. 本フォルダ（`extension`）をローカルPCの安全な場所（「ドキュメント」フォルダ等）に保存します。
2. Google Chromeのアドレスバーに `chrome://extensions` と入力して開きます。
3. 画面右上の **「デベロッパー モード」** をONにします。
4. 左上の **「パッケージ化されていない拡張機能を読み込む」** をクリックし、本フォルダを選択します。
5. Gmail（`https://mail.google.com/`）を開き、再読み込みします。

### English
1. Save this `extension` folder to a safe local directory (e.g. Documents).
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable **"Developer mode"** in the top-right corner.
4. Click **"Load unpacked"** in the top-left corner and select this folder.
5. Open or refresh Gmail (`https://mail.google.com/`).

---

## Chromeウェブストア公開ガイド / Chrome Web Store Publishing Guide

### 1. デベロッパー登録 / Developer Registration
- 日本語: [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/) にアクセスし、初回登録料（$5 USD、1回のみ）を支払います。
- English: Visit the Developer Dashboard and pay the one-time $5 USD registration fee.

### 2. ZIPアーカイブの作成 / Prepare ZIP Archive
- 日本語: `_locales` フォルダを含む全ファイルをZIP形式で圧縮します（`.git` は含めない）。例: `git archive --format=zip -o gmail-thread-reverser.zip HEAD`
- English: Zip all files including the `_locales` folder (exclude `.git`), e.g. `git archive --format=zip -o gmail-thread-reverser.zip HEAD`.

### 3. ストア掲載情報と審査要件 / Store Listing & Review Requirements
- **アイコン / Icons**: `icons/icon128.png` (128x128px)
- **スクリーンショット / Screenshots**: 1280x800 または 640x400 ピクセル（Gmail上でスレッド反転やダークモードが動作している画面キャプチャを最低1枚）
- **プライバシーポリシー / Privacy Policy**:
  - 日本語: [`PRIVACY.md`](PRIVACY.md) を公開URLに置き、そのURLをダッシュボードに登録します。データは収集・送信せず、表示設定だけを `chrome.storage.sync` に保存することを記載しています。
  - English: Publish [`PRIVACY.md`](PRIVACY.md) at a public URL and enter that URL in the dashboard. It states that no data is collected or sent, and that only display settings are saved in `chrome.storage.sync`.

### 4. 提出と公開 / Submission
- 日本語: ダッシュボードで「新しいアイテム」を作成してZIPをアップロードし、説明文とスクリーンショットを登録して「審査のために送信」をクリックします（通常1〜3営業日で審査完了）。
- English: Upload the ZIP file in the dashboard, complete the store listing details, and click "Submit for review" (typically approved within 1–3 business days).

## ライセンス / License

MIT License — [`LICENSE`](LICENSE)
