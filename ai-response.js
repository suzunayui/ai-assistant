const OpenAI = require('openai');
const axios = require('axios');

// OpenAI クライアントを動的に作成する関数
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is missing or empty');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// VOICEVOX API設定
const VOICEVOX_BASE_URL = 'http://localhost:50021';
const DEFAULT_SPEAKER_ID = 1; // ずんだもん（ノーマル）

/**
 * チャットメッセージがトリガー条件を満たすかチェック
 * @param {string} message メッセージ内容
 * @param {string[]} triggerWords トリガーワード配列
 * @returns {boolean} トリガー条件を満たすか
 */
function shouldRespond(message, triggerWords = ['こもち']) {
  if (!message || !Array.isArray(triggerWords) || triggerWords.length === 0) {
    return false;
  }
  
  const lowerMessage = message.toLowerCase();
  
  // いずれかのトリガーワードが含まれているかチェック（大文字小文字区別なし）
  return triggerWords.some(word => {
    if (!word || !word.trim()) return false;
    
    const trimmedWord = word.trim().toLowerCase();
    
    // 通常のテキストマッチング
    if (lowerMessage.includes(trimmedWord)) {
      return true;
    }
    
    // カスタム絵文字のパターンマッチング
    // :_word_name: や :word: のような形式を検出
    if (trimmedWord.includes(':') || isCustomEmojiPattern(trimmedWord)) {
      return matchCustomEmoji(lowerMessage, trimmedWord);
    }
    
    // 絵文字名のみが指定された場合、カスタム絵文字として検索
    // 例: "komochi" → ":komochi:", ":_komochi:", ":*komochi*:" などにマッチ
    const emojiPatterns = [
      `:${trimmedWord}:`,
      `:_${trimmedWord}:`,
      `:${trimmedWord}_:`,
      `:_${trimmedWord}_:`
    ];
    
    return emojiPatterns.some(pattern => lowerMessage.includes(pattern));
  });
}

/**
 * カスタム絵文字のパターンかどうかをチェック
 * @param {string} word 単語
 * @returns {boolean} カスタム絵文字パターンの場合true
 */
function isCustomEmojiPattern(word) {
  // :で始まり:で終わるパターン
  return /^:[^:]+:$/.test(word);
}

/**
 * カスタム絵文字のマッチング
 * @param {string} message メッセージ
 * @param {string} emojiPattern 絵文字パターン
 * @returns {boolean} マッチした場合true
 */
function matchCustomEmoji(message, emojiPattern) {
  // 完全一致
  if (message.includes(emojiPattern)) {
    return true;
  }
  
  // :で囲まれたパターンの場合、より柔軟にマッチング
  if (emojiPattern.startsWith(':') && emojiPattern.endsWith(':')) {
    const emojiName = emojiPattern.slice(1, -1); // :を除去
    
    // さまざまなカスタム絵文字の命名パターンに対応
    const flexiblePatterns = [
      `:${emojiName}:`,
      `:_${emojiName}:`,
      `:${emojiName}_:`,
      `:_${emojiName}_:`,
      // アンダースコアと文字が混在するパターン
      new RegExp(`:_?[^:]*${emojiName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^:]*_?:`, 'i')
    ];
    
    return flexiblePatterns.some(pattern => {
      if (typeof pattern === 'string') {
        return message.includes(pattern);
      } else {
        return pattern.test(message);
      }
    });
  }
  
  return false;
}

/**
 * OpenAI GPT-4.1-nanoでレスポンスを生成
 * @param {string} userMessage ユーザーのメッセージ
 * @param {string} userName ユーザー名
 * @param {string} personality カスタム性格設定
 * @returns {Promise<string>} 生成されたレスポンス
 */
