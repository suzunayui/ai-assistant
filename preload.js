const { contextBridge, ipcRenderer } = require('electron');

// レンダラープロセスからメインプロセスのAPIにアクセスするための橋渡し
contextBridge.exposeInMainWorld('electronAPI', {
  // ライブ配信のビデオIDを取得
  getLiveVideoId: (channelUrl) => ipcRenderer.invoke('get-live-video-id', channelUrl),
  
  // チャット取得を開始
  startChat: (videoId) => ipcRenderer.invoke('start-chat', videoId),
  
  // チャット取得を停止
  stopChat: () => ipcRenderer.invoke('stop-chat'),
  
  // チャットメッセージを受信
  onChatMessage: (callback) => {
    ipcRenderer.on('chat-message', (event, message) => callback(message));
  },
  
  // チャットメッセージのリスナーを削除
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('chat-message');
  },
  
  // API Key保存
  saveApiKey: (apiKey) => ipcRenderer.invoke('save-api-key', apiKey),
  
  // 設定保存
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // 設定読み込み
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  
  // VOICEVOX話者一覧取得
  getSpeakers: () => ipcRenderer.invoke('get-speakers'),
  
  // VOICEVOXステータスチェック
  checkVoicevoxStatus: () => ipcRenderer.invoke('check-voicevox-status'),
  
  // 音声テスト再生
  testVoice: (speakerId) => ipcRenderer.invoke('test-voice', speakerId),
  
  // チャンネルURL保存
  saveChannelUrl: (channelUrl) => ipcRenderer.invoke('save-channel-url', channelUrl),
  
  // チャンネルURL読み込み
  loadChannelUrl: () => ipcRenderer.invoke('load-channel-url'),
  
  // NGワード設定
  saveNgWords: (ngWords) => ipcRenderer.invoke('save-ng-words', ngWords),
  loadNgWords: () => ipcRenderer.invoke('load-ng-words'),
  saveNgWordMode: (mode) => ipcRenderer.invoke('save-ng-word-mode', mode),
  loadNgWordMode: () => ipcRenderer.invoke('load-ng-word-mode'),
  
  // 新しいNGワード設定（スキップ用と除去用）
  saveNgWordsSkip: (ngWords) => ipcRenderer.invoke('save-ng-words-skip', ngWords),
  loadNgWordsSkip: () => ipcRenderer.invoke('load-ng-words-skip'),
  saveNgWordsRemove: (ngWords) => ipcRenderer.invoke('save-ng-words-remove', ngWords),
  loadNgWordsRemove: () => ipcRenderer.invoke('load-ng-words-remove'),
  
  // 名前読み方設定
  saveNamePronunciations: (pronunciations) => ipcRenderer.invoke('save-name-pronunciations', pronunciations),
  loadNamePronunciations: () => ipcRenderer.invoke('load-name-pronunciations'),
  
  // テキスト置き換え設定
  saveTextReplacements: (textReplacements) => ipcRenderer.invoke('save-text-replacements', textReplacements),
  loadTextReplacements: () => ipcRenderer.invoke('load-text-replacements'),
  
  // 読み上げ設定
  saveReadingSettings: (settings) => ipcRenderer.invoke('save-reading-settings', settings),
  loadReadingSettings: () => ipcRenderer.invoke('load-reading-settings'),
  
  // 音声キュー管理
  getAudioQueueStatus: () => ipcRenderer.invoke('get-audio-queue-status'),
  clearAudioQueue: () => ipcRenderer.invoke('clear-audio-queue'),
  
  // カスタム絵文字読み方設定
  saveEmojiReadings: (emojiReadings) => ipcRenderer.invoke('save-emoji-readings', emojiReadings),
  loadEmojiReadings: () => ipcRenderer.invoke('load-emoji-readings'),
  
  // チャット読み替え設定
  saveChatReplacements: (chatReplacements) => ipcRenderer.invoke('save-chat-replacements', chatReplacements),
  loadChatReplacements: () => ipcRenderer.invoke('load-chat-replacements'),
  
  // 性格設定
  savePersonality: (personality) => ipcRenderer.invoke('save-personality', personality),
  loadPersonality: () => ipcRenderer.invoke('load-personality'),
  
  // VOICEVOX辞書登録
  addDictionary: (entry) => ipcRenderer.invoke('add-dictionary', entry),
  getDictionaries: () => ipcRenderer.invoke('get-dictionaries'),
  deleteDictionary: (uuid) => ipcRenderer.invoke('delete-dictionary', uuid),
  
  // トリガーワード設定
  saveTriggerWords: (triggerWords) => ipcRenderer.invoke('save-trigger-words', triggerWords),
  getTriggerWords: () => ipcRenderer.invoke('get-trigger-words'),
  
  // スパム対策機能
  getSpamStatistics: () => ipcRenderer.invoke('get-spam-statistics'),
  resetSpamHistory: (userName) => ipcRenderer.invoke('reset-spam-history', userName),
  saveAntiSpamSettings: (settings) => ipcRenderer.invoke('save-anti-spam-settings', settings),
  loadAntiSpamSettings: () => ipcRenderer.invoke('load-anti-spam-settings'),
  
  // 音声設定管理
  saveChatVoiceSettings: (settings) => ipcRenderer.invoke('save-chat-voice-settings', settings),
  loadChatVoiceSettings: () => ipcRenderer.invoke('load-chat-voice-settings'),
  saveKomochiVoiceSettings: (settings) => ipcRenderer.invoke('save-komochi-voice-settings', settings),
  loadKomochiVoiceSettings: () => ipcRenderer.invoke('load-komochi-voice-settings'),
  
  // 設定ファイル管理
  openConfigFolder: () => ipcRenderer.invoke('open-config-folder'),
  exportConfig: () => ipcRenderer.invoke('export-config'),
  importConfig: () => ipcRenderer.invoke('import-config'),
  resetConfig: () => ipcRenderer.invoke('reset-config'),
  getConfigPath: () => ipcRenderer.invoke('get-config-path'),

  // 単語別話者設定
  saveWordSpeakers: (wordSpeakers) => ipcRenderer.invoke('save-word-speakers', wordSpeakers),
  loadWordSpeakers: () => ipcRenderer.invoke('load-word-speakers')
});
