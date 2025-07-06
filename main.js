// Windows環境での文字エンコーディング設定
if (process.platform === 'win32') {
  // Node.jsプロセスの標準出力エンコーディングをUTF-8に設定
  if (process.stdout && process.stdout.setEncoding) {
    process.stdout.setEncoding('utf8');
  }
  if (process.stderr && process.stderr.setEncoding) {
    process.stderr.setEncoding('utf8');
  }
  
  // コンソール出力の文字化け対応
  const originalLog = console.log;
  const originalError = console.error;
  
  console.log = function(...args) {
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)
    ).join(' ');
    originalLog(message);
  };
  
  console.error = function(...args) {
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)
    ).join(' ');
    originalError(message);
  };
}

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { getYoutubeLiveVideoId, startChatListener } = require('./youtube-chat');
const { processMessage, checkVoicevoxStatus } = require('./ai-response');
const fs = require('fs');
const os = require('os');

let mainWindow;
let chatListener = null;

// 設定ファイルのパス
const configPath = path.join(os.homedir(), '.komochi-chat-config.json');

/**
 * 設定を保存
 */
function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('設定保存エラー:', error);
    return false;
  }
}

/**
 * 設定を読み込み
 */
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    } else {
      console.log('設定ファイルが存在しないため、デフォルト設定を作成します');
      const defaultConfig = {
        channelUrl: '',
        apiKey: '',
        ngWords: [],
        ngWordsSkip: [],
        ngWordsRemove: [],
        ngWordMode: 'skip',
        namePronunciations: {},
        textReplacements: {}, // チャットテキストの汎用置き換え設定
        chatReplacements: {}, // チャット読み替え設定（単語→単語の置き換え）
        wordSpeakers: {}, // 単語別話者設定（単語→話者ID）
        emojiReadingMap: {},
        triggerWords: ['こもち'],
        personality: '',
        readingSettings: {
          readAllChats: true,
          chatSpeakerId: 1,
          komochiSpeakerId: 3,
          readUserName: true,
          readTimestamp: false
        },
        chatVoiceSettings: {
          volume: 0.5,
          speed: 1.0
        },
        komochiVoiceSettings: {
          volume: 0.5,
          speed: 1.0
        },
        antiSpamSettings: {
          maxMessagesPerMinute: 5,
          maxMessagesPerFiveMinutes: 15,
          duplicateThreshold: 0.8,
          cooldownDuration: 30000
        }
      };
      
      // デフォルト設定を保存
      saveConfig(defaultConfig);
      return defaultConfig;
    }
  } catch (error) {
    console.error('設定読み込みエラー:', error);
    return {};
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png') // アイコンがあれば
  });

  mainWindow.loadFile('index.html');

  // メニューバーを非表示
  mainWindow.setMenuBarVisibility(false);

  // 開発者ツールを開く（デバッグ用）
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  // 設定ファイルのディレクトリを確保
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    console.log('設定フォルダーを作成:', configDir);
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // 設定を読み込み
  const config = loadConfig();
  if (config.openaiApiKey) {
    process.env.OPENAI_API_KEY = config.openaiApiKey;
  }
  
  console.log('設定ファイルパス:', configPath);
  console.log('設定フォルダー:', configDir);
  
  // 環境変数の確認（デバッグ用）
  if (process.env.OPENAI_API_KEY) {
    console.log('OpenAI API Key loaded:', process.env.OPENAI_API_KEY.substring(0, 10) + '...');
  } else {
    console.log('OpenAI API Key not found. Please set it in app settings.');
  }
  
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (chatListener) {
      chatListener.stop();
    }
    app.quit();
  }
});