async function generateResponse(userMessage, userName, personality = '') {
  const maxRetries = 3;
  let lastError;
  
  // API Key チェック
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API Key が設定されていません');
    return `${userName}さん、こもちです！😊 OpenAI API Keyが設定されていないので、AI応答機能を使用できません。設定で API Key を入力してください。`;
  }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`AI応答生成開始 (試行 ${attempt}/${maxRetries}): ${userName}: ${userMessage}`);
      
      // ベースの性格設定
      let systemContent = `あなたは「こもち」という名前の可愛いVTuberアシスタントです。以下の特徴を持ってください：
- 親しみやすく、明るい口調で話す
- 日本語で返答する
- 簡潔で自然な会話を心がける
- YouTubeライブチャットでの返答なので、短めに（50文字以内）
- 絵文字を適度に使う
- 「こもち」と呼ばれたら嬉しそうに反応する`;

      // カスタム性格設定を追加
      if (personality && personality.trim()) {
        systemContent += `\n\n追加の性格設定：\n${personality.trim()}`;
      }
      
      // OpenAI クライアントを動的に取得
      const openai = getOpenAIClient();
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-nano", // 正しいモデル名に変更
        messages: [
          {
            role: "system",
            content: systemContent
          },
          {
            role: "user",
            content: `${userName}さんが「${userMessage}」と言いました。こもちとして返答してください。`
          }
        ],
        max_tokens: 100,
        temperature: 0.8
      });

      const response = completion.choices[0].message.content.trim();
      console.log(`AI応答生成完了: ${response}`);
      return response;
      
    } catch (error) {
      lastError = error;
      console.error(`AI応答生成失敗 (試行 ${attempt}/${maxRetries}):`, error.message);
      
      // 503や429エラーの場合は少し待ってリトライ
      if ((error.status === 503 || error.status === 429) && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 指数バックオフ
        console.log(`${waitTime}ms待機してリトライします...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // その他のエラーまたは最大試行回数に達した場合はループを抜ける
      break;
    }
  }
  
  // 全ての試行が失敗した場合のエラーハンドリング
  console.error('OpenAI API エラー:', lastError);
  console.error('API Key存在確認:', !!process.env.OPENAI_API_KEY);
  console.error('エラー詳細:', {
    message: lastError.message,
    status: lastError.status,
    code: lastError.code,
    type: lastError.type,
    response: lastError.response?.data
  });
  
  // エラー時のフォールバック応答
  let fallbackMessage = `${userName}さん、こもちです！😊`;
  
  if (lastError.status === 401) {
    fallbackMessage += ' API Keyが無効かも...';
  } else if (lastError.status === 429) {
    fallbackMessage += ' ちょっと忙しくて...';
  } else if (lastError.status === 503) {
    fallbackMessage += ' OpenAIサーバーが混雑してるみたい...';
  } else if (lastError.code === 'model_not_found') {
    fallbackMessage += ' モデルが見つからないみたい...';
  } else if (lastError.code === 'ENOTFOUND' || lastError.code === 'ECONNREFUSED') {
    fallbackMessage += ' インターネット接続を確認してね...';
  } else {
    fallbackMessage += ' 今ちょっと調子が悪いみたい...';
  }
  
  return fallbackMessage;
}

/**
 * VOICEVOXでテキストを音声合成
 * @param {string} text 読み上げるテキスト
 * @param {number} speakerId 話者ID
 * @param {Object} voiceSettings 音声設定 {volume: 0.5, speed: 1.0}
 * @returns {Promise<Buffer>} 音声データ
 */
async function synthesizeSpeech(text, speakerId = DEFAULT_SPEAKER_ID, voiceSettings = {}) {
  const maxRetries = 3;
  let lastError;
  
  // デフォルト設定
  const settings = {
    volume: voiceSettings.volume || 0.5,
    speed: voiceSettings.speed || 1.0,
    ...voiceSettings
  };
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`VOICEVOX音声合成開始 (試行 ${attempt}/${maxRetries}): ${text} (音量: ${settings.volume}, 速度: ${settings.speed})`);
      
      // 1. 音声クエリを作成
      const queryResponse = await axios.post(
        `${VOICEVOX_BASE_URL}/audio_query`,
        null,
        {
          params: {
            text: text,
            speaker: speakerId
          },
          timeout: 10000 // 10秒タイムアウト
        }
      );
      
      const audioQuery = queryResponse.data;
      
      // 音声設定を適用
      if (settings.volume !== undefined && settings.volume >= 0 && settings.volume <= 1) {
        audioQuery.volumeScale = settings.volume;
      }
      if (settings.speed !== undefined && settings.speed >= 0.5 && settings.speed <= 2.0) {
        audioQuery.speedScale = settings.speed;
      }
      
      // 2. 音声を合成
      const synthesisResponse = await axios.post(
        `${VOICEVOX_BASE_URL}/synthesis`,
        audioQuery,
        {
          params: {
            speaker: speakerId
          },
          responseType: 'arraybuffer',
          timeout: 30000 // 30秒タイムアウト
        }
      );
      
      console.log('VOICEVOX音声合成完了');
      return Buffer.from(synthesisResponse.data);
      
    } catch (error) {
      lastError = error;
      console.error(`VOICEVOX音声合成失敗 (試行 ${attempt}/${maxRetries}):`, error.message);
      
      // 503や429エラーの場合は少し待ってリトライ
      if ((error.response?.status === 503 || error.response?.status === 429) && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 指数バックオフ
        console.log(`${waitTime}ms待機してリトライします...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // その他のエラーまたは最大試行回数に達した場合はループを抜ける
      break;
    }
  }
  
  // 全ての試行が失敗した場合
  console.error('VOICEVOX API エラー:', lastError);
  console.error('エラー詳細:', {
    message: lastError.message,
    status: lastError.response?.status,
    code: lastError.code,
    response: lastError.response?.data
  });
  
  throw new Error(`音声合成に失敗しました: ${lastError.message}${lastError.response?.status ? ` (HTTP ${lastError.response.status})` : ''}`);
}

/**
 * 音声ファイルを再生（必ずキューを使用）
 * @param {Buffer|string} audioBufferOrText 音声データまたはテキスト
 * @param {string} text 音声のテキスト（ログ用、第一引数がBufferの場合）
 * @param {number} speakerId 話者ID
 */
async function playAudio(audioBufferOrText, text = '', speakerId = DEFAULT_SPEAKER_ID) {
  try {
    // 引数がBufferの場合は一時的にファイルに保存してからキューに追加
    if (Buffer.isBuffer(audioBufferOrText)) {
      // バッファを直接再生する代わりに、警告を出力
      console.warn('playAudio: Bufferの直接再生は非推奨です。キューシステムを使用してください。');
      await playAudioSync(audioBufferOrText);
      return;
    }
    
    // 引数がテキストの場合はキューに追加
    if (typeof audioBufferOrText === 'string' && audioBufferOrText.trim()) {
      addToAudioQueue({
        text: audioBufferOrText,
        speakerId: speakerId
      }); // 優先度なし（自動採番）
      return;
    }
    
    // 古い形式でtextが指定されている場合
    if (text && text.trim()) {
      addToAudioQueue({
        text: text,
        speakerId: speakerId
      }); // 優先度なし（自動採番）
    }
    
  } catch (error) {
    console.error('音声再生エラー:', error);
  }
}

/**
 * 音声をキューに追加して再生
 * @param {string} text 読み上げテキスト
 * @param {number} speakerId 話者ID
 */
async function playAudioQueued(text, speakerId = DEFAULT_SPEAKER_ID) {
  addToAudioQueue({
    text: text,
    speakerId: speakerId
  }); // 優先度なし（自動採番）
}

// 音声読み上げキュー管理
let audioQueue = [];
let isPlayingAudio = false;
let sequenceNumber = 0; // シーケンス番号でキューの順序を保証

/**
 * 音声キューに追加
 * @param {Object} audioItem 音声アイテム
 * @param {number} priority 優先度（小さいほど先に再生）
 */
function addToAudioQueue(audioItem, priority = null) {
  // シーケンス番号を自動採番（優先度が指定されていない場合）
  const sequence = priority !== null ? priority : ++sequenceNumber;
  
  const queueItem = {
    ...audioItem,
    sequence: sequence,
    addedAt: Date.now(),
    voiceSettings: audioItem.voiceSettings || {} // 音声設定を追加
  };
  
  audioQueue.push(queueItem);
  
  // シーケンス番号順でソート（同じ番号の場合は追加時刻順）
  audioQueue.sort((a, b) => {
    if (a.sequence !== b.sequence) {
      return a.sequence - b.sequence;
    }
    return a.addedAt - b.addedAt;
  });
  
  console.log(`音声キューに追加: ${audioItem.text} (シーケンス: ${sequence}, キュー数: ${audioQueue.length})`);
  
  // 再生中でない場合は即座に再生開始
  if (!isPlayingAudio) {
    processAudioQueue();
  }
}

