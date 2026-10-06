# Chrome ウェブストア掲載情報 / Store Listing — Dark Reverse Thread

デベロッパーダッシュボードの各欄に、そのまま貼り付けて使う文面です。
Text to paste into the matching fields of the Chrome Web Store Developer Dashboard.

---

## 1. 基本情報 / Basics

| 欄 / Field | 内容 / Value |
|---|---|
| 名前 / Name | `_locales` の `extName` から自動で入ります / filled from `extName`（ja: Dark Reverse Thread – Gmail をダークモード＆新しい順に / en: Dark Reverse Thread – Gmail dark mode & newest-first） |
| 短い説明 / Summary | `_locales` の `extDescription` から自動で入ります / filled from `extDescription` |
| カテゴリ / Category | 仕事効率化 / Productivity |
| 言語 / Language | 日本語・English |
| プライバシーポリシー / Privacy policy | https://github.com/mukumukusan/dark-reverse-thread/blob/main/PRIVACY.md |
| ホームページ / Homepage | https://github.com/mukumukusan/dark-reverse-thread |
| サポート / Support | https://github.com/mukumukusan/dark-reverse-thread/issues |

---

## 2. 詳しい説明（日本語） / Detailed description (Japanese)

```
Gmail のスレッドとメール本文を、元の色合いを保ったままダークモードで表示し、スレッドを新しい順に並べ替える拡張機能です。

■ 色合いを残すダークモード
・白い背景を暗く、黒い文字を明るくしながら、赤字やハイライトなどの色はそのまま残します。単純な白黒反転ではないので、メールの見た目が崩れません。
・透明な背景のロゴなど、暗い背景で見えなくなる画像には、元の背景色を敷いて読みやすくします。
・スレッド画面、返信欄、新規作成ウィンドウ、宛先の候補、メニュー、作成ボタンまで暗く表示します。
・受信トレイの一覧には手を加えず、Gmail のテーマ設定をそのまま使います。Gmail のテーマを「ダーク」にして組み合わせると、画面全体が暗くなります。
・ダークの ON / OFF で、メールの位置や大きさは変わりません。

■ スレッドを新しい順に表示
・最新のメールがスレッドの一番上に来るので、長いやりとりでもスクロールせずに最新の内容を読めます。
・スレッドを開くと、最新のメールの位置を表示します。
・返信・転送ボタンと返信欄は、最新のメールの直下（標準）または直上に置けます。

■ すぐに切り替え
・ツールバーの拡張機能アイコンから、ダーク・新しい順・返信欄の位置を切り替えられます。画面右下に切り替えボタン（クイックバー）を出すこともできます。
・印刷するときは、元の色と古い順に戻して印刷します。

■ プライバシー
・データの収集や外部への送信は一切行いません。メールの表示はすべてお使いのブラウザの中だけで変更します。
・保存するのは表示設定（ON / OFF など）だけです。

※ 本拡張機能は Google とは関係のない個人開発のものです。Gmail は Google LLC の商標です。

気に入っていただけたら、コーヒー1杯分の応援をいただけると励みになります。
https://buymeacoffee.com/mukumukusan
```

---

## 3. Detailed description (English)

```
Dark Reverse Thread gives Gmail a dark mode for threads and email bodies that keeps their original colors, and shows conversations newest-first.

■ A dark mode that keeps colors
• White backgrounds turn dark and black text turns light, while red text, highlights and other colors keep their hue. It is not a simple color inversion, so emails keep their look.
• Transparent images such as dark logos get their original backdrop back, so they stay visible.
• Covers the thread view, the inline reply box, the compose window, recipient suggestions, menus and the Compose button.
• The inbox list is left to Gmail's own theme; pair it with Gmail's Dark theme for a fully dark Gmail.
• Turning dark mode on or off never moves or resizes anything.

■ Newest-first threads
• The latest email sits at the top of the thread, so you can read the newest reply without scrolling through long conversations.
• Threads open scrolled to the newest email.
• Place the Reply / Forward buttons and the reply box right below (default) or right above the newest email.

■ Quick switching
• Toggle dark mode, newest-first order and the reply position from the extension's toolbar icon, or turn on a small quick bar at the bottom right for one-click switching.
• Printing uses the original colors and oldest-first order.

■ Privacy
• No data is collected or sent anywhere. Everything happens inside your browser.
• Only your display settings (on / off and so on) are saved.

This extension is an independent project, not affiliated with or endorsed by Google. Gmail is a trademark of Google LLC.

If it makes your inbox a little nicer, you can buy me a coffee:
https://buymeacoffee.com/mukumukusan
```