// レンダラープロセスからのメッセージを処理
ipcMain.handle('get-live-video-id', async (event, channelUrl) => {
  try {
    const result = await getYoutubeLiveVideoId(channelUrl);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('start-chat', async (event, videoId) => {
  try {
    if (chatListener) {
      chatListener.stop();
    }
    
    // VOICEVOX接続確認
    const voicevoxStatus = await checkVoicevoxStatus();
    if (!voicevoxStatus) {
      console.warn('VOICEVOX接続失敗 - AI応答機能は音声なしで動作します');
    }
    
    chatListener = await startChatListener(videoId, async (message) => {
      // UIにメッセージを送信
      mainWindow.webContents.send('chat-message', message);
      
      // ユーザーメッセージの場合、AI応答処理を実行
      if (message.type === 'user') {
        // スパム検出チェック
        const { isSpamMessage } = require('./ai-response');
        const spamCheck = isSpamMessage(message.author, message.message);
        
        if (spamCheck.isSpam) {
          console.log(`スパムメッセージを検出: ${message.author} - ${spamCheck.reason}`);
          
          // スパムメッセージはUIにマークして表示（管理者用）
          mainWindow.webContents.send('chat-message', {
            author: '⚠️ ' + message.author,
            message: `[スパム検出: ${spamCheck.reason}] ${message.message}`,
            timestamp: message.timestamp,
            type: 'spam',
            originalMessage: message
          });
          
          // 3回以上スパム違反のユーザーは自動クールダウン
          const { getUserHistory, setCooldown } = require('./ai-response');
          const userHistory = getUserHistory(message.author);
          if (userHistory.spamCount >= 2) { // 3回目でクールダウン
            setCooldown(message.author, 60000); // 1分間のクールダウン
            
            mainWindow.webContents.send('chat-message', {
              author: 'システム',
              message: `${message.author} さんは連投荒らし対策により一時的にクールダウンされました`,
              timestamp: new Date().toLocaleTimeString(),
              type: 'system'
            });
          }
          
          return; // スパムメッセージは処理を中断
        }
        // 現在の設定を取得
        const currentSettings = loadConfig();
        
        // 設定に追加情報を統合
        const completeSettings = {
          ...currentSettings,
          // 基本設定
          aiEnabled: currentSettings.aiEnabled !== false,
          voiceEnabled: currentSettings.voiceEnabled !== false,
          speakerId: currentSettings.speakerId || 1,
          
          // 読み上げ設定
          readAllChats: currentSettings.readingSettings?.readAllChats !== false,
          chatSpeakerId: currentSettings.readingSettings?.chatSpeakerId || 1,
          komochiSpeakerId: currentSettings.readingSettings?.komochiSpeakerId || 3,
          readUserName: currentSettings.readingSettings?.readUserName !== false,
          readTimestamp: currentSettings.readingSettings?.readTimestamp === true,
          
          // 音声設定
          chatVolume: currentSettings.chatVoiceSettings?.volume || 0.5,
          chatSpeed: currentSettings.chatVoiceSettings?.speed || 1.0,
          komochiVolume: currentSettings.komochiVoiceSettings?.volume || 0.5,
          komochiSpeed: currentSettings.komochiVoiceSettings?.speed || 1.0,
          
          // NGワードと名前読み方
          ngWordsSkip: currentSettings.ngWordsSkip || [], // スキップ用NGワード
          ngWordsRemove: currentSettings.ngWordsRemove || [], // 除去用NGワード
          namePronunciations: currentSettings.namePronunciations || {},
          textReplacements: currentSettings.textReplacements || {}, // テキスト置き換え設定
          chatReplacements: currentSettings.chatReplacements || {}, // チャット読み替え設定
          wordSpeakers: currentSettings.wordSpeakers || {}, // 単語別話者設定
          
          // 絵文字読み方設定
          emojiReadingMap: currentSettings.emojiReadings || {},
          
          // トリガーワード設定
          triggerWords: currentSettings.triggerWords || ['こもち'],
          
          // 性格設定
          personality: currentSettings.personality || ''
        };
        
        try {
          await processMessage(message.message, message.author, (aiResponse) => {
            // AI応答をUIに送信
            mainWindow.webContents.send('chat-message', aiResponse);
          }, completeSettings);
        } catch (processError) {
          console.error('メッセージ処理エラー:', processError);
          mainWindow.webContents.send('chat-message', {
            author: 'システム',
            message: `処理エラー: ${processError.message}`,
            timestamp: new Date().toLocaleTimeString(),
            type: 'error'
          });
        }
      }
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-chat', async (event) => {
  try {
    if (chatListener) {
      chatListener.stop();
      chatListener = null;
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// API Key保存
ipcMain.handle('save-api-key', async (event, apiKey) => {
  try {
    // 実行時の環境変数を更新
    process.env.OPENAI_API_KEY = apiKey;
    
    // 設定ファイルにも保存（.envファイルが無い場合のフォールバック）
    const config = loadConfig();
    config.openaiApiKey = apiKey;
    saveConfig(config);
    
    console.log('API Key updated via UI');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 設定保存
ipcMain.handle('save-settings', async (event, settings) => {
  try {
    const config = loadConfig();
    Object.assign(config, settings);
    saveConfig(config);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 設定読み込み
ipcMain.handle('load-settings', async (event) => {
  try {
    const config = loadConfig();
    
    // 設定ファイルからAPI Keyを読み込み
    if (config.openaiApiKey && !process.env.OPENAI_API_KEY) {
      process.env.OPENAI_API_KEY = config.openaiApiKey;
    }
    
    // API Keyの有無を返す（実際のキーは返さない）
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    
    return {
      ...config,
      hasApiKey: hasApiKey,
      apiKeySource: hasApiKey ? 'config' : 'none'
    };
  } catch (error) {
    return { hasApiKey: false, apiKeySource: 'none' };
  }
});

// VOICEVOX話者一覧取得
ipcMain.handle('get-speakers', async (event) => {
  try {
    const { getSpeakers } = require('./ai-response');
    const speakers = await getSpeakers();
    return speakers;
  } catch (error) {
    console.error('話者一覧取得エラー:', error);
    return [];
  }
});

// 音声テスト再生
ipcMain.handle('test-voice', async (event, speakerId) => {
  try {
    const { playAudioQueued } = require('./ai-response');
    const testMessage = 'こんにちは！音声テストです。';
    
    // キューに追加して再生
    playAudioQueued(testMessage, speakerId);
    
    return { success: true };
  } catch (error) {
    console.error('音声テストエラー:', error);
    return { success: false, error: error.message };
  }
});

// チャンネルURL保存
ipcMain.handle('save-channel-url', async (event, channelUrl) => {
  try {
    const config = loadConfig();
    config.lastChannelUrl = channelUrl;
    config.channelUrlHistory = config.channelUrlHistory || [];
    
    // 履歴に追加（重複チェック）
    if (channelUrl && !config.channelUrlHistory.includes(channelUrl)) {
      config.channelUrlHistory.unshift(channelUrl);
      // 履歴は最大10件まで
      if (config.channelUrlHistory.length > 10) {
        config.channelUrlHistory = config.channelUrlHistory.slice(0, 10);
      }
    }
    
    saveConfig(config);
    console.log(`チャンネルURL保存: ${channelUrl}`);
    return { success: true };
  } catch (error) {
    console.error('チャンネルURL保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// チャンネルURL読み込み
ipcMain.handle('load-channel-url', async (event) => {
  try {
    const config = loadConfig();
    return {
      lastChannelUrl: config.lastChannelUrl || '',
      channelUrlHistory: config.channelUrlHistory || []
    };
  } catch (error) {
    console.error('チャンネルURL読み込みエラー:', error);
    return {
      lastChannelUrl: '',
      channelUrlHistory: []
    };
  }
});

// NGワード設定保存
ipcMain.handle('save-ng-words', async (event, ngWords) => {
  try {
    const config = loadConfig();
    config.ngWords = Array.isArray(ngWords) ? ngWords : [];
    saveConfig(config);
    console.log(`NGワード保存: ${config.ngWords.length}件`);
    return { success: true };
  } catch (error) {
    console.error('NGワード保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// NGワード設定読み込み
ipcMain.handle('load-ng-words', async (event) => {
  try {
    const config = loadConfig();
    return config.ngWords || [];
  } catch (error) {
    console.error('NGワード読み込みエラー:', error);
    return [];
  }
});

// スキップ用NGワード設定保存
ipcMain.handle('save-ng-words-skip', async (event, ngWords) => {
  try {
    const config = loadConfig();
    config.ngWordsSkip = Array.isArray(ngWords) ? ngWords : [];
    saveConfig(config);
    console.log(`スキップ用NGワード保存: ${config.ngWordsSkip.length}件`);
    return { success: true };
  } catch (error) {
    console.error('スキップ用NGワード保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// スキップ用NGワード設定読み込み
ipcMain.handle('load-ng-words-skip', async (event) => {
  try {
    const config = loadConfig();
    return config.ngWordsSkip || [];
  } catch (error) {
    console.error('スキップ用NGワード読み込みエラー:', error);
    return [];
  }
});

// 除去用NGワード設定保存
ipcMain.handle('save-ng-words-remove', async (event, ngWords) => {
  try {
    const config = loadConfig();
    config.ngWordsRemove = Array.isArray(ngWords) ? ngWords : [];
    saveConfig(config);
    console.log(`除去用NGワード保存: ${config.ngWordsRemove.length}件`);
    return { success: true };
  } catch (error) {
    console.error('除去用NGワード保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// 除去用NGワード設定読み込み
ipcMain.handle('load-ng-words-remove', async (event) => {
  try {
    const config = loadConfig();
    return config.ngWordsRemove || [];
  } catch (error) {
    console.error('除去用NGワード読み込みエラー:', error);
    return [];
  }
});

// 名前読み方設定保存
ipcMain.handle('save-name-pronunciations', async (event, pronunciations) => {
  try {
    const config = loadConfig();
    config.namePronunciations = pronunciations || {};
    saveConfig(config);
    console.log(`名前読み方保存: ${Object.keys(config.namePronunciations).length}件`);
    return { success: true };
  } catch (error) {
    console.error('名前読み方保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// 名前読み方設定読み込み
ipcMain.handle('load-name-pronunciations', async (event) => {
  try {
    const config = loadConfig();
    return config.namePronunciations || {};
  } catch (error) {
    console.error('名前読み方読み込みエラー:', error);
    return {};
  }
});

// 読み上げ設定保存
ipcMain.handle('save-reading-settings', async (event, settings) => {
  try {
    const config = loadConfig();
    config.readingSettings = {
      readAllChats: settings.readAllChats !== false, // デフォルトtrue
      chatSpeakerId: settings.chatSpeakerId || 1, // ずんだもん
      komochiSpeakerId: settings.komochiSpeakerId || 3, // こもち用話者
      readUserName: settings.readUserName !== false, // ユーザー名読み上げ
      readTimestamp: settings.readTimestamp === true, // 時刻読み上げ
      ...settings
    };
    saveConfig(config);
    console.log('読み上げ設定保存完了');
    return { success: true };
  } catch (error) {
    console.error('読み上げ設定保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// 読み上げ設定読み込み
ipcMain.handle('load-reading-settings', async (event) => {
  try {
    const config = loadConfig();
    return config.readingSettings || {
      readAllChats: true,
      chatSpeakerId: 1,
      komochiSpeakerId: 3,
      readUserName: true,
      readTimestamp: false
    };
  } catch (error) {
    console.error('読み上げ設定読み込みエラー:', error);
    return {
      readAllChats: true,
      chatSpeakerId: 1,
      komochiSpeakerId: 3,
      readUserName: true,
      readTimestamp: false
    };
  }
});

// 音声キューの状態取得
ipcMain.handle('get-audio-queue-status', async (event) => {
  try {
    const { getAudioQueueStatus } = require('./ai-response');
    return getAudioQueueStatus();
  } catch (error) {
    console.error('音声キュー状態取得エラー:', error);
    return { queueLength: 0, isPlaying: false };
  }
});

// 音声キューのクリア
ipcMain.handle('clear-audio-queue', async (event) => {
  try {
    const { clearAudioQueue } = require('./ai-response');
    clearAudioQueue();
    return { success: true };
  } catch (error) {
    console.error('音声キュークリアエラー:', error);
    return { success: false, error: error.message };
  }
});

// 性格設定保存
ipcMain.handle('save-personality', async (event, personality) => {
  try {
    const config = loadConfig();
    config.personality = personality || '';
    saveConfig(config);
    console.log('性格設定保存完了');
    return { success: true };
  } catch (error) {
    console.error('性格設定保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// 性格設定読み込み
ipcMain.handle('load-personality', async (event) => {
  try {
    const config = loadConfig();
    return config.personality || '';
  } catch (error) {
    console.error('性格設定読み込みエラー:', error);
    return '';
  }
});

// VOICEVOX辞書追加
ipcMain.handle('add-dictionary', async (event, entry) => {
  try {
    const { addDictionary } = require('./ai-response');
    const result = await addDictionary(entry);
    return result;
  } catch (error) {
    console.error('辞書追加エラー:', error);
    return { success: false, error: error.message };
  }
});

// VOICEVOX辞書一覧取得
ipcMain.handle('get-dictionaries', async (event) => {
  try {
    const { getDictionaries } = require('./ai-response');
    const dictionaries = await getDictionaries();
    return dictionaries;
  } catch (error) {
    console.error('辞書一覧取得エラー:', error);
    return [];
  }
});

// VOICEVOX辞書削除
ipcMain.handle('delete-dictionary', async (event, uuid) => {
  try {
    const { deleteDictionary } = require('./ai-response');
    const result = await deleteDictionary(uuid);
    return result;
  } catch (error) {
    console.error('辞書削除エラー:', error);
    return { success: false, error: error.message };
  }
});

// トリガーワード設定の保存
ipcMain.handle('save-trigger-words', async (event, triggerWords) => {
  try {
    const config = loadConfig();
    config.triggerWords = triggerWords || ['こもち'];
    saveConfig(config);
    console.log('トリガーワード設定保存:', triggerWords);
    return { success: true };
  } catch (error) {
    console.error('トリガーワード設定保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// トリガーワード設定の読み込み
ipcMain.handle('get-trigger-words', async () => {
  try {
    const config = loadConfig();
    return config.triggerWords || ['こもち'];
  } catch (error) {
    console.error('トリガーワード設定読み込みエラー:', error);
    return ['こもち'];
  }
});

// 絵文字読み方設定の保存
ipcMain.handle('save-emoji-reading-map', async (event, emojiReadingMap) => {
  try {
    const config = loadConfig();
    config.emojiReadingMap = emojiReadingMap || {};
    saveConfig(config);
    console.log('絵文字読み方設定保存:', Object.keys(emojiReadingMap || {}).length + '件');
    return { success: true };
  } catch (error) {
    console.error('絵文字読み方設定保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// 絵文字読み方設定の読み込み
ipcMain.handle('load-emoji-reading-map', async () => {
  try {
    const config = loadConfig();
    return config.emojiReadingMap || {};
  } catch (error) {
    console.error('絵文字読み方設定読み込みエラー:', error);
    return {};
  }
});

// カスタム絵文字読み方設定の保存
ipcMain.handle('save-emoji-readings', async (event, emojiReadings) => {
  try {
    const config = loadConfig();
    config.emojiReadings = emojiReadings || {};
    saveConfig(config);
    
    console.log('カスタム絵文字読み方設定を保存しました:', Object.keys(emojiReadings).length, '件');
    return { success: true };
  } catch (error) {
    console.error('カスタム絵文字読み方設定保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// カスタム絵文字読み方設定の読み込み
ipcMain.handle('load-emoji-readings', async (event) => {
  try {
    const config = loadConfig();
    return config.emojiReadings || {};
  } catch (error) {
    console.error('カスタム絵文字読み方設定読み込みエラー:', error);
    return {};
  }
});

// VOICEVOXステータスチェック
ipcMain.handle('check-voicevox-status', async (event) => {
  try {
    const { checkVoicevoxStatus } = require('./ai-response');
    const isRunning = await checkVoicevoxStatus();
    return isRunning;
  } catch (error) {
    console.error('VOICEVOXステータスチェックエラー:', error);
    return false;
  }
});

// ===== スパム対策API =====

// スパム統計取得
ipcMain.handle('get-spam-statistics', async () => {
  try {
    const { getSpamStatistics } = require('./ai-response');
    return getSpamStatistics();
  } catch (error) {
    console.error('スパム統計取得エラー:', error);
    return {
      totalUsers: 0,
      usersInCooldown: 0,
      activeUsers: 0,
      topSpammers: [],
      recentActivity: 0
    };
  }
});

// スパム履歴リセット
ipcMain.handle('reset-spam-history', async (event, userName = null) => {
  try {
    const { resetSpamHistory } = require('./ai-response');
    return resetSpamHistory(userName);
  } catch (error) {
    console.error('スパム履歴リセットエラー:', error);
    return `エラー: ${error.message}`;
  }
});

// スパム対策設定保存
ipcMain.handle('save-anti-spam-settings', async (event, settings) => {
  try {
    const config = loadConfig();
    config.antiSpamSettings = settings;
    saveConfig(config);
    
    // 設定をai-response.jsに反映
    const aiResponse = require('./ai-response');
    if (aiResponse.updateSpamConfig) {
      aiResponse.updateSpamConfig(settings);
    }
    
    console.log('スパム対策設定保存:', settings);
    return { success: true };
  } catch (error) {
    console.error('スパム対策設定保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// スパム対策設定読み込み
ipcMain.handle('load-anti-spam-settings', async () => {
  try {
    const config = loadConfig();
    return config.antiSpamSettings || {
      maxMessagesPerMinute: 5,
      maxMessagesPerFiveMinutes: 15,
      duplicateThreshold: 0.8,
      cooldownDuration: 30000
    };
  } catch (error) {
    console.error('スパム対策設定読み込みエラー:', error);
    return null;
  }
});

// NGワードモード設定保存
ipcMain.handle('save-ng-word-mode', async (event, mode) => {
  try {
    const config = loadConfig();
    config.ngWordMode = mode || 'skip';
    saveConfig(config);
    console.log(`NGワードモード保存: ${config.ngWordMode}`);
    return { success: true };
  } catch (error) {
    console.error('NGワードモード保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// NGワードモード設定読み込み
ipcMain.handle('load-ng-word-mode', async (event) => {
  try {
    const config = loadConfig();
    return config.ngWordMode || 'skip';
  } catch (error) {
    console.error('NGワードモード読み込みエラー:', error);
    return 'skip';
  }
});

// ===== 音声設定API =====

// チャット音声設定保存
ipcMain.handle('save-chat-voice-settings', async (event, settings) => {
  try {
    const config = loadConfig();
    config.chatVoiceSettings = {
      volume: settings.volume || 0.5,
      speed: settings.speed || 1.0
    };
    saveConfig(config);
    console.log('チャット音声設定保存:', config.chatVoiceSettings);
    return { success: true };
  } catch (error) {
    console.error('チャット音声設定保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// チャット音声設定読み込み
ipcMain.handle('load-chat-voice-settings', async () => {
  try {
    const config = loadConfig();
    return config.chatVoiceSettings || { volume: 0.5, speed: 1.0 };
  } catch (error) {
    console.error('チャット音声設定読み込みエラー:', error);
    return { volume: 0.5, speed: 1.0 };
  }
});

// こもち音声設定保存
ipcMain.handle('save-komochi-voice-settings', async (event, settings) => {
  try {
    const config = loadConfig();
    config.komochiVoiceSettings = {
      volume: settings.volume || 0.5,
      speed: settings.speed || 1.0
    };
    saveConfig(config);
    console.log('こもち音声設定保存:', config.komochiVoiceSettings);
    return { success: true };
  } catch (error) {
    console.error('こもち音声設定保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// こもち音声設定読み込み
ipcMain.handle('load-komochi-voice-settings', async () => {
  try {
    const config = loadConfig();
    return config.komochiVoiceSettings || { volume: 0.5, speed: 1.0 };
  } catch (error) {
    console.error('こもち音声設定読み込みエラー:', error);
    return { volume: 0.5, speed: 1.0 };
  }
});

// ===== 設定ファイル管理API =====

// 設定フォルダーを開く
ipcMain.handle('open-config-folder', async () => {
  try {
    console.log('===== open-config-folder IPCハンドラー開始 =====');
    const { shell } = require('electron');
    const { spawn } = require('child_process');
    
    console.log('設定ファイルパス:', configPath);
    const configDir = path.dirname(configPath);
    console.log('設定フォルダーパス:', configDir);
    
    // フォルダーが存在するかチェック
    if (!fs.existsSync(configDir)) {
      console.log('設定フォルダーが存在しないため作成します:', configDir);
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // 設定ファイルが存在するかチェック
    if (!fs.existsSync(configPath)) {
      console.log('設定ファイルが存在しないため作成します:', configPath);
      const defaultConfig = loadConfig(); // デフォルト設定を取得
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    }
    
    // Windows環境でのパス調整
    const normalizedPath = path.resolve(configDir);
    const normalizedFilePath = path.resolve(configPath);
    console.log('正規化されたフォルダーパス:', normalizedPath);
    console.log('正規化されたファイルパス:', normalizedFilePath);
    
    // Windows専用の確実な方法
    if (process.platform === 'win32') {
      console.log('Windows環境: explorerコマンドで直接開きます');
      
      // 方法1: ファイルを選択してエクスプローラーを開く
      try {
        console.log('方法1: explorer /select,ファイルパス を試行');
        const selectCommand = `explorer /select,"${normalizedFilePath}"`;
        console.log('実行コマンド:', selectCommand);
        
        const explorerProcess = spawn('explorer', ['/select,', `"${normalizedFilePath}"`], {
          detached: true,
          stdio: 'ignore',
          shell: true
        });
        
        explorerProcess.unref();
        
        // 少し待ってから成功判定
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✅ Windows Explorer (select) 起動完了');
        return { success: true, path: normalizedPath, method: 'explorer-select' };
        
      } catch (explorerError) {
        console.error('Explorer (select) 起動失敗:', explorerError);
      }
      
      // 方法2: フォルダーのみ開く
      try {
        console.log('方法2: explorer フォルダーパス を試行');
        const folderCommand = `explorer "${normalizedPath}"`;
        console.log('実行コマンド:', folderCommand);
        
        const folderProcess = spawn('explorer', [`"${normalizedPath}"`], {
          detached: true,
          stdio: 'ignore',
          shell: true
        });
        
        folderProcess.unref();
        
        // 少し待ってから成功判定
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✅ Windows Explorer (folder) 起動完了');
        return { success: true, path: normalizedPath, method: 'explorer-folder' };
        
      } catch (folderError) {
        console.error('Explorer (folder) 起動失敗:', folderError);
      }
      
      // 方法3: cmd経由で開く
      try {
        console.log('方法3: cmd /c start を試行');
        const cmdCommand = `start "" "${normalizedPath}"`;
        console.log('実行コマンド:', cmdCommand);
        
        const cmdProcess = spawn('cmd', ['/c', 'start', '""', `"${normalizedPath}"`], {
          detached: true,
          stdio: 'ignore',
          shell: true
        });
        
        cmdProcess.unref();
        
        // 少し待ってから成功判定
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✅ CMD start 起動完了');
        return { success: true, path: normalizedPath, method: 'cmd-start' };
        
      } catch (cmdError) {
        console.error('CMD start 起動失敗:', cmdError);
      }
    }
    
    // 通常のElectronの方法を試す
    console.log('方法1: shell.openPath呼び出し開始...');
    const result1 = await shell.openPath(normalizedPath);
    console.log('shell.openPath結果:', result1);
    
    if (result1 === '') {
      console.log('✅ 方法1成功: 設定フォルダーを開きました:', normalizedPath);
      return { success: true, path: normalizedPath, method: 'openPath' };
    }
    
    // 方法2: showItemInFolder
    console.log('方法2: shell.showItemInFolder呼び出し開始...');
    try {
      shell.showItemInFolder(normalizedFilePath);
      console.log('✅ 方法2成功: 設定ファイルをエクスプローラーで表示しました:', normalizedFilePath);
      return { success: true, path: normalizedPath, method: 'showItemInFolder' };
    } catch (error2) {
      console.error('❌ 方法2失敗:', error2);
    }
    
    return { success: false, error: `すべての方法が失敗しました。openPath結果: ${result1}` };
    
  } catch (error) {
    console.error('❌ 設定フォルダーを開くエラー:', error);
    return { success: false, error: error.message };
  }
});

// 設定をエクスポート
ipcMain.handle('export-config', async () => {
  try {
    const { dialog } = require('electron');
    const config = loadConfig();
    
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '設定ファイルをエクスポート',
      defaultPath: `komochi-settings-${new Date().toISOString().split('T')[0]}.json`,
      filters: [
        { name: 'JSON設定ファイル', extensions: ['json'] },
        { name: 'すべてのファイル', extensions: ['*'] }
      ]
    });
    
    if (result.canceled) {
      return { success: false, cancelled: true };
    }
    
    fs.writeFileSync(result.filePath, JSON.stringify(config, null, 2), 'utf8');
    console.log('設定をエクスポートしました:', result.filePath);
    return { success: true, filePath: result.filePath };
    
  } catch (error) {
    console.error('設定エクスポートエラー:', error);
    return { success: false, error: error.message };
  }
});

// 設定をインポート
ipcMain.handle('import-config', async () => {
  try {
    const { dialog } = require('electron');
    
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '設定ファイルをインポート',
      filters: [
        { name: 'JSON設定ファイル', extensions: ['json'] },
        { name: 'すべてのファイル', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (result.canceled) {
      return { success: false, cancelled: true };
    }
    
    const importedConfigData = fs.readFileSync(result.filePaths[0], 'utf8');
    const importedConfig = JSON.parse(importedConfigData);
    
    // 設定ファイルを上書き
    saveConfig(importedConfig);
    
    console.log('設定をインポートしました:', result.filePaths[0]);
    return { success: true, filePath: result.filePaths[0] };
    
  } catch (error) {
    console.error('設定インポートエラー:', error);
    return { success: false, error: error.message };
  }
});

// 設定をリセット
ipcMain.handle('reset-config', async () => {
  try {
    // デフォルト設定
    const defaultConfig = {
      channelUrl: '',
      apiKey: '',
      ngWords: [], // 旧式の互換性維持
      ngWordsSkip: [], // スキップ用NGワード
      ngWordsRemove: [], // 除去用NGワード
      ngWordMode: 'skip',
      namePronunciations: {},
      textReplacements: {}, // チャットテキストの汎用置き換え設定
      chatReplacements: {}, // チャット読み替え設定（単語→単語の置き換え）
      wordSpeakers: {}, // 単語別話者設定（単語→話者ID）
      emojiReadingMap: {},
      triggerWords: ['こもち'],
      personality: '',
      readingSettings: {
        readAllChats: true,
        chatSpeakerId: 1,
        komochiSpeakerId: 3,
        readUserName: true,
        readTimestamp: false
      },
      chatVoiceSettings: {
        volume: 0.5,
        speed: 1.0
      },
      komochiVoiceSettings: {
        volume: 0.5,
        speed: 1.0
      },
      antiSpamSettings: {
        maxMessagesPerMinute: 5,
        maxMessagesPerFiveMinutes: 15,
        duplicateThreshold: 0.8,
        cooldownDuration: 30000
      }
    };
    
    saveConfig(defaultConfig);
    console.log('設定をリセットしました');
    return { success: true };
    
  } catch (error) {
    console.error('設定リセットエラー:', error);
    return { success: false, error: error.message };
  }
});

// 設定ファイルパスを取得
ipcMain.handle('get-config-path', async () => {
  try {
    console.log('===== get-config-path IPCハンドラー開始 =====');
    console.log('設定ファイルパス取得要求:', configPath);
    
    // パスが正しく設定されているかチェック
    if (!configPath) {
      const errorMsg = '設定ファイルパスが設定されていません';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    // フォルダーが存在しない場合は作成
    const configDir = path.dirname(configPath);
    console.log('設定フォルダーチェック:', configDir);
    if (!fs.existsSync(configDir)) {
      console.log('設定フォルダーを作成:', configDir);
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // 設定ファイルが存在しない場合は作成
    console.log('設定ファイルチェック:', configPath);
    if (!fs.existsSync(configPath)) {
      console.log('設定ファイルを作成:', configPath);
      const defaultConfig = loadConfig();
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    }
    
    // 絶対パスに正規化
    const normalizedPath = path.resolve(configPath);
    console.log('正規化された設定ファイルパス:', normalizedPath);
    
    // Windows形式のパスに変換
    const windowsPath = process.platform === 'win32' ? normalizedPath.replace(/\//g, '\\') : normalizedPath;
    console.log('最終パス:', windowsPath);
    
    // ファイルが実際に存在するかチェック
    if (fs.existsSync(windowsPath)) {
      console.log('✅ 設定ファイル確認完了:', windowsPath);
      return windowsPath;
    } else {
      const errorMsg = `設定ファイルが見つかりません: ${windowsPath}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('❌ 設定ファイルパス取得エラー:', error);
    // エラーでもとりあえず予想されるパスを返す
    const fallbackPath = path.join(os.homedir(), '.komochi-chat-config.json');
    console.log('フォールバックパス:', fallbackPath);
    return fallbackPath;
  }
});

// テキスト置き換え設定保存
ipcMain.handle('save-text-replacements', async (event, textReplacements) => {
  try {
    const config = loadConfig();
    config.textReplacements = textReplacements || {};
    saveConfig(config);
    console.log(`テキスト置き換え保存: ${Object.keys(config.textReplacements).length}件`);
    return { success: true };
  } catch (error) {
    console.error('テキスト置き換え保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// テキスト置き換え設定読み込み
ipcMain.handle('load-text-replacements', async (event) => {
  try {
    const config = loadConfig();
    return config.textReplacements || {};
  } catch (error) {
    console.error('テキスト置き換え読み込みエラー:', error);
    return {};
  }
});

// チャット読み替え設定保存
ipcMain.handle('save-chat-replacements', async (event, chatReplacements) => {
  try {
    const config = loadConfig();
    config.chatReplacements = chatReplacements || {};
    saveConfig(config);
    console.log(`チャット読み替え保存: ${Object.keys(config.chatReplacements).length}件`);
    return { success: true };
  } catch (error) {
    console.error('チャット読み替え保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// チャット読み替え設定読み込み
ipcMain.handle('load-chat-replacements', async (event) => {
  try {
    const config = loadConfig();
    return config.chatReplacements || {};
  } catch (error) {
    console.error('チャット読み替え読み込みエラー:', error);
    return {};
  }
});

// 単語別話者設定保存
ipcMain.handle('save-word-speakers', async (event, wordSpeakers) => {
  try {
    const config = loadConfig();
    config.wordSpeakers = wordSpeakers || {};
    saveConfig(config);
    console.log(`単語別話者設定保存: ${Object.keys(config.wordSpeakers).length}件`);
    return { success: true };
  } catch (error) {
    console.error('単語別話者設定保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// 単語別話者設定読み込み
ipcMain.handle('load-word-speakers', async (event) => {
  try {
    const config = loadConfig();
    return config.wordSpeakers || {};
  } catch (error) {
    console.error('単語別話者設定読み込みエラー:', error);
    return {};
  }
});