/**
 * 音声キューを処理
 */
async function processAudioQueue() {
  if (isPlayingAudio || audioQueue.length === 0) {
    return;
  }
  
  isPlayingAudio = true;
  
  while (audioQueue.length > 0) {
    const audioItem = audioQueue.shift();
    
    try {
      console.log(`音声再生開始: ${audioItem.text} (残りキュー: ${audioQueue.length})`);
      
      // 音声合成（音声設定を含む）
      const audioBuffer = await synthesizeSpeech(audioItem.text, audioItem.speakerId, audioItem.voiceSettings);
      
      // 音声再生（同期処理）
      await playAudioSync(audioBuffer);
      
      console.log(`音声再生完了: ${audioItem.text}`);
      
      // 次の音声との間隔（重複回避）
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`音声再生エラー: ${audioItem.text}`, error);
      // エラーが発生しても次の音声は再生する
    }
  }
  
  isPlayingAudio = false;
  console.log('音声キュー処理完了');
}

/**
 * 音声キューをクリア
 */
function clearAudioQueue() {
  audioQueue = [];
  sequenceNumber = 0; // シーケンス番号もリセット
  console.log('音声キューをクリアしました');
}

/**
 * 音声ファイルを同期的に再生（再生完了を待つ）
 * @param {Buffer} audioBuffer 音声データ
 */
