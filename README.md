# Dark Reverse Thread (v1.0.0)

Web版Gmailのスレッド画面・メール本文・作成ウィンドウを、元の色味を保ったままダークモードで表示し、スレッドを新しい順に並べ替える Chrome 拡張機能（Manifest V3）です。
A lightweight Chrome extension (Manifest V3) for Gmail: a dark mode for threads, email bodies and the compose window that keeps original colors, plus newest-first conversation threads.

※ 本拡張機能は Google とは関係のない個人開発のものです。Gmail は Google LLC の商標です。
*This extension is an independent project, not affiliated with or endorsed by Google. Gmail is a trademark of Google LLC.*

---

## 主な機能 / Key Features

1. **スレッド表示順の反転 / Thread Chronological Reversal**
   - 日本語: 最新のメッセージがスレッド最上部に並ぶように自動で並び替え、スレッドを開くと最新メッセージの位置（先頭）を表示します。
   - English: Reverses conversation threads so the newest messages appear at the very top, and opens each thread scrolled to the newest message.
2. **マテリアルダークモード / Material Dark Theme**
   - 日本語: Gmail のダークテーマに馴染むマテリアルダーク調（#1f1f1f / #28292c / #303134）に統一し、目に優しく洗練された表示を提供。新規作成ウィンドウ（右下・全画面）、スレッドとツールバーから開くメニュー、作成ボタンも暗く表示します。受信トレイの一覧・サイドバー・ヘッダーはそれ以外は干渉せず、Gmail本体のテーマ設定をそのまま使います。
   - English: Uses a Material Dark palette that matches Gmail's own dark theme (#1f1f1f / #28292c / #303134) for an eye-friendly, native feel. Applied to the conversation view, the compose window (docked or full screen), menus opened from the thread or toolbar, and the Compose button — the rest of the inbox list, sidebar and header is left to Gmail's own theme.
3. **本文白飛びの根本解消 / Direct Email Body Darkening**
   - 日本語: HTMLメールの文字色・背景色を、色相と彩度を保ったまま明るさだけ暗い背景向けに調整（黒文字→明るい灰色、白背景→暗色、赤字や黄色のハイライトは色味を残す）。画像やロゴは本来の色を保護し、透過画像（黒いロゴなど）の背後には元のメールでの背景色を敷いて見えるように（白い背景は目に優しい明るい灰色にし、ロゴくらいの小さな画像は角の丸いカード風に表示）。印刷時は元の色で出力。
   - English: Adapts HTML email text and background colors for dark mode by remapping only their lightness, keeping the original hue and saturation (black text becomes light gray, white backgrounds turn dark, red text and highlights keep their color). Images keep their colors, transparent ones (e.g. dark logos) get their original backdrop back so they stay visible (a white backdrop is softened to light grey, and logo-sized images are shown as small rounded cards), and printing uses the original colors.
4. **星アイコン・マーク・ラベルの視認性と操作性 / High-Contrast & Interactive UI**
   - 日本語: 星アイコンの完全なクリック・選択操作性、タイトル横マークのGoogleブルー復元、「受信トレイ」ラベル文字のくっきり表示を実現。
   - English: Fully interactive star toggling, restored Google Blue title-adjacent indicators, and crisp, legible label pill text.
5. **返信欄の位置制御 / Flexible Reply Box Position**
   - 日本語: 新しい順の表示で、返信・転送・リアクションのボタンと返信の入力欄を、最新メールの直下（標準）または直上に表示。
   - English: Show the Reply / Forward / reaction buttons and the reply composer directly below or above the newest email (in newest-first order).
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
- `styles.css`: スレッド反転レイアウト、マテリアルダークCSS、印刷用スタイル / Stylesheet for layout, dark theme, and @media print
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

## インストール / Install

- 日本語: Chrome ウェブストアで公開予定です（現在審査中）。公開後、ここにリンクを掲載します。
- English: Coming soon to the Chrome Web Store (currently in review). The link will be added here once published.

## Chromeウェブストア公開ガイド / Chrome Web Store Publishing Guide

### 1. デベロッパー登録 / Developer Registration
- 日本語: [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/) にアクセスし、初回登録料（$5 USD、1回のみ）を支払います。
- English: Visit the Developer Dashboard and pay the one-time $5 USD registration fee.

### 2. ZIPアーカイブの作成 / Prepare ZIP Archive
- 日本語: `_locales` フォルダを含む全ファイルをZIP形式で圧縮します（`.git` は含めない）。例: `git archive --format=zip -o dark-reverse-thread.zip HEAD`
- English: Zip all files including the `_locales` folder (exclude `.git`), e.g. `git archive --format=zip -o dark-reverse-thread.zip HEAD`.

### 3. ストア掲載情報と審査要件 / Store Listing & Review Requirements
- **掲載用の文面と画像 / Listing text & images**: [`store/listing.md`](store/listing.md)、`store/screenshots/{ja,en}/`（`git archive` の ZIP には含まれません / excluded from the `git archive` ZIP）
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

## 応援 / Support

気に入っていただけたら、コーヒー1杯分の応援をいただけると励みになります。
If you like it, you can buy me a coffee: https://buymeacoffee.com/mukumukusan
