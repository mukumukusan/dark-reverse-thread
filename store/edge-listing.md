# Microsoft Edge アドオン掲載情報 / Edge Add-ons Listing — Dark Reverse Thread

Microsoft Partner Center（https://partner.microsoft.com/dashboard/microsoftedge/）で提出するときに使う資料です。
説明文などの本文は Chrome 用の `listing.md` と同じものを使います。

---

## 1. パッケージ / Package

- Chrome と同じ ZIP（`dark-reverse-thread-<version>.zip`、`git archive` で作成）をそのままアップロードします。
- Edge の評価リンク: ポップアップの「⭐ 評価する」は、Edge では Chrome ウェブストアに飛ばないように隠しています（`popup.js` の `EDGE_STORE_URL` が空のとき）。Edge で公開されて掲載ページのアドレスが分かったら、`EDGE_STORE_URL` に入れて次のバージョンで出します。

## 2. 基本情報 / Properties

| 欄 / Field | 内容 / Value |
|---|---|
| カテゴリ / Category | Productivity |
| プライバシーポリシー / Privacy policy | https://github.com/mukumukusan/dark-reverse-thread/blob/main/PRIVACY.md |
| ウェブサイト / Website | https://github.com/mukumukusan/dark-reverse-thread |
| サポート / Support contact | https://github.com/mukumukusan/dark-reverse-thread/issues |
| 成人向け / Mature content | なし / No |

## 3. 掲載情報（言語ごと） / Store listing (per language)

Chrome と同じく、英語・日本語・スペイン語・ポルトガル語（ブラジル）・ドイツ語を登録します。

| 欄 / Field | 内容 / Value |
|---|---|
| 説明 / Description | `listing.md` の「詳しい説明」をその言語ごとに貼る（250 文字以上が必要） |
| ロゴ / Extension Store logo | `store/edge-logo-300.png`（300×300） |
| 小さいプロモーションタイル / Small promotional tile | `store/promo/en/small-tile-440x280.png` |
| スクリーンショット / Screenshots | `store/screenshots/<en または ja>/` の 1〜5（1280×800） |
| 大きいプロモーションタイル / Large promotional tile | 任意。`store/promo/<en または ja>/marquee-1400x560.png` |

### 検索語 / Search terms（英語、最大 7 個）

```
gmail dark mode
dark mode
gmail
dark theme
newest first
reverse thread
email
```

## 4. 審査担当への注記 / Notes for certification

```
No account or setup is needed for the extension itself. To test:
1. Open https://mail.google.com/ and sign in with any Gmail account.
2. Open a conversation with two or more messages: the newest message is shown at the top, and the
   conversation and email bodies are shown in dark colors.
3. Click the toolbar icon to open the settings (dark mode, newest-first order, reply box position,
   quick bar). Changes apply right away.
The extension only uses the "storage" permission and runs only on https://mail.google.com/. It sends
no data anywhere.
```