async function playAudioSync(audioBuffer) {
  return new Promise((resolve, reject) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const { spawn } = require('child_process');
      
      // 一時ファイルとして保存
      const tempDir = require('os').tmpdir();
      const tempFile = path.join(tempDir, `komochi_voice_${Date.now()}.wav`);
      
      fs.writeFileSync(tempFile, audioBuffer);
      
      // Windowsの場合はpowershellで再生
      const player = spawn('powershell', [
        '-Command',
        `(New-Object Media.SoundPlayer "${tempFile}").PlaySync()`
      ]);
      
      player.on('close', (code) => {
        console.log(`音声再生プロセス終了: ${code}`);
        // 一時ファイルを削除
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
          console.warn('一時ファイル削除失敗:', e.message);
        }
        resolve();
      });
      
      player.on('error', (error) => {
        console.error('音声再生エラー:', error);
        reject(error);
      });
      
      // タイムアウト設定（30秒）
      setTimeout(() => {
        player.kill();
        reject(new Error('音声再生タイムアウト'));
      }, 30000);
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * メッセージに含まれる単語に基づいて話者IDを決定
 * @param {string} message チャットメッセージ
 * @param {object} wordSpeakers 単語別話者設定
 * @param {number} defaultSpeakerId デフォルト話者ID
 * @returns {number} 使用する話者ID
 */
function getWordBasedSpeaker(message, wordSpeakers = {}, defaultSpeakerId = 1) {
  if (!message || !wordSpeakers || Object.keys(wordSpeakers).length === 0) {
    return defaultSpeakerId;
  }
  
  const lowerMessage = message.toLowerCase();
  
  // 単語の長さでソート（長い単語を優先して検索）
  const sortedWords = Object.keys(wordSpeakers).sort((a, b) => b.length - a.length);
  
  for (const word of sortedWords) {
    if (word && word.trim() && lowerMessage.includes(word.toLowerCase())) {
      const speakerId = parseInt(wordSpeakers[word]);
      if (!isNaN(speakerId) && speakerId > 0) {
        console.log(`単語「${word}」検出 - 話者ID ${speakerId} を使用`);
        return speakerId;
      }
    }
  }
  
  return defaultSpeakerId;
}

/**
 * メインの処理：全チャット読み上げ→「こもち」への応答（順序保証）
 * @param {string} message チャットメッセージ
 * @param {string} userName ユーザー名
 * @param {function} onResponse 応答コールバック
 * @param {object} settings アプリケーション設定
 */
async function processMessage(message, userName, onResponse, settings = {}) {
  try {
    // ボットユーザーのチェック
    if (isBotUser(userName)) {
      console.log(`ボットユーザーをスキップ: ${userName}`);
      return; // ボットの場合は処理を終了
    }
    
    // この処理のベースシーケンス番号を確保（同一処理内での順序保証）
    const baseSequence = ++sequenceNumber;
    
    // 1. まず全チャット読み上げをキューに追加（同期的に処理、優先順位1番目）
    if (settings.readAllChats !== false) {
      // 読み上げテキスト生成（新しいNGワード設定を含む）
      const readingText = generateChatReadingText(userName, message, {
        readUserName: settings.readUserName,
        readTimestamp: settings.readTimestamp,
        ngWordsSkip: settings.ngWordsSkip || [],
        ngWordsRemove: settings.ngWordsRemove || [],
        namePronounciation: settings.namePronunciations || {},
        textReplacements: settings.chatReplacements || {},
        emojiReadingMap: settings.emojiReadingMap || {}
      });
      
      // 読み上げテキストが生成された場合のみキューに追加
      if (readingText && readingText.trim()) {
        console.log(`チャット読み上げ: ${readingText}`);
        
        // 単語別話者設定に基づいて話者IDを決定
        const baseSpeakerId = settings.chatSpeakerId || 1;
        const finalSpeakerId = getWordBasedSpeaker(message, settings.wordSpeakers || {}, baseSpeakerId);
        
        // 音声をキューに追加（優先順位: baseSequence）
        addToAudioQueue({
          text: readingText,
          speakerId: finalSpeakerId,
          voiceSettings: {
            volume: settings.chatVolume || 0.5,
            speed: settings.chatSpeed || 1.0
          }
        }, baseSequence);
      } else {
        console.log(`読み上げテキストが空のためスキップ: ${userName}: ${message}`);
      }
    }
    
    // 2. トリガーワードチェック
    const triggerWords = settings.triggerWords || ['こもち'];
    if (!shouldRespond(message, triggerWords)) {
      return; // トリガーワードへの言及がない場合は読み上げのみで終了
    }
    
    console.log(`トリガーワード発動: ${userName}: ${message} (検出ワード: ${triggerWords.join(', ')})`);
    
    // 3. AI応答を生成（この間に全チャット読み上げはキューに追加済み）
    const aiResponse = await generateResponse(message, userName, settings.personality);
    
    // 4. UIに応答を表示
    onResponse({
      author: 'こもち',
      message: aiResponse,
      timestamp: new Date().toLocaleTimeString(),
      type: 'ai-response'
    });
    
    // 5. こもちの音声読み上げ（キューに追加、必ず全チャット読み上げの後になる、優先順位2番目）
    if (settings.voiceEnabled !== false) {
      try {
        // こもち用話者IDを取得
        const komochiSpeakerId = settings.komochiSpeakerId || settings.speakerId || DEFAULT_SPEAKER_ID;
        
        // 単語別話者設定を考慮して話者IDを決定
        const finalSpeakerId = getWordBasedSpeaker(message, settings.wordSpeakers, komochiSpeakerId);
        
        // こもちの応答をキューに追加（優先順位: baseSequence + 0.5、全チャット読み上げの後になる）
        addToAudioQueue({
          text: aiResponse,
          speakerId: finalSpeakerId,
          voiceSettings: {
            volume: settings.komochiVolume || 0.5,
            speed: settings.komochiSpeed || 1.0
          }
        }, baseSequence + 0.5);
        
      } catch (voiceError) {
        console.warn('こもち音声キュー追加エラー:', voiceError);
        // 音声エラーでもAI応答は表示済みなので続行
      }
    }
    
  } catch (error) {
    console.error('メッセージ処理エラー:', error);
    console.error('エラースタック:', error.stack);
    console.error('設定:', JSON.stringify(settings, null, 2));
    onResponse({
      author: 'システム',
      message: `処理エラー: ${error.message}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'error'
    });
  }
}

/**
 * ボットユーザーかどうかをチェック
 * @param {string} userName ユーザー名
 * @returns {boolean} ボットの場合true
 */
function isBotUser(userName) {
  if (!userName || typeof userName !== 'string') {
    return false;
  }
  
  const botPatterns = [
    /^nightbot$/i,           // Nightbot
    /^streamlabs$/i,         // StreamLabs
    /^moobot$/i,             // Moobot
    /^fossabot$/i,           // Fossabot
    /^wizebot$/i,            // Wizebot
    /^pretzelrocks$/i,       // PretzelRocks
    /^streamelements$/i,     // StreamElements
    /bot$/i,                 // 末尾にbotが付くもの
    /^.+bot.+$/i             // botを含むもの
  ];
  
  return botPatterns.some(pattern => pattern.test(userName.trim()));
}

/**
 * カスタム絵文字を読み方に変換
 * @param {string} text 変換対象のテキスト
 * @param {Object} emojiReadingMap 絵文字読み方辞書 {':_omotiKomochi:': 'こもち'}
 * @returns {string} 変換後のテキスト
 */
function convertCustomEmojiToReading(text, emojiReadingMap = {}) {
  if (!text || !emojiReadingMap || Object.keys(emojiReadingMap).length === 0) {
    return text;
  }
  
  let convertedText = text;
  
  // 絵文字読み方辞書から変換
  for (const [emoji, reading] of Object.entries(emojiReadingMap)) {
    if (emoji && reading && emoji.trim() && reading.trim()) {
      // 大文字小文字を区別しない置換
      const regex = new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      convertedText = convertedText.replace(regex, reading.trim());
    }
  }
  
  // デフォルトのカスタム絵文字パターンを読み方に変換
  // :_word: や :word: の形式を単語として抽出
  convertedText = convertedText.replace(/:([a-zA-Z0-9_]+):/g, (match, word) => {
    // アンダースコアを除去して単語を抽出
    const cleanWord = word.replace(/^_+|_+$/g, '').replace(/_+/g, '');
    
    // 特定の単語パターンに対応
    const commonEmojiReadings = {
      'komochi': 'こもち',
      'omoti': 'おもち',
      'omochi': 'おもち',
      'mochi': 'もち',
      'heart': 'ハート',
      'love': 'ラブ',
      'smile': 'スマイル',
      'happy': 'ハッピー',
      'sad': 'サッド',
      'angry': 'アングリー',
      'laugh': 'ラフ',
      'cry': 'クライ'
    };
    
    // 辞書にある場合は変換、ない場合はそのまま
    return commonEmojiReadings[cleanWord.toLowerCase()] || cleanWord;
  });
  
  return convertedText;
}

/**
 * NGワードが含まれているかチェック
 * @param {string} text 対象テキスト
 * @param {string[]} ngWords NGワード配列
 * @returns {boolean} NGワードが含まれている場合true
 */
function containsNgWords(text, ngWords = []) {
  if (!text || !Array.isArray(ngWords) || ngWords.length === 0) {
    return false;
  }
  
  const lowerText = text.toLowerCase();
  
  for (const ngWord of ngWords) {
    if (ngWord && ngWord.trim()) {
      // NGワードが含まれているかチェック（大文字小文字区別なし）
      if (lowerText.includes(ngWord.trim().toLowerCase())) {
        console.log(`NGワード検出: "${ngWord.trim()}" in "${text}"`);
        return true;
      }
    }
  }
  
  return false;
}

/**
 * NGワード処理（2つのモードを統合処理）
 * @param {string} text 対象テキスト
 * @param {string[]} ngWordsSkip スキップ用NGワード配列
 * @param {string[]} ngWordsRemove 除去用NGワード配列
 * @returns {Object} {shouldSkip: boolean, processedText: string}
 */
function processNgWords(text, ngWordsSkip = [], ngWordsRemove = []) {
  if (!text) {
    return { shouldSkip: false, processedText: text };
  }
  
  // 1. まずスキップ用NGワードをチェック
  if (containsNgWords(text, ngWordsSkip)) {
    const matchedSkipWord = findMatchedNgWord(text, ngWordsSkip);
    console.log(`スキップ用NGワード検出のため全体をスキップ: "${matchedSkipWord}" in "${text}"`);
    return { shouldSkip: true, processedText: '' };
  }
  
  // 2. 除去用NGワードを処理
  if (ngWordsRemove.length > 0) {
    let processedText = text;
    let hasRemovedWords = false;
    
    for (const ngWord of ngWordsRemove) {
      if (ngWord && ngWord.trim()) {
        const regex = new RegExp(ngWord.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        if (processedText.match(regex)) {
          processedText = processedText.replace(regex, '***');
          hasRemovedWords = true;
        }
      }
    }
    
    if (hasRemovedWords) {
      console.log(`除去用NGワード処理: "${text}" → "${processedText}"`);
    }
    
    return { shouldSkip: false, processedText: processedText.trim() };
  }
  
  // NGワードが見つからなかった場合はそのまま
  return { shouldSkip: false, processedText: text };
}

/**
 * NGワードが含まれているかチェック（最初にマッチしたワードを返す）
 * @param {string} text 対象テキスト
 * @param {string[]} ngWords NGワード配列
 * @returns {string|null} マッチしたNGワード、なければnull
 */
function findMatchedNgWord(text, ngWords = []) {
  if (!text || !Array.isArray(ngWords) || ngWords.length === 0) {
    return null;
  }
  
  const lowerText = text.toLowerCase();
  
  for (const ngWord of ngWords) {
    if (ngWord && ngWord.trim()) {
      if (lowerText.includes(ngWord.trim().toLowerCase())) {
        return ngWord.trim();
      }
    }
  }
  
  return null;
}

/**
 * NGワードを除去（旧関数、互換性のため残す）
 * @param {string} text 対象テキスト
 * @param {string[]} ngWords NGワード配列
 * @returns {string} NGワード除去後のテキスト
 */
function removeNgWords(text, ngWords = []) {
  if (!text || !Array.isArray(ngWords) || ngWords.length === 0) {
    return text;
  }
  
  let cleanText = text;
  for (const ngWord of ngWords) {
    if (ngWord && ngWord.trim()) {
      // NGワードが含まれていたら削除（大文字小文字区別なし）
      const regex = new RegExp(ngWord.trim(), 'gi');
      cleanText = cleanText.replace(regex, '');
    }
  }
  
  return cleanText.trim();
}

/**
 * ユーザー名の読み方を変換
 * @param {string} userName ユーザー名
 * @param {Object} namePronounciation 名前読み方辞書
 * @returns {string} 変換後のユーザー名
 */
function convertUserNamePronunciation(userName, namePronounciation = {}) {
  if (!userName || !namePronounciation) {
    return userName;
  }
  
  // 完全一致で変換
  if (namePronounciation[userName]) {
    return namePronounciation[userName];
  }
  
  return userName;
}

/**
 * チャットテキストの汎用置き換え処理
 * @param {string} text 置き換え対象のテキスト
 * @param {Object} textReplacements 置き換え辞書
 * @returns {string} 置き換え後のテキスト
 */
function applyTextReplacements(text, textReplacements = {}) {
  if (!text || !textReplacements || Object.keys(textReplacements).length === 0) {
    return text;
  }
  
  let replacedText = text;
  
  // 置き換え辞書の各項目を順次適用
  for (const [searchText, replaceText] of Object.entries(textReplacements)) {
    if (searchText && searchText.trim() !== '') {
      // 正規表現エスケープして部分一致で置き換え
      const escapedSearch = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedSearch, 'gi'); // 大文字小文字を区別しない
      replacedText = replacedText.replace(regex, replaceText || '');
    }
  }
  
  return replacedText;
}

/**
 * チャット読み上げテキストを生成
 * @param {string} userName ユーザー名
 * @param {string} message メッセージ
 * @param {Object} options オプション
 * @returns {string} 読み上げテキスト
 */
function generateChatReadingText(userName, message, options = {}) {
  const {
    readUserName = true,
    readTimestamp = false,
    ngWordsSkip = [],
    ngWordsRemove = [],
    namePronounciation = {},
    textReplacements = {},
    emojiReadingMap = {}
  } = options;
  
  // NGワード処理（2つのモードを統合）
  const ngResult = processNgWords(message, ngWordsSkip, ngWordsRemove);
  
  if (ngResult.shouldSkip) {
    console.log(`NGワード含有のため読み上げテキスト生成をスキップ: ${message}`);
    return '';
  }
  
  let readingText = '';
  
  // ユーザー名を読み上げる場合
  if (readUserName && userName) {
    const convertedUserName = convertUserNamePronunciation(userName, namePronounciation);
    readingText += `${convertedUserName}さん、`;
  }
  
  // メッセージ処理（NGワード処理済みのテキストを使用）
  if (ngResult.processedText) {
    // 1. テキスト置き換えを適用
    let processedMessage = applyTextReplacements(ngResult.processedText, textReplacements);
    
    // 2. カスタム絵文字を読み方に変換
    const convertedMessage = convertCustomEmojiToReading(processedMessage, emojiReadingMap);
    readingText += convertedMessage;
  }
  
  // タイムスタンプを読み上げる場合（実装は省略、必要に応じて追加）
  if (readTimestamp) {
    // タイムスタンプの読み上げは通常不要なので省略
  }
  
  return readingText.trim();
}

/**
 * VOICEVOXが起動しているかチェック
 */
async function checkVoicevoxStatus() {
  const maxRetries = 2;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(`${VOICEVOX_BASE_URL}/version`, {
        timeout: 5000 // 5秒タイムアウト
      });
      console.log(`VOICEVOX接続確認: ${response.data}`);
      return true;
    } catch (error) {
      lastError = error;
      console.error(`VOICEVOX接続失敗 (試行 ${attempt}/${maxRetries}):`, error.message);
      
      // 503エラーの場合は少し待ってリトライ
      if (error.response?.status === 503 && attempt < maxRetries) {
        const waitTime = 2000; // 2秒待機
        console.log(`${waitTime}ms待機してリトライします...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // その他のエラーまたは最大試行回数に達した場合はループを抜ける
      break;
    }
  }
  
  console.error('VOICEVOX接続失敗:', lastError.message);
  return false;
}

/**
 * 利用可能な話者リストを取得
 */
async function getSpeakers() {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`VOICEVOX話者一覧取得開始 (試行 ${attempt}/${maxRetries})`);
      const response = await axios.get(`${VOICEVOX_BASE_URL}/speakers`, {
        timeout: 10000 // 10秒タイムアウト
      });
      console.log('VOICEVOX話者一覧取得完了');
      return response.data;
    } catch (error) {
      lastError = error;
      console.error(`VOICEVOX話者一覧取得失敗 (試行 ${attempt}/${maxRetries}):`, error.message);
      
      // 503や429エラーの場合は少し待ってリトライ
      if ((error.response?.status === 503 || error.response?.status === 429) && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 指数バックオフ
        console.log(`${waitTime}ms待機してリトライします...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // その他のエラーまたは最大試行回数に達した場合はループを抜ける
      break;
    }
  }
  
  console.error('話者リスト取得エラー:', lastError);
  return [];
}

/**
 * VOICEVOX辞書に単語を追加
 * @param {Object} entry 辞書エントリ
 * @returns {Promise<Object>} 結果
 */
async function addDictionary(entry) {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`VOICEVOX辞書追加開始 (試行 ${attempt}/${maxRetries}): ${entry.surface} → ${entry.reading} (品詞: ${entry.partOfSpeech})`);
      
      // 入力値の妥当性チェック
      if (!entry.surface || !entry.reading) {
        throw new Error('表記と読み方は必須です');
      }
      
      if (entry.surface.trim() === '' || entry.reading.trim() === '') {
        throw new Error('表記と読み方は空文字列にできません');
      }
      
      // 読み方がカタカナかチェック
      const katakanaRegex = /^[ァ-ヶー]+$/;
      if (!katakanaRegex.test(entry.reading)) {
        console.warn('読み方がカタカナではありません:', entry.reading);
        // カタカナ以外でも処理を続行（警告のみ）
      }
      
      // 品詞の変換マップ（UIの表示名→VOICEVOX API）
      const wordTypeMap = {
        '固有名詞': 'PROPER_NOUN',
        '名詞': 'COMMON_NOUN',
        '普通名詞': 'COMMON_NOUN',
        '動詞': 'VERB',
        '形容詞': 'ADJECTIVE',
        '語尾': 'SUFFIX',
        'PROPER_NOUN': 'PROPER_NOUN',
        'COMMON_NOUN': 'COMMON_NOUN',
        'VERB': 'VERB',
        'ADJECTIVE': 'ADJECTIVE',
        'SUFFIX': 'SUFFIX'
      };
      
      // 品詞をVOICEVOX APIの形式に変換
      const wordType = wordTypeMap[entry.partOfSpeech] || 'COMMON_NOUN';
      
      // クエリパラメータを準備
      const params = {
        surface: entry.surface.trim(),
        pronunciation: entry.reading.trim(),
        accent_type: 1, // デフォルトのアクセント型
        word_type: wordType,
        priority: 5 // デフォルトの優先度（1-9推奨）
      };
      console.log('リクエストパラメータ:', JSON.stringify(params, null, 2));
      
      const response = await axios.post(
        `${VOICEVOX_BASE_URL}/user_dict_word`,
        null, // ボディは空
        {
          params: params, // クエリパラメータとして送信
          timeout: 10000, // 10秒タイムアウト
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('VOICEVOX辞書追加完了');
      return { success: true, uuid: response.data };
      
    } catch (error) {
      lastError = error;
      console.error(`VOICEVOX辞書追加失敗 (試行 ${attempt}/${maxRetries}):`, error.message);
      
      // エラーレスポンスの詳細を出力
      if (error.response) {
        console.error('エラーレスポンス:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // 422エラーの場合は詳細な対処方法を提案
        if (error.response.status === 422) {
          console.error('422エラー: リクエストパラメータが正しくありません');
          console.error('送信したパラメータ:', JSON.stringify(params, null, 2));
          console.error('VOICEVOXが受け入れるword_typeの例: PROPER_NOUN, COMMON_NOUN, VERB, ADJECTIVE, SUFFIX');
        }
      }
      
      // 503や429エラーの場合は少し待ってリトライ
      if ((error.response?.status === 503 || error.response?.status === 429) && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 指数バックオフ
        console.log(`${waitTime}ms待機してリトライします...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // その他のエラーまたは最大試行回数に達した場合はループを抜ける
      break;
    }
  }
  
  // 全ての試行が失敗した場合
  console.error('VOICEVOX辞書追加エラー:', lastError);
  return {
    success: false,
    error: `辞書追加に失敗しました: ${lastError.message}${lastError.response?.status ? ` (HTTP ${lastError.response.status})` : ''}`
  };
}

/**
 * VOICEVOX辞書一覧を取得
 * @returns {Promise<Array>} 辞書一覧
 */
async function getDictionaries() {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`VOICEVOX辞書一覧取得開始 (試行 ${attempt}/${maxRetries})`);
      
      const response = await axios.get(`${VOICEVOX_BASE_URL}/user_dict`, {
        timeout: 10000 // 10秒タイムアウト
      });
      
      console.log('VOICEVOX辞書一覧取得完了');
      
      // レスポンスをUIで使いやすい形式に変換
      const dictionaries = Object.entries(response.data).map(([uuid, entry]) => ({
        uuid,
        surface: entry.surface,
        reading: entry.pronunciation,
        partOfSpeech: entry.part_of_speech
      }));
      
      return dictionaries;
      
    } catch (error) {
      lastError = error;
      console.error(`VOICEVOX辞書一覧取得失敗 (試行 ${attempt}/${maxRetries}):`, error.message);
      
      // 503や429エラーの場合は少し待ってリトライ
      if ((error.response?.status === 503 || error.response?.status === 429) && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 指数バックオフ
        console.log(`${waitTime}ms待機してリトライします...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // その他のエラーまたは最大試行回数に達した場合はループを抜ける
      break;
    }
  }
  
  console.error('VOICEVOX辞書一覧取得エラー:', lastError);
  return [];
}

/**
 * VOICEVOX辞書から単語を削除
 * @param {string} uuid 辞書エントリのUUID
 * @returns {Promise<Object>} 結果
 */
async function deleteDictionary(uuid) {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`VOICEVOX辞書削除開始 (試行 ${attempt}/${maxRetries}): ${uuid}`);
      
      await axios.delete(`${VOICEVOX_BASE_URL}/user_dict_word`, {
        params: { word_uuid: uuid },
        timeout: 10000 // 10秒タイムアウト
      });
      
      console.log('VOICEVOX辞書削除完了');
      return { success: true };
      
    } catch (error) {
      lastError = error;
      console.error(`VOICEVOX辞書削除失敗 (試行 ${attempt}/${maxRetries}):`, error.message);
      
      // 503や429エラーの場合は少し待ってリトライ
      if ((error.response?.status === 503 || error.response?.status === 429) && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 指数バックオフ
        console.log(`${waitTime}ms待機してリトライします...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // その他のエラーまたは最大試行回数に達した場合はループを抜ける
      break;
    }
  }
  
  // 全ての試行が失敗した場合
  console.error('VOICEVOX辞書削除エラー:', lastError);
  return {
    success: false,
    error: `辞書削除に失敗しました: ${lastError.message}${lastError.response?.status ? ` (HTTP ${lastError.response.status})` : ''}`
  };
}

