# Gmail Thread Reverser & Dark Mode (v1.4.4)

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
   - 日本語: HTMLメールの文字色・背景色を、色相と彩度を保ったまま明るさだけ暗い背景向けに調整（黒文字→明るい灰色、白背景→暗色、赤字や黄色のハイライトは色味を残す）。画像やロゴは本来の色を保護し、印刷時は元の色で出力。
   - English: Adapts HTML email text and background colors for dark mode by remapping only their lightness, keeping the original hue and saturation (black text becomes light gray, white backgrounds turn dark, red text and highlights keep their color). Images and media are untouched, and printing uses the original colors.
4. **星アイコン・マーク・ラベルの視認性と操作性 / High-Contrast & Interactive UI**
   - 日本語: 星アイコンの完全なクリック・選択操作性、タイトル横マークのGoogleブルー復元、「受信トレイ」ラベル文字のくっきり表示を実現。
   - English: Fully interactive star toggling, restored Google Blue title-adjacent indicators, and crisp, legible label pill text.
5. **返信欄の位置制御 / Flexible Reply Box Position**
   - 日本語: 返信ボックスを「最下部」または「最上部（最新メールの上）」に配置可能。
   - English: Place the reply/forward composer either at the bottom or top of the conversation thread.
6. **印刷・PDF出力の最適化 (@media print) / Print Optimization**
   - 日本語: 印刷・PDF保存時は自動で白背景・黒文字（インク節約仕様）・正順表示に戻ります。
   - English: Automatically reverts to a white background with sharp black text and natural chronological order when printing or exporting to PDF.
7. **世界共通の英語クイック操作バー / International Quick Toggle Bar**
   - 日本語: 画面右下に世界中のユーザーが直感的に操作できるコンパクトな英語クイックバーを表示。
   - English: Features a sleek, floating quick bar in the bottom-right corner for instant toggles.

---

## 構成ファイル一覧 / Included Files

- `manifest.json`: 拡張機能定義ファイル / Extension manifest (Manifest V3, v1.4.4)
- `content.js`: スレッド並び替え・DOMスタイル制御・入力時軽量化スクリプト / Core script with keystroke filtering
- `styles.css`: スレッド反転レイアウト、公式マテリアルダークCSS、印刷用スタイル / Stylesheet for layout, dark theme, and @media print
- `popup.html` & `popup.js` & `popup.css`: ツールバー設定ポップアップ（英語UI） / Extension popup settings UI (Global edition)
- `icons/`: アイコンアセット (16x16, 48x48, 128x128 PNG) / App icons

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
- 日本語: `extension` フォルダ内の全ファイルを選択し、ZIP形式で圧縮します（例: `gmail-thread-reverser-latest.zip`）。
- English: Zip the contents of the `extension` folder into a single archive (e.g. `gmail-thread-reverser-latest.zip`).

### 3. ストア掲載情報と審査要件 / Store Listing & Review Requirements
- **アイコン / Icons**: `icons/icon128.png` (128x128px)
- **スクリーンショット / Screenshots**: 1280x800 または 640x400 ピクセル（Gmail上でスレッド反転やダークモードが動作している画面キャプチャを最低1枚）
- **プライバシーポリシー / Privacy Policy**:
  - 日本語: 「当拡張機能はユーザー設定（ON/OFF）をブラウザのローカルストレージ（chrome.storage.sync）に保存する目的のみで使用し、メール本文や個人情報は一切外部に送信・収集しません」と明記。
  - English: State that all user preferences are saved strictly within local Chrome storage, and no personal email content or user data is ever tracked, collected, or transmitted externally.

### 4. 提出と公開 / Submission
- 日本語: ダッシュボードで「新しいアイテム」を作成してZIPをアップロードし、説明文とスクリーンショットを登録して「審査のために送信」をクリックします（通常1〜3営業日で審査完了）。
- English: Upload the ZIP file in the dashboard, complete the store listing details, and click "Submit for review" (typically approved within 1–3 business days).
