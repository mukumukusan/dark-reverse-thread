# Dark Reverse Thread (v1.0.4)

Web版Gmailのスレッド画面・メール本文・作成ウィンドウを、元の色合いを残したままダークモードで表示し、スレッドを新しい順に並べ替える Chrome 拡張機能（Manifest V3）です。
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
   - 日本語: HTMLメールの文字色・背景色を、色相と彩度を保ったまま明るさだけ暗い背景向けに調整（黒文字→明るい灰色、白背景→暗色。赤字は明るい赤、青いリンクは明るい青のように色合いを残し、黄色のマーカーなど明るい背景色は同じ色合いの暗い色になる）。画像やロゴは本来の色を保護し、透過画像（黒いロゴなど）の背後には元のメールでの背景色を敷いて見えるように（白い背景は目に優しい明るい灰色にし、ロゴくらいの小さな画像は角の丸いカード風に表示）。印刷時は元の色で出力。
   - English: Adapts HTML email text and background colors for dark mode by remapping only their lightness, keeping the original hue and saturation (black text becomes light gray and white backgrounds turn dark; red text stays a lighter red and blue links a lighter blue, while light backgrounds such as yellow highlights become a dark shade of the same hue). Images keep their colors, transparent ones (e.g. dark logos) get their original backdrop back so they stay visible (a white backdrop is softened to light grey, and logo-sized images are shown as small rounded cards), and printing uses the original colors.
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
   - 日本語: 拡張機能名・説明・ポップアップ・クイックバーはブラウザの言語に合わせて表示（現在は英語・日本語・スペイン語・ポルトガル語（ブラジル）・ドイツ語。その他の言語は英語）。Gmail の画面は文言ではなく構造で判定しているので、Gmail をどの言語で表示していても動作します。
   - English: Extension name, description, popup and quick bar follow the browser language (English, Japanese, Spanish, Brazilian Portuguese and German included; other languages fall back to English). Gmail is recognized by its structure, not its on-screen text, so it works with any Gmail display language.

---

## 構成ファイル一覧 / Included Files

- `manifest.json`: 拡張機能定義ファイル / Extension manifest (Manifest V3)
- `settings.js`: 設定の初期値（content.js と popup.js で共有） / Default settings shared by the content script and popup
- `content.js`: スレッド並び替え・DOMスタイル制御・入力時軽量化スクリプト / Core script with keystroke filtering
- `styles.css`: スレッド反転レイアウト、マテリアルダークCSS、印刷用スタイル / Stylesheet for layout, dark theme, and @media print
- `popup.html` & `popup.js` & `popup.css`: ツールバー設定ポップアップ / Extension popup settings UI
- `_locales/<lang>/messages.json`: 表示文字列（英語 `en` が既定） / UI strings per language (`en` is the default)
- `icons/`: アイコンアセット (16x16, 48x48, 128x128 PNG) / App icons
- `tests/`: 自動テスト（ストア用の ZIP には含まれません） / Automated tests (not part of the store package)

### テストの実行 / Running the tests

```
python3 tests/run.py          # すべて / everything
python3 tests/run.py theme    # 名前に "theme" を含むものだけ / only suites whose name contains "theme"
```

- 日本語: Python 3 と Google Chrome だけで動きます（ほかのインストールは不要）。言語ファイル・manifest・CSS の書き方を確かめる静的チェックと、Gmail を模したページで実物の content.js・styles.css・popup をヘッドレス Chrome で動かすテストがあります。時間のかかる待ち（10 秒など）は Chrome の仮想時間で早送りするので、全体で数秒で終わります。
- English: Needs only Python 3 and Google Chrome. Static checks cover the locale files, the manifest and CSS pitfalls; browser suites run the real content.js, styles.css and popup in headless Chrome on a small Gmail-like page with a fake `chrome.*` API. Long waits (such as 10 seconds) are fast-forwarded with Chrome's virtual time, so the whole run takes a few seconds.

---

## インストール / Install

Chrome ウェブストアからインストールできます / Install it from the Chrome Web Store:

https://chromewebstore.google.com/detail/dark-reverse-thread/nkbapoheeghahneaomcecckkeeobmkja

## ライセンス / License

MIT License — [`LICENSE`](LICENSE)

## 応援 / Support

気に入っていただけたら、コーヒー1杯分の応援をいただけると励みになります。
If you like it, you can buy me a coffee: https://buymeacoffee.com/mukumukusan