/**
 * チャットメッセージを読み上げ
 * @param {string} text 読み上げテキスト
 * @param {number} speakerId 話者ID
 * @param {string} userName ユーザー名（ボットチェック用、省略可能）
 */
async function readChatMessage(text, speakerId = DEFAULT_SPEAKER_ID, userName = null) {
  if (!text || !text.trim()) {
    return;
  }
  
  // ボットユーザーの場合はスキップ
  if (userName && isBotUser(userName)) {
    console.log(`ボットユーザーの読み上げをスキップ: ${userName}`);
    return;
  }
  
  addToAudioQueue({
    text: text.trim(),
    speakerId: speakerId
  });
}

/**
 * VOICEVOX辞書の利用可能な品詞一覧を取得
 * @returns {Promise<Array>} 品詞一覧
 */
async function getDictionaryPartOfSpeech() {
  try {
    console.log('VOICEVOX品詞一覧取得開始');
    
    const response = await axios.get(`${VOICEVOX_BASE_URL}/part_of_speech`, {
      timeout: 5000 // 5秒タイムアウト
    });
    
    console.log('VOICEVOX品詞一覧取得完了:', response.data);
    return response.data;
    
  } catch (error) {
    console.warn('品詞一覧取得失敗（エンドポイントが存在しない可能性）:', error.message);
    // デフォルトの品詞一覧を返す（VOICEVOX APIの仕様に合わせて）
    return [
      { value: 'PROPER_NOUN', label: '固有名詞' },
      { value: 'COMMON_NOUN', label: '普通名詞' },
      { value: 'VERB', label: '動詞' },
      { value: 'ADJECTIVE', label: '形容詞' },
      { value: 'SUFFIX', label: '語尾' }
    ];
  }
}

