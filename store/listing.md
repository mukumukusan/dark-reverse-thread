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
Gmail をダークテーマにしても、開いたメールは真っ白でまぶしい。長いスレッドでは、最新の返信を読むたびに一番下までスクロール――。
Dark Reverse Thread なら、この2つをまとめて解決できます。

■ メール本文まで、色を残したままダークに
・背景を暗く、文字を明るくしながら、赤字やハイライトなどの色はそのまま残します。単純な白黒反転ではないので、メールのデザインを崩しにくいのが特長です。
・背景が透明なロゴなど、暗くすると見えなくなる画像には、元の背景色を敷いて表示します。
・スレッド画面のほか、返信欄、新規作成ウィンドウ、宛先の候補、メニューまで暗くなります。Gmail がダークテーマのときは、検索欄と検索候補も対象です。
・ダークを ON / OFF しても、メールの位置や大きさは変わりません。

■ 最新のメールが一番上に
・スレッドを新しい順に並べるので、開いた瞬間に最新の返信が目に入ります。
・返信・転送ボタンと返信欄は、最新のメールのすぐ下（標準）か、すぐ上に置けます。

■ Gmail のテーマと組み合わせて
・受信トレイなどの外枠には、Gmail 自身のテーマがそのまま使われます。Gmail のテーマを「ダーク」にすれば、画面全体が暗くなります。
・設定画面の「Gmail のテーマを変える」から、テーマ選択の画面をすぐに開けます。テーマを選ぶのはご自身で、拡張機能が Gmail の設定を変えることはありません。

■ ワンクリックで切り替え
・ツールバーの拡張機能アイコンから、ダーク・新しい順・返信欄の位置をいつでも切り替えられます。画面右下に切り替えボタン（クイックバー）を出すこともできます。
・印刷時は、元の色と古い順に戻ります。

■ プライバシー
・データの収集や外部への送信は一切ありません。表示の変更は、すべてお使いのブラウザの中で行います。
・保存するのは、表示設定（ON / OFF など）と、Gmail が明るいテーマかどうかだけです。

※ 本拡張機能は個人が開発したもので、Google とは関係ありません。Gmail は Google LLC の商標です。

気に入っていただけたら、コーヒー1杯分の応援をいただけると励みになります。
https://buymeacoffee.com/mukumukusan
```

---

## 3. Detailed description (English)

```
Turn on Gmail's Dark theme, and the emails you open are still bright white. In long threads, you scroll all the way down every time just to read the latest reply.
Dark Reverse Thread fixes both.

■ Dark emails that keep their colors
• Backgrounds turn dark and text turns light, while red text, highlights and other colors keep their hue. It is not a simple color inversion, so emails keep their design.
• Images that would disappear in dark mode, such as transparent logos, get their original backdrop back.
• Beyond the thread view, the reply box, compose window, recipient suggestions and menus go dark too. On Gmail's Dark theme, so do the search box and its suggestions.
• Turning dark mode on or off never moves or resizes anything.

■ The newest email on top
• Threads are shown newest-first, so the latest reply is the first thing you see.
• Put the Reply / Forward buttons and the reply box right below (default) or right above the newest email.

■ Made to pair with Gmail's theme
• The inbox and the rest of Gmail's frame keep Gmail's own theme. Set it to Dark for a fully dark Gmail.
• "Change Gmail's theme" in the settings popup opens Gmail's theme picker right away. You pick the theme; the extension never changes Gmail's settings itself.

■ One-click switching
• Switch dark mode, newest-first order and the reply position anytime from the toolbar icon. You can also add a small quick bar in the bottom-right corner.
• When you print, the original colors and oldest-first order come back.

■ Privacy
• Nothing is collected or sent anywhere. All changes happen inside your browser.
• Only your display settings (on / off and so on) and whether Gmail uses a light theme are saved.

Dark Reverse Thread is an independent project, not affiliated with or endorsed by Google. Gmail is a trademark of Google LLC.

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
| `00-problem.png` | 「まぶしい」「長い」で困る封筒のイラスト。最初の1枚におすすめ / Illustration of the two pains (too bright, too long); recommended first |
| `0-compare-off-on.png` | ダーク OFF（上）と ON（下）の比較。2枚目におすすめ / OFF (top) vs ON (bottom); recommended second |
| `1-dark-newest-first.png` | ダークで、最新のメールが一番上 / Dark, newest email on top |
| `2-reply-below-newest.png` | 返信ボタンが最新メールの直下、その下に古いメール / Reply buttons right below the newest email, older ones below |
| `3-dark-compose.png` | ダークの作成ウィンドウ / Dark compose window |
| `4-popup-settings.png` | 設定のポップアップと「テーマを選ぶ」ボタン（1.0.2 以降） / Settings popup with the "Choose a theme" button (1.0.2+) |

- すべて 1280×800。実解像度（2倍）の 2276×1422 ピクセルから縮小しています。
- All 1280×800, downscaled from a native 2x capture (2276×1422 px).
- `00-problem.png` はイラストで、1280×800（2倍で描画して縮小）。
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
