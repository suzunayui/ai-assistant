const axios = require('axios');
const { LiveChat } = require('youtube-chat');

/**
 * チャンネルURLからライブ配信のビデオIDを取得
 * @param {string} channelUrl チャンネルURL
 * @returns {Promise<{videoId: string, liveUrl: string}>}
 */
async function getYoutubeLiveVideoId(channelUrl) {
  try {
    // チャンネルURLに/liveを追加
    const liveUrl = channelUrl.endsWith('/live') ? channelUrl : `${channelUrl.replace(/\/$/, '')}/live`;
    
    console.log(`ライブURL: ${liveUrl}`);
    
    // ライブページにアクセス
    const response = await axios.get(liveUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      maxRedirects: 5
    });
    
    const finalUrl = response.request.res.responseUrl || liveUrl;
    console.log(`最終URL: ${finalUrl}`);
    
    // URLから直接ビデオIDを抽出
    const urlMatch = finalUrl.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (urlMatch) {
      const videoId = urlMatch[1];
      console.log(`URLから抽出したビデオID: ${videoId}`);
      return { videoId, liveUrl: finalUrl };
    }
    
    // HTMLコンテンツからビデオIDを抽出
    const content = response.data;
    
    // 複数のパターンでビデオIDを検索
    const patterns = [
      /"videoId":"([a-zA-Z0-9_-]{11})"/,
      /watch\?v=([a-zA-Z0-9_-]{11})/,
      /"videoDetails":{"videoId":"([a-zA-Z0-9_-]{11})"}/,
      /ytInitialData.*?"videoId":"([a-zA-Z0-9_-]{11})"/,
      /&v=([a-zA-Z0-9_-]{11})/,
      /video_id=([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const matches = content.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        for (const match of matches) {
          const videoIdMatch = match.match(pattern);
          if (videoIdMatch && videoIdMatch[1].length === 11) {
            const videoId = videoIdMatch[1];
            console.log(`HTMLから抽出したビデオID: ${videoId}`);
            return { videoId, liveUrl: finalUrl };
          }
        }
      }
    }
    
    throw new Error('ライブ配信のビデオIDが見つかりませんでした');
    
  } catch (error) {
    throw new Error(`ライブ配信の取得に失敗しました: ${error.message}`);
  }
}

/**
 * YouTubeチャット取得を開始
 * @param {string} videoIdOrChannelUrl ビデオIDまたはチャンネルURL
 * @param {function} onMessage メッセージ受信時のコールバック
 * @param {boolean} useChannelId チャンネルIDを使用するかどうか
 * @returns {Promise<{stop: function}>}
 */
