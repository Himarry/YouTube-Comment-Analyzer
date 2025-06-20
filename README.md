# YouTube Comment Analyzer

# YouTube Comment Analyzer

YouTubeのコメント欄に「コメントを解析する」ボタンを追加し、YouTube上で表示されていないコメントをAPI経由で検出・表示するブラウザ拡張機能です。

## 機能
- コメント欄の上部に「コメント解析」「簡易解析」ボタンを追加
- ボタンを押すとYouTube Data APIでコメントを取得し、表示されていないコメントを検出
- 未表示コメントをYouTubeのコメント欄上部にYouTube風デザインで表示
- 簡易解析：軽量で高速な解析（コメント数の比較のみ）
- 通常解析：詳細な解析（未表示コメントの実際の表示）

## 対応ブラウザ
- **Chrome**: `manifest.json`を使用
- **Firefox**: `manifest_firefox.json`を`manifest.json`にリネームして使用

## 使い方

### Chrome版
1. このリポジトリをダウンロード
2. `manifest.json`と`content.js`を含むフォルダをChromeの「パッケージ化されていない拡張機能を読み込む」で追加
3. YouTubeの動画ページでコメント欄にボタンが表示されます

### Firefox版
1. このリポジトリをダウンロード
2. `manifest_firefox.json`を`manifest.json`にリネーム（元の`manifest.json`は削除またはバックアップ）
3. `about:debugging` → 「このFirefox」→ 「一時的なアドオンを読み込む」で`manifest.json`を選択
4. YouTubeの動画ページでコメント欄にボタンが表示されます

### 共通設定
- **APIキーは`content.js`内の`YOUTUBE_API_KEY`にご自身のものを設定してください**

## 注意
- **APIキーは絶対にGitHub等で公開しないでください。**
- 公開用には`YOUR_API_KEY_HERE`などダミー値にしておき、各自で設定する運用にしてください。
- YouTube Data APIの利用にはAPIキーが必要です
- 解析結果やUIはYouTubeの仕様変更で動作しなくなる場合があります

---