// 連投荒らし対策システム
let userMessageHistory = new Map(); // ユーザー別のメッセージ履歴
const SPAM_DETECTION_CONFIG = {
  maxMessagesPerMinute: 5,     // 1分間の最大メッセージ数
  maxMessagesPerFiveMinutes: 15, // 5分間の最大メッセージ数
  duplicateThreshold: 0.8,     // 重複判定の類似度閾値（0-1）
  cooldownDuration: 30000,     // クールダウン時間（30秒）
  historyRetentionTime: 300000 // 履歴保持時間（5分）
};

/**
 * ユーザーのメッセージ履歴を取得または作成
 * @param {string} userName ユーザー名
 * @returns {Object} ユーザー履歴オブジェクト
 */
function getUserHistory(userName) {
  if (!userMessageHistory.has(userName)) {
    userMessageHistory.set(userName, {
      messages: [],
      lastMessageTime: 0,
      isInCooldown: false,
      cooldownUntil: 0,
      spamCount: 0
    });
  }
  return userMessageHistory.get(userName);
}

/**
 * 文字列の類似度を計算（Levenshtein距離ベース）
 * @param {string} str1 文字列1
 * @param {string} str2 文字列2
 * @returns {number} 類似度（0-1、1が完全一致）
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  
  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);
  
  if (maxLen === 0) return 1;
  
  // 簡易的なLevenshtein距離計算
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
  
  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // 挿入
        matrix[j - 1][i] + 1,     // 削除
        matrix[j - 1][i - 1] + cost // 置換
      );
    }
  }
  
  const distance = matrix[len2][len1];
  return 1 - (distance / maxLen);
}

/**
 * スパムメッセージかどうかをチェック
 * @param {string} userName ユーザー名
 * @param {string} message メッセージ内容
 * @returns {Object} {isSpam: boolean, reason: string}
 */