async function startChatListener(videoIdOrChannelUrl, onMessage, useChannelId = false) {
  try {
    console.log(`YouTubeチャット取得を開始: ${videoIdOrChannelUrl}`);
    
    // 接続開始時間を記録
    const connectionStartTime = new Date();
    console.log(`接続開始時間: ${connectionStartTime.toLocaleString('ja-JP')}`);
    
    let liveChat;
    
    if (useChannelId) {
      // チャンネルIDを使用する場合
      const channelId = extractChannelId(videoIdOrChannelUrl);
      if (channelId) {
        console.log(`チャンネルIDを使用: ${channelId}`);
        liveChat = new LiveChat({ 
          channelId: channelId,
          ignoreFirstResponse: true
        });
      } else {
        throw new Error('チャンネルIDが抽出できませんでした。ビデオIDで接続を試みます。');
      }
    } else {
      // ビデオIDを使用する場合
      liveChat = new LiveChat({ 
        liveId: videoIdOrChannelUrl,
        ignoreFirstResponse: true
      });
    }
    
    // start イベント
    liveChat.on('start', (liveId) => {
      console.log(`チャット取得開始: ${liveId}`);
      onMessage({
        author: 'システム',
        message: `チャット接続が成功しました。${connectionStartTime.toLocaleString('ja-JP')}以降の新しいメッセージのみを表示します。`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      });
    });
    
    // end イベント
    liveChat.on('end', (reason) => {
      console.log(`チャット取得終了: ${reason || '不明な理由'}`);
      onMessage({
        author: 'システム',
        message: `チャット取得が終了しました: ${reason || '不明な理由'}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      });
    });
    
    // chat イベント - 正しいAPIを使用
    liveChat.on('chat', (chatItem) => {
      try {
        // 実際の投稿時間を取得
        const actualTimestamp = chatItem.timestamp || new Date();
        
        // 接続開始時間より前のチャットは無視
        if (actualTimestamp < connectionStartTime) {
          // メッセージを安全に文字列に変換
          let messagePreview = '';
          if (Array.isArray(chatItem.message)) {
            messagePreview = chatItem.message.map(item => 
              typeof item === 'string' ? item : (item?.text || '[非テキスト要素]')
            ).join('').substring(0, 50);
          } else if (typeof chatItem.message === 'string') {
            messagePreview = chatItem.message.substring(0, 50);
          } else {
            messagePreview = '[メッセージ形式不明]';
          }
          console.log(`古いチャットをスキップ: [${actualTimestamp.toLocaleString('ja-JP')}] ${chatItem.author?.name}: ${messagePreview}`);
          return;
        }
        
        // メッセージテキストを構築
        let messageText = '';
        if (chatItem.message && Array.isArray(chatItem.message)) {
          messageText = chatItem.message.map(item => {
            if (typeof item === 'string') {
              return item;
            } else if (item.text) {
              return item.text;
            } else if (item.emojiText) {
              return item.emojiText;
            }
            return '';
          }).join('');
        } else if (typeof chatItem.message === 'string') {
          messageText = chatItem.message;
        }
        
        // 複数の時間フォーマットを提供
        const timeFormats = {
          time: actualTimestamp.toLocaleTimeString('ja-JP'), // 時:分:秒
          datetime: actualTimestamp.toLocaleString('ja-JP'), // 日付と時間
          iso: actualTimestamp.toISOString(), // ISO形式
          relative: getRelativeTime(actualTimestamp) // 相対時間（例：2分前）
        };
        
        const message = {
          author: chatItem.author?.name || 'Unknown',
          message: messageText,
          timestamp: timeFormats.time, // デフォルトは時間のみ表示
          fullTimestamp: timeFormats.datetime, // 完全な日時
          actualTime: actualTimestamp, // 元のDateオブジェクト
          timeFormats: timeFormats, // 全ての時間フォーマット
          connectionStartTime: connectionStartTime, // 接続開始時間も含める
          type: 'user',
          isVerified: chatItem.isVerified || false,
          isModerator: chatItem.isModerator || false,
          isOwner: chatItem.isOwner || false,
          isMembership: chatItem.isMembership || false
        };
        
        console.log(`新しいチャット [${message.fullTimestamp}] ${message.author}: ${message.message}`);
        onMessage(message);
      } catch (error) {
        console.error('チャットメッセージ処理エラー:', error);
      }
    });
    
    // error イベント
    liveChat.on('error', (error) => {
      console.error('YouTubeチャットエラー:', error);
      onMessage({
        author: 'システム',
        message: `エラー: ${error.message || error}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'error'
      });
    });
    
    // チャット取得を開始
    const success = await liveChat.start();
    if (!success) {
      throw new Error('YouTubeチャットの開始に失敗しました');
    }
    
    console.log('YouTubeチャット取得が開始されました');
    
    return {
      stop: () => {
        console.log('YouTubeチャット取得を停止');
        liveChat.stop();
      }
    };
    
  } catch (error) {
    throw new Error(`チャット取得の開始に失敗しました: ${error.message}`);
  }
}

/**
 * チャンネルURLからチャンネルIDを抽出
 * @param {string} channelUrl チャンネルURL
 * @returns {string|null} チャンネルID
 */
function extractChannelId(channelUrl) {
  // @ハンドル形式: https://www.youtube.com/@channelhandle
  const handleMatch = channelUrl.match(/@([a-zA-Z0-9_-]+)/);
  if (handleMatch) {
    return null; // ハンドル形式の場合はチャンネルIDが直接取得できないため
  }
  
  // チャンネルID形式: https://www.youtube.com/channel/UCxxxxx
  const channelIdMatch = channelUrl.match(/channel\/([a-zA-Z0-9_-]+)/);
  if (channelIdMatch) {
    return channelIdMatch[1];
  }
  
  // c/形式: https://www.youtube.com/c/channelname
  const cMatch = channelUrl.match(/\/c\/([a-zA-Z0-9_-]+)/);
  if (cMatch) {
    return null; // c/形式もチャンネルIDが直接取得できないため
  }
  
  return null;
}

/**
 * 相対時間を計算（例：2分前、30秒前など）
 * @param {Date} timestamp 投稿時間
 * @returns {string} 相対時間の文字列
 */
function getRelativeTime(timestamp) {
  const now = new Date();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return `${diffSeconds}秒前`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分前`;
  } else if (diffHours < 24) {
    return `${diffHours}時間前`;
  } else {
    return `${diffDays}日前`;
  }
}

module.exports = {
  getYoutubeLiveVideoId,
  startChatListener,
  extractChannelId
};
