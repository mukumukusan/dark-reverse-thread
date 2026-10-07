# プライバシーポリシー / Privacy Policy

**Dark Reverse Thread**
最終更新日 / Last updated: 2026-10-07

---

## 日本語

### 収集する情報
本拡張機能は、個人情報・メールの内容・閲覧履歴などの利用者データを**一切収集しません**。開発者を含む第三者に送信することもありません。

### メールの内容の扱い
スレッドを新しい順に並べ替え、ダークモードで表示するために、本拡張機能は Gmail（`https://mail.google.com/`）の画面の内容をお使いのブラウザ内で読み取り、表示の順番や色を変更します。この処理はすべてお使いのブラウザ内だけで行われます。メールの内容が保存されたり、外部に送信されたりすることはありません。

### 保存する情報
本拡張機能が保存するのは、次の表示設定だけです。

- スレッドを新しい順に表示する（ON / OFF）
- ダークモード（ON / OFF）
- 返信欄の位置（上 / 下）
- クイックバーの表示（ON / OFF）

これらは Chrome の `chrome.storage.sync` に保存されます。Chrome の同期を有効にしている場合は、Chrome の仕組みによって、同じ Google アカウントでログインしている他の端末にも同期されます。開発者がこれらの設定を見ることはできません。

このほか、Gmail が明るいテーマかどうか（はい／いいえ）だけを、設定画面に案内を表示するために、お使いの端末の中（`chrome.storage.local`）に保存します。案内の「テーマを選ぶ」ボタンで新しい Gmail のタブを開くときは、そのタブで設定パネルを開くための目印（押した時刻）も一時的に保存し、Gmail が開いたらすぐに消します。どちらも同期や送信はされません。本拡張機能が Gmail の設定（テーマなど）を変更することはありません。

### 通信
本拡張機能は外部のサーバーと通信しません。アクセス解析、広告、トラッキングも使用していません。

### 権限
- `storage`：上記の表示設定を保存するため
- `https://mail.google.com/*` へのアクセス：Gmail の画面の表示を変更するため

### データの削除
本拡張機能を削除すると、Chrome によって保存された設定も削除されます。

### 本ポリシーの変更
内容を変更する場合は、このページを更新し、最終更新日を改めます。

### お問い合わせ
Chrome ウェブストアの本拡張機能のページにある「サポート」欄からご連絡ください。

---

## English

### Information we collect
This extension does **not collect any user data**, including personal information, email content or browsing history. Nothing is sent to the developer or any third party.

### How email content is handled
To show threads newest-first and in dark mode, the extension reads the content of the Gmail page (`https://mail.google.com/`) inside your browser and changes the order and colors of what is displayed. All of this happens only inside your browser. Email content is never stored or sent anywhere.

### Information we store
The extension stores only these display settings:

- Show threads newest-first (on / off)
- Dark mode (on / off)
- Reply area position (top / bottom)
- Show the quick bar (on / off)

They are stored in Chrome's `chrome.storage.sync`. If Chrome sync is turned on, Chrome syncs them to your other devices signed in to the same Google account. The developer cannot see these settings.

In addition, only whether Gmail uses a light theme (yes / no) is kept on your device (`chrome.storage.local`) to show a tip in the settings popup. When the tip's "Choose a theme" button opens a new Gmail tab, a temporary marker (the time of the click) is also kept so that tab can open the settings panel; it is deleted as soon as Gmail opens. Neither is synced or sent anywhere. The extension never changes Gmail's settings (such as the theme) itself.

### Network
The extension does not communicate with any external server. It uses no analytics, advertising or tracking.

### Permissions
- `storage`: to save the display settings above
- Access to `https://mail.google.com/*`: to change how the Gmail page is displayed

### Deleting your data
When you remove the extension, Chrome also removes its saved settings.

### Changes to this policy
If this policy changes, this page will be updated along with the "Last updated" date.

### Contact
Please use the "Support" section on the extension's Chrome Web Store page.