function isSpamMessage(userName, message) {
  const now = Date.now();
  const userHistory = getUserHistory(userName);
  
  // クールダウン中かチェック
  if (userHistory.isInCooldown && now < userHistory.cooldownUntil) {
    const remainingTime = Math.ceil((userHistory.cooldownUntil - now) / 1000);
    return {
      isSpam: true,
      reason: `クールダウン中（残り${remainingTime}秒）`
    };
  }
  
  // クールダウンが終了した場合はリセット
  if (userHistory.isInCooldown && now >= userHistory.cooldownUntil) {
    userHistory.isInCooldown = false;
    userHistory.cooldownUntil = 0;
    console.log(`${userName} のクールダウンが終了しました`);
  }
  
  // 古い履歴を削除（5分以上前のメッセージ）
  const cutoffTime = now - SPAM_DETECTION_CONFIG.historyRetentionTime;
  userHistory.messages = userHistory.messages.filter(msg => msg.timestamp > cutoffTime);
  
  // レート制限チェック（1分間）
  const oneMinuteAgo = now - 60000;
  const recentMessages = userHistory.messages.filter(msg => msg.timestamp > oneMinuteAgo);
  if (recentMessages.length >= SPAM_DETECTION_CONFIG.maxMessagesPerMinute) {
    return {
      isSpam: true,
      reason: `1分間のメッセージ制限超過（${recentMessages.length}/${SPAM_DETECTION_CONFIG.maxMessagesPerMinute}）`
    };
  }
  
  // レート制限チェック（5分間）
  if (userHistory.messages.length >= SPAM_DETECTION_CONFIG.maxMessagesPerFiveMinutes) {
    return {
      isSpam: true,
      reason: `5分間のメッセージ制限超過（${userHistory.messages.length}/${SPAM_DETECTION_CONFIG.maxMessagesPerFiveMinutes}）`
    };
  }
  
  // 重複・類似メッセージチェック
  const normalizedMessage = message.toLowerCase().trim();
  for (const historyMsg of userHistory.messages) {
    const similarity = calculateSimilarity(normalizedMessage, historyMsg.content.toLowerCase().trim());
    if (similarity >= SPAM_DETECTION_CONFIG.duplicateThreshold) {
      return {
        isSpam: true,
        reason: `類似メッセージ検出（類似度: ${Math.round(similarity * 100)}%）`
      };
    }
  }
  
  // 正常なメッセージの場合は履歴に追加
  userHistory.messages.push({
    content: message,
    timestamp: now
  });
  userHistory.lastMessageTime = now;
  
  return { isSpam: false, reason: null };
}

