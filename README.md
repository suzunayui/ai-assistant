# YouTube ライブチャット取得ツール with AI応答

2025年8月9日追記
gpt-5-nanoが出たので変更しようと思ったけど返答が遅くなったのでしばらくgpt-4.1-nanoのままにします。

Node.jsとElectronを使用してYouTubeライブ配信のチャットをリアルタイムで取得・表示し、「こもち」への言及に対してOpenAI GPT-4.1-nanoとVOICEVOXで自動応答するデスクトップアプリケーションです。

## インストール

📦 **簡単インストール**: [リリースページ](https://github.com/suzunayui/ai-assistant/releases/)からインストーラーをダウンロード

## 特徴

- 🎯 **簡単操作**: チャンネルURLを入力するだけ
- ⚡ **リアルタイム**: ライブチャットを即座に表示
- 🤖 **AI応答**: 「こもち」への言及に自動でGPT-4.1-nanoが返答
- 🔊 **音声読み上げ**: VOICEVOXによるAI応答の音声合成
- 🎨 **モダンUI**: 美しいグラデーションデザイン
- 🔒 **セキュア**: Electronのセキュリティベストプラクティスを採用
- 🛠️ **クロスプラットフォーム**: Windows、macOS、Linuxで動作

## 技術スタック

- **Node.js** v24.2.0
- **Electron** - デスクトップアプリフレームワーク
- **youtube-chat** - YouTubeチャット取得ライブラリ
- **OpenAI API** - GPT-4.1-nano モデルによるAI応答生成
- **VOICEVOX** - 音声合成エンジン
- **axios** - HTTP通信
- **Modern HTML/CSS/JavaScript**

## 前提条件

### 必須
- Node.js v16以上
- npm

### AI応答機能（オプション）
- OpenAI API Key
- VOICEVOX (http://localhost:50021で起動済み)

## 初回セットアップ（重要）

### 1. OpenAI API Key の設定（必須）
**このアプリケーションを使用するには、OpenAI API Key が必要です。**

#### 方法1: アプリ内で設定（推奨）
1. アプリを起動
2. 画面上部の「AI応答設定」セクションを開く
3. 「OpenAI API Key」フィールドに `sk-proj-...` で始まるキーを入力
4. 「保存」ボタンをクリック

#### 方法2: .envファイルで設定
```bash
# プロジェクトルートに.envファイルを作成
OPENAI_API_KEY=sk-proj-your-api-key-here
```

#### API Keyの取得方法
1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. アカウント作成・ログイン
3. API Keys ページで新しいキーを作成
4. 生成されたキーをコピーして上記の方法で設定

### 2. VOICEVOX の起動（音声読み上げ用）
   - VOICEVOXアプリケーションを起動し、`http://localhost:50021` で利用可能にする

4. アプリケーションを起動:
```bash
npm start
```

### 開発モード

開発者ツールとログを有効にして起動:
```bash
npm run dev
```

## 使用方法

### 基本設定

1. アプリケーションを起動
2. **AI応答設定セクション**でOpenAI API Keyを入力・保存
3. VOICEVOXが起動済みであることを確認 (`http://localhost:50021`)

### チャット取得

1. チャンネルURLフィールドに入力
   - 例: `https://www.youtube.com/@suzunayui`
2. 「チャット接続」ボタンをクリック
3. ライブ配信が検出されると、チャットがリアルタイムで表示されます

### AI応答機能

- チャット内に「**こもち**」が含まれている場合、自動でAI応答が生成されます
- AI応答は🤖アイコン付きで表示されます
- VOICEVOXが起動していれば、自動で音声読み上げされます
- AI応答設定で機能のON/OFFを切り替え可能

### VOICEVOX話者設定

- AI応答設定で好みの話者を選択可能
- 「話者更新」ボタンでVOICEVOXから最新の話者一覧を取得
- 話者変更時に自動でテスト音声が再生されます

## ファイル構成

```
├── main.js           # Electronメインプロセス
├── preload.js        # セキュリティ用API橋渡し
├── youtube-chat.js   # YouTubeチャット取得モジュール
├── ai-response.js    # AI応答・音声合成モジュール
├── index.html        # メインUI
├── styles.css        # スタイルシート
├── renderer.js       # UIロジック
└── package.json      # プロジェクト設定
```

## 機能

- ✅ チャンネルURLから自動ライブ配信検出
- ✅ リアルタイムチャット表示
- ✅ 接続時間ベースの新規チャットフィルタリング
- ✅ タイムスタンプ付きメッセージ（実際の投稿時間）
- ✅ システムメッセージとエラー表示
- ✅ 自動スクロール
- ✅ レスポンシブデザイン
- ✅ VOICEVOX話者選択機能
- ✅ 音声テスト再生機能
- 🤖 **AI応答生成**: 「こもち」への言及に自動応答
- 🔊 **音声読み上げ**: VOICEVOX連携
- ⚙️ **設定管理**: API Key・機能ON/OFF設定
- 📊 **統計情報**: メッセージ数・フィルタ統計表示

## 注意事項

- ライブ配信が行われていない場合はエラーが表示されます
- インターネット接続が必要です
- YouTube側の仕様変更により動作しなくなる可能性があります

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告をお待ちしています！
