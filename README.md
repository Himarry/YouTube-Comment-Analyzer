# YouTube Comment Analyzer

YouTubeのコメント欄に「コメントを解析する」ボタンを追加し、YouTube上で表示されていないコメントをAPI経由で検出・表示するChrome拡張機能です。

## 機能
- コメント欄の上部に「コメントを解析する」ボタンを追加
- ボタンを押すとYouTube Data APIでコメントを取得し、表示されていないコメントを検出
- 未表示コメントをYouTubeのコメント欄上部にYouTube風デザインで表示
- 解析中は進捗ログをポップアップで表示
- 解析結果は自動で消えます

## 使い方
1. このリポジトリをダウンロード
2. `manifest.json`と`content.js`を含むフォルダをChromeの「パッケージ化されていない拡張機能を読み込む」で追加
3. YouTubeの動画ページでコメント欄にボタンが表示されます
4. APIキーは`content.js`内で自分のものに差し替えてください

## 注意
- YouTube Data APIの利用にはAPIキーが必要です
- 解析結果やUIはYouTubeの仕様変更で動作しなくなる場合があります

---

適当なREADMEです。