/**
 * ユーザーをクールダウン状態にする
 * @param {string} userName ユーザー名
 * @param {number} duration クールダウン時間（ミリ秒、省略時はデフォルト）
 */
function setCooldown(userName, duration = SPAM_DETECTION_CONFIG.cooldownDuration) {
  const userHistory = getUserHistory(userName);
  const now = Date.now();
  
  userHistory.isInCooldown = true;
  userHistory.cooldownUntil = now + duration;
  userHistory.spamCount++;
  
  console.log(`${userName} をクールダウンしました（${duration/1000}秒間、累計違反: ${userHistory.spamCount}回）`);
}

/**
 * 管理者用：ユーザーのスパム履歴をリセット
 * @param {string} userName ユーザー名（省略時は全ユーザー）
 */
function resetSpamHistory(userName = null) {
  if (userName) {
    if (userMessageHistory.has(userName)) {
      userMessageHistory.delete(userName);
      console.log(`${userName} のスパム履歴をリセットしました`);
      return `${userName} のスパム履歴をリセットしました`;
    } else {
      return `${userName} の履歴が見つかりません`;
    }
  } else {
    const userCount = userMessageHistory.size;
    userMessageHistory.clear();
    console.log(`全ユーザー（${userCount}人）のスパム履歴をリセットしました`);
    return `全ユーザー（${userCount}人）のスパム履歴をリセットしました`;
  }
}

/**
 * 管理者用：スパム統計情報を取得
 * @returns {Object} 統計情報
 */
function getSpamStatistics() {
  const now = Date.now();
  const stats = {
    totalUsers: userMessageHistory.size,
    usersInCooldown: 0,
    activeUsers: 0,
    topSpammers: [],
    recentActivity: 0
  };
  
  const spammerList = [];
  const fiveMinutesAgo = now - 300000;
  
  for (const [userName, history] of userMessageHistory.entries()) {
    // クールダウン中のユーザー数
    if (history.isInCooldown && now < history.cooldownUntil) {
      stats.usersInCooldown++;
    }
    
    // 最近のアクティブユーザー数
    if (history.lastMessageTime > fiveMinutesAgo) {
      stats.activeUsers++;
    }
    
    // スパム違反回数の統計
    if (history.spamCount > 0) {
      spammerList.push({
        userName,
        spamCount: history.spamCount,
        lastMessage: new Date(history.lastMessageTime).toLocaleTimeString(),
        isInCooldown: history.isInCooldown && now < history.cooldownUntil
      });
    }
    
    // 最近のアクティビティ
    stats.recentActivity += history.messages.filter(msg => msg.timestamp > fiveMinutesAgo).length;
  }
  
  // スパム回数でソートしてトップ5を取得
  stats.topSpammers = spammerList
    .sort((a, b) => b.spamCount - a.spamCount)
    .slice(0, 5);
  
  return stats;
}

/**
 * スパム対策設定を更新
 * @param {Object} newConfig 新しい設定
 */
function updateSpamConfig(newConfig) {
  if (newConfig.maxMessagesPerMinute) {
    SPAM_DETECTION_CONFIG.maxMessagesPerMinute = newConfig.maxMessagesPerMinute;
  }
  if (newConfig.maxMessagesPerFiveMinutes) {
    SPAM_DETECTION_CONFIG.maxMessagesPerFiveMinutes = newConfig.maxMessagesPerFiveMinutes;
  }
  if (newConfig.duplicateThreshold) {
    SPAM_DETECTION_CONFIG.duplicateThreshold = newConfig.duplicateThreshold;
  }
  if (newConfig.cooldownDuration) {
    SPAM_DETECTION_CONFIG.cooldownDuration = newConfig.cooldownDuration;
  }
  
  console.log('スパム対策設定を更新:', SPAM_DETECTION_CONFIG);
}

module.exports = {
  processMessage,
  shouldRespond,
  generateResponse,
  synthesizeSpeech,
  playAudio,
  playAudioQueued,
  addToAudioQueue,
  clearAudioQueue,
  checkVoicevoxStatus,
  getSpeakers,
  removeNgWords,
  containsNgWords, // NGワード含有チェック機能
  processNgWords, // NGワード処理機能（2つのモード統合対応）
  findMatchedNgWord, // マッチしたNGワードを特定する機能
  convertUserNamePronunciation,
  generateChatReadingText,
  readChatMessage,
  addDictionary,
  getDictionaries,
  deleteDictionary,
  getDictionaryPartOfSpeech,
  isBotUser, // ボットチェック機能
  isCustomEmojiPattern, // カスタム絵文字パターンチェック
  matchCustomEmoji, // カスタム絵文字マッチング
  convertCustomEmojiToReading, // カスタム絵文字読み方変換
  getWordBasedSpeaker, // 単語別話者設定機能
  // キューシステム状態取得用
  getAudioQueueStatus: () => ({
    queueLength: audioQueue.length,
    isPlaying: isPlayingAudio
  }),
  // スパム対策機能
  isSpamMessage,
  getUserHistory,
  setCooldown,
  resetSpamHistory,
  getSpamStatistics,
  calculateSimilarity,
  updateSpamConfig // スパム対策設定更新機能
};