---

## 4. プライバシーへの取り組み（申告） / Privacy practices tab

### 単一用途 / Single purpose

- 日本語: Gmail の表示を変更する（スレッド画面・作成画面などのダークモード表示と、スレッドを新しい順に並べ替えること）。
- English: Changes how Gmail is displayed: a color-preserving dark mode for the conversation and compose views (and related menus), and newest-first thread order.

### 権限が必要な理由 / Permission justification

| 権限 / Permission | 理由（日本語） | Justification (English) |
|---|---|---|
| `storage` | ダークモード・新しい順・返信欄の位置・クイックバー表示の設定と、Gmail が明るいテーマかどうか（設定画面の案内用）を保存するため。 | To save the display settings (dark mode, newest-first order, reply position, quick bar visibility) and whether Gmail uses a light theme (for a tip in the popup). |
| ホスト権限 `https://mail.google.com/*`（コンテンツスクリプト） | Gmail の画面に CSS とスクリプトを適用し、表示の色と並び順を変えるため。Gmail 以外のサイトでは動作しません。 | To apply the stylesheet and script that change colors and message order on the Gmail page. It does not run on any other site. |

### リモートコード / Remote code

- いいえ。すべてのコードは拡張機能のパッケージに含まれています。
- No. All code is included in the extension package.

### データの使用 / Data usage

- 収集するデータ：なし（どの項目にもチェックを入れない）
- Data collected: none (leave every category unchecked)
- 以下の3項目すべてに同意（チェック）する / Certify all three:
  - 承認されている用途以外で、ユーザーデータを第三者に販売・転送しない / not sold or transferred to third parties outside approved use cases
  - 拡張機能の単一用途と関係のない目的で使用・転送しない / not used or transferred for purposes unrelated to the single purpose
  - 信用度の判定や融資の目的で使用・転送しない / not used or transferred to determine creditworthiness or for lending

---

## 5. 画像 / Images

日本語版は `screenshots/ja/`、英語版は `screenshots/en/` に同じ構成で入っています。ストアの言語ごとに設定できます。
Japanese images are in `screenshots/ja/` and English ones in `screenshots/en/`, with the same file names; set them per store language.

| ファイル / File | 内容 / Shows |
|---|---|
| `0-compare-off-on.png` | ダーク OFF（上）と ON（下）の比較。最初の1枚におすすめ / OFF (top) vs ON (bottom); recommended first |
| `1-dark-newest-first.png` | ダークで、最新のメールが一番上 / Dark, newest email on top |
| `2-reply-below-newest.png` | 返信ボタンが最新メールの直下、その下に古いメール / Reply buttons right below the newest email, older ones below |
| `3-dark-off.png` | ダーク OFF の同じ画面 / Same view with dark mode off |
| `4-dark-compose.png` | ダークの作成ウィンドウ / Dark compose window |

- すべて 1280×800。実解像度（2倍）の 2276×1422 ピクセルから縮小しています。
- All 1280×800, downscaled from a native 2x capture (2276×1422 px).
- メールの内容・人物・アドレス（example.com）は架空のものです。
- Every name, address (example.com) and message is fictional.
- アイコン（128×128）: `icons/icon128.png`

### 宣伝用画像（任意） / Promotional images (optional)

| ファイル / File | 用途 / Used for |
|---|---|
| `promo/ja/small-tile-440x280.png`, `promo/en/small-tile-440x280.png` | 小さいプロモーションタイル（一覧・検索結果） / Small promo tile (lists, search) |
| `promo/ja/marquee-1400x560.png`, `promo/en/marquee-1400x560.png` | マーキー（特集に選ばれたときのみ） / Marquee (only if featured) |

- どちらも透過なしの PNG。アイコンの元画像は `store/icon-1024.png`。
- Both are PNG without transparency. The icon master is `store/icon-1024.png`.
