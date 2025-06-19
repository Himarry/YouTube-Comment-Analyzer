# YouTube Comment Analyzer

YouTubeのコメント欄に「コメントを解析する」ボタンを追加し、YouTube上で表示されていないコメントをAPI経由で検出・表示するChrome拡張機能です。

## 機能
- コメント欄の上部に「コメントを解析する」ボタンを追加
- ボタンを押すとYouTube Data APIでコメントを取得し、表示されていないコメントを検出
- 未表示コメントをYouTubeのコメント欄上部にYouTube風デザインで表示
- 解析結果は自動で消えます

## 使い方
1. このリポジトリをダウンロード
2. `manifest.json`と`content.js`を含むフォルダをChromeの「パッケージ化されていない拡張機能を読み込む」で追加
3. YouTubeの動画ページでコメント欄にボタンが表示されます
4. **APIキーは`content.js`内の`YOUTUBE_API_KEY`にご自身のものを設定してください**

## 注意
- **APIキーは絶対にGitHub等で公開しないでください。**
- 40件以上のコメントには対応していません。
- 公開用には`YOUR_API_KEY_HERE`などダミー値にしておき、各自で設定する運用にしてください。
- YouTube Data APIの利用にはAPIキーが必要です
- 解析結果やUIはYouTubeの仕様変更で動作しなくなる場合があります

---
