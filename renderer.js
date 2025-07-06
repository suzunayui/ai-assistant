// DOM要素の取得（初期化時にnullの可能性があります。DOMContentLoaded後に再取得します）
let channelUrlInput = document.getElementById('channelUrl');
let connectBtn = document.getElementById('connectBtn');
let disconnectBtn = document.getElementById('disconnectBtn');
let saveChannelUrlBtn = document.getElementById('saveChannelUrlBtn');
let channelUrlHistory = document.getElementById('channelUrlHistory');
let liveUrlStatus = document.getElementById('liveUrlStatus');
let chatArea = document.getElementById('chatArea');
let chatStats = document.getElementById('chatStats');
let connectionTimeEl = document.getElementById('connectionTime');
let messageCountEl = document.getElementById('messageCount');
let filteredCountEl = document.getElementById('filteredCount');
let audioQueueStatusEl = document.getElementById('audioQueueStatus');
let clearAudioQueueBtn = document.getElementById('clearAudioQueueBtn');

// AI設定用のDOM要素
let aiEnabledCheckbox = document.getElementById('aiEnabled');
let voiceEnabledCheckbox = document.getElementById('voiceEnabled');
let refreshSpeakersBtn = document.getElementById('refreshSpeakers');
let voicevoxStatus = document.getElementById('voicevoxStatus');
let openaiApiKeyInput = document.getElementById('openaiApiKey');
let saveApiKeyBtn = document.getElementById('saveApiKey');
let apiKeyStatus = document.getElementById('apiKeyStatus');

// 読み上げ設定用のDOM要素
let readAllChatsCheckbox = document.getElementById('readAllChats');
let chatSpeakerSelect = document.getElementById('chatSpeakerSelect');
let komochiSpeakerSelect = document.getElementById('komochiSpeakerSelect');
let speakerSelect = document.getElementById('speakerSelect');
let readUserNameCheckbox = document.getElementById('readUserName');
let readTimestampCheckbox = document.getElementById('readTimestamp');

// NGワード設定用のDOM要素
let ngWordsTextarea = document.getElementById('ngWordsTextarea');
let ngWordsSkipTextarea = document.getElementById('ngWordsSkipTextarea');
let saveNgWordsSkipBtn = document.getElementById('saveNgWordsSkip');
let ngWordsRemoveTextarea = document.getElementById('ngWordsRemoveTextarea');
let saveNgWordsRemoveBtn = document.getElementById('saveNgWordsRemove');

// 名前読み方設定用のDOM要素
let originalNameInput = document.getElementById('originalName');
let pronunciationNameInput = document.getElementById('pronunciationName');
let addPronunciationBtn = document.getElementById('addPronunciation');
let pronunciationList = document.getElementById('pronunciationList');

// テキスト置き換え設定用のDOM要素
let originalTextInput = document.getElementById('originalText');
let replacementTextInput = document.getElementById('replacementText');
let addTextReplacementBtn = document.getElementById('addTextReplacement');
let textReplacementList = document.getElementById('textReplacementList');
let saveTextReplacementsBtn = document.getElementById('saveTextReplacements');

// 性格設定用のDOM要素
let personalityTextarea = document.getElementById('personalityTextarea');
let savePersonalityBtn = document.getElementById('savePersonality');

// トリガーワード設定用のDOM要素
let newTriggerWordInput = document.getElementById('newTriggerWord');
let addTriggerWordBtn = document.getElementById('addTriggerWord');
let triggerWordsList = document.getElementById('triggerWordsList');
let saveTriggerWordsBtn = document.getElementById('saveTriggerWords');

// カスタム絵文字読み方設定用のDOM要素
let emojiNameInput = document.getElementById('emojiName');
let emojiReadingInput = document.getElementById('emojiReading');
let addEmojiReadingBtn = document.getElementById('addEmojiReading');
let emojiReadingList = document.getElementById('emojiReadingList');

// チャット読み替え設定用のDOM要素
let originalChatWordInput = document.getElementById('originalChatWord');
let replacementChatWordInput = document.getElementById('replacementChatWord');
let addChatReplacementBtn = document.getElementById('addChatReplacement');
let chatReplacementList = document.getElementById('chatReplacementList');

// 単語別話者設定用のDOM要素
let triggerWordForSpeakerInput = document.getElementById('triggerWordForSpeaker');
let speakerForWordSelect = document.getElementById('speakerForWord');
let addWordSpeakerBtn = document.getElementById('addWordSpeaker');
let wordSpeakerList = document.getElementById('wordSpeakerList');

// VOICEVOX辞書登録用のDOM要素
let dictSurfaceInput = document.getElementById('dictSurface');
let dictReadingInput = document.getElementById('dictReading');
let dictPartOfSpeechSelect = document.getElementById('dictPartOfSpeech');
let addDictionaryBtn = document.getElementById('addDictionary');
let dictionaryList = document.getElementById('dictionaryList');
let refreshDictionaryBtn = document.getElementById('refreshDictionary');

// 設定管理用のDOM要素
let openConfigFolderBtn = document.getElementById('openConfigFolder');
let exportConfigBtn = document.getElementById('exportConfig');
let importConfigBtn = document.getElementById('importConfig');
let resetConfigBtn = document.getElementById('resetConfig');
let configPathDisplay = document.getElementById('configPathDisplay');

// 状態管理
let isConnected = false;
let isConnecting = false;

// 統計情報
let chatStatistics = {
    connectionStartTime: null,
    totalMessages: 0,
    filteredMessages: 0,
    displayedMessages: 0
};

// トリガーワード設定
let triggerWords = ['こもち'];

// カスタム絵文字読み方設定
let emojiReadings = {};

// チャット読み替え設定
let chatReplacements = {};

// 単語別話者設定
let wordSpeakers = {};

// テキスト置き換え設定
let textReplacements = {};

// HTMLエスケープ関数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM読み込み完了: アプリケーションが初期化されました');
    
    // DOM要素を安全に再取得
    refreshDomElements();
    
    // イベントリスナーの設定（DOM要素の存在チェック付き）
    if (connectBtn) {
        connectBtn.addEventListener('click', handleConnect);
        console.log('✅ connectBtnイベントリスナー設定');
    } else {
        console.error('❌ connectBtn要素が見つかりません');
    }
    
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', handleDisconnect);
        console.log('✅ disconnectBtnイベントリスナー設定');
    } else {
        console.error('❌ disconnectBtn要素が見つかりません');
    }
    
    if (saveChannelUrlBtn) {
        saveChannelUrlBtn.addEventListener('click', handleSaveChannelUrl);
        console.log('✅ saveChannelUrlBtnイベントリスナー設定');
    } else {
        console.error('❌ saveChannelUrlBtn要素が見つかりません');
    }
    
    // Enterキーでの接続
    if (channelUrlInput) {
        channelUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !isConnected) {
                handleConnect();
            }
        });
        console.log('✅ channelUrlInputキープレスイベント設定');
    } else {
        console.error('❌ channelUrlInput要素が見つかりません');
    }
    
    // チャットメッセージの受信設定
    window.electronAPI.onChatMessage(handleChatMessage);
    
    // 保存されたチャンネルURLを読み込み
    loadChannelUrlHistory();
    
    // API Key保存のイベントリスナーを追加
    saveApiKeyBtn.addEventListener('click', handleSaveApiKey);
    
    // スピーカー関連のイベントリスナーを追加
    refreshSpeakersBtn.addEventListener('click', loadSpeakers);
    
    // 新機能のイベントリスナーを追加（安全にチェック）
    if (saveNgWordsSkipBtn) {
        saveNgWordsSkipBtn.addEventListener('click', handleSaveNgWordsSkip);
        console.log('✅ saveNgWordsSkipBtnイベントリスナー設定');
    } else {
        console.log('⚠️ saveNgWordsSkipBtn が見つかりません');
    }
    
    if (saveNgWordsRemoveBtn) {
        saveNgWordsRemoveBtn.addEventListener('click', handleSaveNgWordsRemove);
        console.log('✅ saveNgWordsRemoveBtnイベントリスナー設定');
    } else {
        console.log('⚠️ saveNgWordsRemoveBtn が見つかりません');
    }
    
    if (addPronunciationBtn) {
        addPronunciationBtn.addEventListener('click', handleAddPronunciation);
        console.log('✅ addPronunciationBtnイベントリスナー設定');
    } else {
        console.log('⚠️ addPronunciationBtn が見つかりません');
    }
    
    // テキスト置き換え設定のイベントリスナーを追加（安全にチェック）
    if (addTextReplacementBtn) {
        addTextReplacementBtn.addEventListener('click', handleAddTextReplacement);
        console.log('✅ addTextReplacementBtnイベントリスナー設定');
    } else {
        console.log('⚠️ addTextReplacementBtn が見つかりません');
    }
    
    if (saveTextReplacementsBtn) {
        saveTextReplacementsBtn.addEventListener('click', handleSaveTextReplacements);
        console.log('✅ saveTextReplacementsBtnイベントリスナー設定');
    } else {
        console.log('⚠️ saveTextReplacementsBtn が見つかりません');
    }
    
    // 性格設定のイベントリスナー（安全にチェック）
    if (savePersonalityBtn) {
        savePersonalityBtn.addEventListener('click', handleSavePersonality);
        console.log('✅ savePersonalityBtnイベントリスナー設定');
    } else {
        console.log('⚠️ savePersonalityBtn が見つかりません');
    }
    
    // トリガーワード設定のイベントリスナー（安全にチェック）
    if (addTriggerWordBtn) {
        addTriggerWordBtn.addEventListener('click', addTriggerWord);
        console.log('✅ addTriggerWordBtnイベントリスナー設定');
    } else {
        console.log('⚠️ addTriggerWordBtn が見つかりません');
    }
    
    if (saveTriggerWordsBtn) {
        saveTriggerWordsBtn.addEventListener('click', saveTriggerWords);
        console.log('✅ saveTriggerWordsBtnイベントリスナー設定');
    } else {
        console.log('⚠️ saveTriggerWordsBtn が見つかりません');
    }
    
    // カスタム絵文字読み方設定のイベントリスナー（安全にチェック）
    if (addEmojiReadingBtn) {
        addEmojiReadingBtn.addEventListener('click', addEmojiReading);
        console.log('✅ addEmojiReadingBtnイベントリスナー設定');
    } else {
        console.log('⚠️ addEmojiReadingBtn が見つかりません');
    }
    
    // チャット読み替え設定のイベントリスナー（安全にチェック）
    if (addChatReplacementBtn) {
        addChatReplacementBtn.addEventListener('click', addChatReplacement);
        console.log('✅ addChatReplacementBtnイベントリスナー設定');
    } else {
        console.log('⚠️ addChatReplacementBtn が見つかりません');
    }
    
    // Enterキーでトリガーワード追加（安全にチェック）
    if (newTriggerWordInput) {
        newTriggerWordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTriggerWord();
            }
        });
        console.log('✅ newTriggerWordInputキープレスイベント設定');
    } else {
        console.log('⚠️ newTriggerWordInput が見つかりません');
    }
    
    // Enterキーで絵文字読み方追加（安全にチェック）
    if (emojiNameInput) {
        emojiNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addEmojiReading();
            }
        });
        console.log('✅ emojiNameInputキープレスイベント設定');
    } else {
        console.log('⚠️ emojiNameInput が見つかりません');
    }
    
    if (emojiReadingInput) {
        emojiReadingInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addEmojiReading();
            }
        });
        console.log('✅ emojiReadingInputキープレスイベント設定');
    } else {
        console.log('⚠️ emojiReadingInput が見つかりません');
    }
    
    // Enterキーでチャット読み替え追加（安全にチェック）
    if (originalChatWordInput) {
        originalChatWordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addChatReplacement();
            }
        });
        console.log('✅ originalChatWordInputキープレスイベント設定');
    } else {
        console.log('⚠️ originalChatWordInput が見つかりません');
    }
    
    if (replacementChatWordInput) {
        replacementChatWordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addChatReplacement();
            }
        });
        console.log('✅ replacementChatWordInputキープレスイベント設定');
    } else {
        console.log('⚠️ replacementChatWordInput が見つかりません');
    }

    // 単語別話者設定のイベントリスナー（安全にチェック）
    if (addWordSpeakerBtn) {
        addWordSpeakerBtn.addEventListener('click', addWordSpeaker);
        console.log('✅ addWordSpeakerBtnイベントリスナー設定');
    } else {
        console.log('⚠️ addWordSpeakerBtn が見つかりません');
    }

    // Enterキーで単語別話者設定追加（安全にチェック）
    if (triggerWordForSpeakerInput) {
        triggerWordForSpeakerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addWordSpeaker();
            }
        });
        console.log('✅ triggerWordForSpeakerInputキープレスイベント設定');
    } else {
        console.log('⚠️ triggerWordForSpeakerInput が見つかりません');
    }
    
    // VOICEVOX辞書登録のイベントリスナー（安全にチェック）
    if (addDictionaryBtn) {
        addDictionaryBtn.addEventListener('click', handleAddDictionary);
        console.log('✅ addDictionaryBtnイベントリスナー設定');
    } else {
        console.log('⚠️ addDictionaryBtn が見つかりません');
    }
    
    if (refreshDictionaryBtn) {
        refreshDictionaryBtn.addEventListener('click', handleRefreshDictionary);
        console.log('✅ refreshDictionaryBtnイベントリスナー設定');
    } else {
        console.log('⚠️ refreshDictionaryBtn が見つかりません');
    }
    
    // チェックボックスの変更イベント（安全にチェック）
    if (readAllChatsCheckbox) {
        readAllChatsCheckbox.addEventListener('change', handleReadingSettingsChange);
        console.log('✅ readAllChatsCheckboxイベントリスナー設定');
    } else {
        console.log('⚠️ readAllChatsCheckbox が見つかりません');
    }
    
    if (readUserNameCheckbox) {
        readUserNameCheckbox.addEventListener('change', handleReadingSettingsChange);
        console.log('✅ readUserNameCheckboxイベントリスナー設定');
    } else {
        console.log('⚠️ readUserNameCheckbox が見つかりません');
    }
    
    if (readTimestampCheckbox) {
        readTimestampCheckbox.addEventListener('change', handleReadingSettingsChange);
        console.log('✅ readTimestampCheckboxイベントリスナー設定');
    } else {
        console.log('⚠️ readTimestampCheckbox が見つかりません');
    }
    
    if (chatSpeakerSelect) {
        chatSpeakerSelect.addEventListener('change', handleReadingSettingsChange);
        console.log('✅ chatSpeakerSelectイベントリスナー設定');
    } else {
        console.log('⚠️ chatSpeakerSelect が見つかりません');
    }
    
    if (komochiSpeakerSelect) {
        komochiSpeakerSelect.addEventListener('change', handleReadingSettingsChange);
        console.log('✅ komochiSpeakerSelectイベントリスナー設定');
    } else {
        console.log('⚠️ komochiSpeakerSelect が見つかりません');
    }
    
    // 音声キュー関連のイベントリスナー（安全にチェック）
    if (clearAudioQueueBtn) {
        clearAudioQueueBtn.addEventListener('click', handleClearAudioQueue);
        console.log('✅ clearAudioQueueBtnイベントリスナー設定');
    } else {
        console.log('⚠️ clearAudioQueueBtn が見つかりません');
    }
    
    // Enterキーでの名前読み方追加（安全にDOM要素をチェック）
    if (originalNameInput) {
        originalNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAddPronunciation();
            }
        });
        console.log('✅ originalNameInputキープレスイベント設定');
    } else {
        console.warn('⚠️ originalNameInput要素が見つかりません');
    }
    
    if (pronunciationNameInput) {
        pronunciationNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAddPronunciation();
            }
        });
        console.log('✅ pronunciationNameInputキープレスイベント設定');
    } else {
        console.warn('⚠️ pronunciationNameInput要素が見つかりません');
    }
    
    // Enterキーでの辞書登録追加（安全にDOM要素をチェック）
    if (dictSurfaceInput) {
        dictSurfaceInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAddDictionary();
            }
        });
        console.log('✅ dictSurfaceInputキープレスイベント設定');
    } else {
        console.warn('⚠️ dictSurfaceInput要素が見つかりません');
    }
    
    if (dictReadingInput) {
        dictReadingInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAddDictionary();
            }
        });
        console.log('✅ dictReadingInputキープレスイベント設定');
    } else {
        console.warn('⚠️ dictReadingInput要素が見つかりません');
    }
    
    // トリガーワード追加ボタン（安全にチェック）
    if (addTriggerWordBtn) {
        addTriggerWordBtn.addEventListener('click', addTriggerWord);
        console.log('✅ addTriggerWordBtnイベントリスナーを追加');
    } else {
        console.warn('⚠️ addTriggerWordBtn要素が見つかりません（スキップ）');
    }
    
    // 設定の読み込み
    loadSettings();
    loadSpeakers();
    loadNgWords();
    loadNgWordsSkip();
    loadNgWordsRemove();
    loadNamePronunciations();
    loadReadingSettings();
    loadPersonality();
    loadDictionary();
    loadTriggerWords();
    loadEmojiReadings();
    loadAntiSpamSettings();
    loadWordSpeakers();
    
    // 音声設定の初期化と読み込み
    initVoiceSettings();
    loadVoiceSettings();
    
    // 設定ファイル管理ボタン - 安全にDOM要素を取得
    console.log('🔍 設定管理ボタンの要素チェック開始...');
    
    if (!openConfigFolderBtn) {
        console.error('❌ openConfigFolderボタン要素が見つかりません');
        // HTMLに要素が存在するかを調べる
        const allButtons = document.querySelectorAll('button');
        console.log('ページ内の全ボタン要素:', Array.from(allButtons).map(btn => btn.id || btn.textContent));
    } else {
        console.log('✅ openConfigFolderボタン要素を確認');
        // ボタンのスタイルや属性をチェック
        console.log('ボタンのdisabled状態:', openConfigFolderBtn.disabled);
        console.log('ボタンのdisplay:', window.getComputedStyle(openConfigFolderBtn).display);
        console.log('ボタンのvisibility:', window.getComputedStyle(openConfigFolderBtn).visibility);
        
        // ボタンを確実に有効化
        openConfigFolderBtn.disabled = false;
        console.log('ボタンを有効化しました');
        
        openConfigFolderBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            // ボタンを一時的に無効化して連続クリックを防ぐ
            openConfigFolderBtn.disabled = true;
            const originalText = openConfigFolderBtn.textContent;
            openConfigFolderBtn.textContent = '処理中...';
            
            try {
                await openConfigFolder();
            } catch (error) {
                console.error('設定フォルダーを開く際にエラーが発生しました:', error);
            } finally {
                // 処理完了後にボタンを再有効化
                setTimeout(() => {
                    openConfigFolderBtn.disabled = false;
                    openConfigFolderBtn.textContent = originalText;
                }, 2000);
            }
        });
        console.log('✅ openConfigFolderイベントリスナーを追加しました');
    }
    
    // 他のボタンも安全に設定
    if (exportConfigBtn) {
        exportConfigBtn.addEventListener('click', exportConfig);
        console.log('✅ exportConfigイベントリスナーを追加');
    } else {
        console.error('❌ exportConfigボタンが見つかりません');
    }
    
    if (importConfigBtn) {
        importConfigBtn.addEventListener('click', importConfig);
        console.log('✅ importConfigイベントリスナーを追加');
    } else {
        console.error('❌ importConfigボタンが見つかりません');
    }
    
    if (resetConfigBtn) {
        resetConfigBtn.addEventListener('click', resetConfig);
        console.log('✅ resetConfigイベントリスナーを追加');
    } else {
        console.error('❌ resetConfigボタンが見つかりません');
    }
    
    // 設定ファイルパスを表示
    console.log('displayConfigPath関数を呼び出します...');
    try {
        await displayConfigPath();
        console.log('displayConfigPath完了');
    } catch (error) {
        console.error('displayConfigPath呼び出しエラー:', error);
        const configFilePathElement = document.getElementById('configFilePath');
        if (configFilePathElement) {
            configFilePathElement.textContent = '設定ファイルパス取得エラー';
        }
    }
    
    // 設定ファイルの場所をユーザーに説明
    console.log('💡 設定ファイル情報を表示します');
    addChatMessage('システム', '=== 設定ファイル情報 ===', 'system');
    addChatMessage('システム', '設定ファイルの場所: C:\\Users\\mikan\\.komochi-chat-config.json', 'system');
    addChatMessage('システム', '手動でエクスプローラーを開いて上記パスに移動できます', 'system');
    
    // 統計情報を定期的に更新（2秒間隔）
    setInterval(updateChatStatistics, 2000);
    
    // スパム対策イベントリスナーの設定
    // 統計更新ボタン
    const refreshSpamStatsBtn = document.getElementById('refreshSpamStats');
    if (refreshSpamStatsBtn) {
        refreshSpamStatsBtn.addEventListener('click', updateSpamStatistics);
        console.log('✅ refreshSpamStatsBtnイベントリスナー設定');
    }
    
    // 全履歴リセットボタン
    const resetAllSpamHistoryBtn = document.getElementById('resetAllSpamHistory');
    if (resetAllSpamHistoryBtn) {
        resetAllSpamHistoryBtn.addEventListener('click', resetAllSpamHistory);
        console.log('✅ resetAllSpamHistoryBtnイベントリスナー設定');
    }
    
    // 個別リセットボタン
    const resetUserSpamHistoryBtn = document.getElementById('resetUserSpamHistory');
    if (resetUserSpamHistoryBtn) {
        resetUserSpamHistoryBtn.addEventListener('click', resetUserSpamHistory);
        console.log('✅ resetUserSpamHistoryBtnイベントリスナー設定');
    }
    
    // 設定保存ボタン
    const saveAntiSpamSettingsBtn = document.getElementById('saveAntiSpamSettings');
    if (saveAntiSpamSettingsBtn) {
        saveAntiSpamSettingsBtn.addEventListener('click', saveAntiSpamSettings);
        console.log('✅ saveAntiSpamSettingsBtnイベントリスナー設定');
    }
    
    // スパム対策設定の初期読み込み
    loadAntiSpamSettings();
    updateSpamStatistics();
    
    // 定期的な統計更新（30秒間隔）
    setInterval(updateSpamStatistics, 30000);
});

/**
 * チャット接続処理
 */
async function handleConnect() {
    const channelUrl = channelUrlInput.value.trim();
    
    if (!channelUrl) {
        showError('チャンネルURLを入力してください。');
        return;
    }
    
    try {
        setConnecting(true);
        addChatMessage('システム', 'ライブ配信を検索中...', 'system');
        
        // ライブ配信のビデオIDを取得
        const videoResult = await window.electronAPI.getLiveVideoId(channelUrl);
        
        if (!videoResult.success) {
            throw new Error(videoResult.error);
        }
        
        const { videoId, liveUrl } = videoResult.data;
        
        if (!videoId) {
            throw new Error('現在ライブ配信が行われていません。');
        }
        
        // UIを更新
        liveUrlStatus.textContent = `ライブURL: ${liveUrl}`;
        // 接続開始時間を記録・表示
        const connectionTime = new Date();
        chatStatistics.connectionStartTime = connectionTime;
        chatStats.style.display = 'block';
        updateChatStatistics();
        
        addChatMessage('システム', `ビデオID: ${videoId}`, 'system');
        addChatMessage('システム', `接続開始時間: ${connectionTime.toLocaleString('ja-JP')}`, 'system');
        addChatMessage('システム', 'チャットに接続中...', 'system');
        
        // チャット取得を開始
        const chatResult = await window.electronAPI.startChat(videoId);
        
        if (!chatResult.success) {
            throw new Error(chatResult.error);
        }
        
        setConnected(true);
        
        // 接続成功時にチャンネルURLを自動保存
        try {
            await window.electronAPI.saveChannelUrl(channelUrl);
            console.log('チャンネルURLを自動保存しました:', channelUrl);
        } catch (saveError) {
            console.warn('チャンネルURL自動保存エラー:', saveError);
        }
        
    } catch (error) {
        console.error('接続エラー:', error);
        showError(error.message);
        setConnecting(false);
    }
}

/**
 * チャット切断処理
 */
async function handleDisconnect() {
    try {
        await window.electronAPI.stopChat();
        setConnected(false);
        addChatMessage('システム', '--- チャットから切断しました ---', 'system');
        
        // UIをリセット
        liveUrlStatus.textContent = 'ライブURL: 未接続';
        liveUrlStatus.classList.remove('connected');
        
        // 統計情報をリセット
        resetChatStatistics();
        
    } catch (error) {
        console.error('切断エラー:', error);
        showError('切断中にエラーが発生しました。');
    }
}

/**
 * チャットメッセージを受信した時の処理
 */
function handleChatMessage(message) {
    const messageType = message.type === 'system' ? 'system' : 
                       message.type === 'error' ? 'error' : 
                       message.type === 'ai-response' ? 'ai-response' : 'user';
    
    // ユーザーメッセージの場合は統計を更新
    if (messageType === 'user') {
        chatStatistics.totalMessages++;
        chatStatistics.displayedMessages++;
        updateChatStatistics();
    } else if (messageType === 'ai-response') {
        chatStatistics.displayedMessages++;
        updateChatStatistics();
    }
    
    // より詳細な時間情報を渡す
    addChatMessage(message.author, message.message, messageType, message);
}

/**
 * チャットエリアにメッセージを追加
 */
function addChatMessage(author, message, type = 'user', messageData = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    
    let time, fullTime;
    if (messageData && messageData.timeFormats) {
        // YouTube投稿時間を使用
        time = messageData.timestamp; // 時間のみ
        fullTime = messageData.fullTimestamp; // 完全な日時
    } else if (messageData && typeof messageData === 'string') {
        // 文字列として渡された場合（後方互換性）
        time = messageData;
        fullTime = messageData;
    } else {
        // デフォルト（現在時刻）
        time = new Date().toLocaleTimeString();
        fullTime = new Date().toLocaleString();
    }
    
    // ユーザーバッジを構築
    let badges = '';
    if (messageData && type === 'user') {
        if (messageData.isOwner) badges += '<span class="badge owner">📺</span>';
        if (messageData.isModerator) badges += '<span class="badge mod">🛡️</span>';
        if (messageData.isVerified) badges += '<span class="badge verified">✓</span>';
        if (messageData.isMembership) badges += '<span class="badge member">⭐</span>';
    }
    
    messageDiv.innerHTML = `
        <span class="chat-timestamp" title="${fullTime}">[${time}]</span>
        <span class="chat-author">${author}:</span>
        ${badges}
        <span class="chat-text">${message}</span>
    `;
    
    chatArea.appendChild(messageDiv);
    
    // 自動スクロール
    chatArea.scrollTop = chatArea.scrollHeight;
    
    // メッセージ数が多くなったら古いものを削除（パフォーマンス対策）
    const messages = chatArea.querySelectorAll('.chat-message');
    if (messages.length > 1000) {
        for (let i = 0; i < 100; i++) {
            if (messages[i]) {
                messages[i].remove();
            }
        }
    }
    
    // 統計情報を更新
    chatStatistics.totalMessages++;
    chatStatistics.displayedMessages++;
    updateChatStatistics();
}

/**
 * エラーメッセージを表示
 */
function showError(message) {
    // エラーメッセージを解析して、より分かりやすいメッセージに変換
    let displayMessage = message;
    let isServerError = false;
    
    if (message.includes('503') || message.includes('Service Unavailable')) {
        displayMessage = '🔄 サーバーが一時的に利用できません。少し時間をおいて再試行してください。';
        isServerError = true;
    } else if (message.includes('429') || message.includes('Too Many Requests')) {
        displayMessage = '⏱️ リクエストが多すぎます。少し時間をおいて再試行してください。';
        isServerError = true;
    } else if (message.includes('500') || message.includes('Internal Server Error')) {
        displayMessage = '⚠️ サーバー内部エラーが発生しました。しばらく待ってから再試行してください。';
        isServerError = true;
    } else if (message.includes('502') || message.includes('Bad Gateway')) {
        displayMessage = '🔗 ゲートウェイエラーが発生しました。ネットワーク接続を確認してください。';
        isServerError = true;
    } else if (message.includes('504') || message.includes('Gateway Timeout')) {
        displayMessage = '⏰ ゲートウェイタイムアウトが発生しました。サーバーが混雑している可能性があります。';
        isServerError = true;
    } else if (message.includes('401') || message.includes('Unauthorized')) {
        displayMessage = '🔑 API Keyが無効です。設定を確認してください。';
    } else if (message.includes('ENOTFOUND') || message.includes('ECONNREFUSED')) {
        displayMessage = '🌐 インターネット接続またはサーバー接続に問題があります。';
    } else if (message.includes('timeout')) {
        displayMessage = '⏱️ 接続がタイムアウトしました。ネットワーク状況を確認してください。';
    } else if (message.includes('混雑')) {
        displayMessage = '🚦 ' + message;
        isServerError = true;
    }
    
    addChatMessage('エラー', displayMessage, 'error');
    
    // 重要なエラーの場合はアラートも表示
    if (message.includes('接続') || message.includes('取得') || isServerError) {
        // サーバーエラーの場合は、より詳細な説明を追加
        let alertMessage = `エラー: ${displayMessage}`;
        if (isServerError) {
            alertMessage += '\n\n💡 ヒント: サーバーエラーは通常一時的なものです。数分待ってから再試行することをお勧めします。';
        }
        alert(alertMessage);
    }
}

/**
 * 接続中状態の設定
 */
function setConnecting(connecting) {
    connectBtn.disabled = connecting;
    disconnectBtn.disabled = connecting;
    channelUrlInput.disabled = connecting;
    
    if (connecting) {
        connectBtn.textContent = '接続中...';
    } else {
        connectBtn.textContent = 'チャット接続';
    }
}

/**
 * 接続状態の設定
 */
function setConnected(connected) {
    isConnected = connected;
    connectBtn.disabled = connected;
    disconnectBtn.disabled = !connected;
    channelUrlInput.disabled = connected;
    
    if (connected) {
        connectBtn.textContent = '接続済み';
    } else {
        connectBtn.textContent = 'チャット接続';
    }
}

/**
 * チャットエリアをクリア
 */
function clearChat() {
    chatArea.innerHTML = '';
}

/**
 * 統計情報を更新
 */
async function updateChatStatistics() {
    if (chatStatistics.connectionStartTime) {
        connectionTimeEl.textContent = `接続開始: ${chatStatistics.connectionStartTime.toLocaleTimeString('ja-JP')}`;
    }
    messageCountEl.textContent = `表示メッセージ: ${chatStatistics.displayedMessages}件`;
    filteredCountEl.textContent = `フィルタ済み: ${chatStatistics.filteredMessages}件`;
    
    // 音声キューの状態を更新
    try {
        const queueStatus = await window.electronAPI.getAudioQueueStatus();
        const statusText = queueStatus.isPlaying 
            ? `音声キュー: ${queueStatus.queueLength}件 (再生中)`
            : `音声キュー: ${queueStatus.queueLength}件`;
        audioQueueStatusEl.textContent = statusText;
        
        // キューが溜まってきたら警告色にする
        if (queueStatus.queueLength > 5) {
            audioQueueStatusEl.style.color = '#ff6b6b';
        } else if (queueStatus.queueLength > 2) {
            audioQueueStatusEl.style.color = '#ffd93d';
        } else {
            audioQueueStatusEl.style.color = '';
        }
    } catch (error) {
        console.warn('音声キュー状態取得エラー:', error);
        audioQueueStatusEl.textContent = '音声キュー: 不明';
    }
}

/**
 * 統計情報をリセット
 */
function resetChatStatistics() {
    chatStatistics = {
        connectionStartTime: null,
        totalMessages: 0,
        filteredMessages: 0,
        displayedMessages: 0
    };
    chatStats.style.display = 'none';
    updateChatStatistics();
}

/**
 * API Key保存処理
 */
async function handleSaveApiKey() {
    const apiKey = openaiApiKeyInput.value.trim();
    if (!apiKey) {
        showError('API Keyを入力してください');
        return;
    }
    
    try {
        const result = await window.electronAPI.saveApiKey(apiKey);
        if (result.success) {
            addChatMessage('システム', 'OpenAI API Keyが保存されました', 'system');
            openaiApiKeyInput.value = '';
            
            // 状態を更新
            apiKeyStatus.textContent = '✓ 設定済み';
            apiKeyStatus.className = 'api-key-status loaded';
        } else {
            showError(result.error);
        }
    } catch (error) {
        showError('API Key保存エラー: ' + error.message);
    }
}

/**
 * 設定を読み込み
 */
async function loadSettings() {
    try {
        const settings = await window.electronAPI.loadSettings();
        if (settings) {
            aiEnabledCheckbox.checked = settings.aiEnabled !== false;
            voiceEnabledCheckbox.checked = settings.voiceEnabled !== false;
            
            // スピーカーIDを復元
            if (settings.speakerId) {
                speakerSelect.value = settings.speakerId;
            }
            
            // API Key状態を表示
            if (settings.hasApiKey) {
                apiKeyStatus.textContent = '✓ 設定済み';
                apiKeyStatus.className = 'api-key-status loaded';
            } else {
                apiKeyStatus.textContent = '⚠ 未設定 - OpenAI API Keyが必要です';
                apiKeyStatus.className = 'api-key-status missing';
                
                // 初回起動時の案内メッセージを表示
                setTimeout(() => {
                    addChatMessage('システム', 
                        'AIアシスタント機能を使用するには、OpenAI API Keyの設定が必要です。\n' +
                        '上部の「AI応答設定」でAPI Keyを入力してください。\n' +
                        'API Keyは https://platform.openai.com で取得できます。', 
                        'system'
                    );
                }, 1000);
            }
        }
    } catch (error) {
        console.warn('設定読み込みエラー:', error);
        apiKeyStatus.textContent = '✗ 読み込みエラー';
        apiKeyStatus.className = 'api-key-status missing';
    }
}

/**
 * 設定を保存（統合版）
 */
async function saveSettings() {
    try {
        const settings = {
            aiEnabled: aiEnabledCheckbox.checked,
            voiceEnabled: voiceEnabledCheckbox.checked
        };
        await window.electronAPI.saveSettings(settings);
    } catch (error) {
        console.warn('設定保存エラー:', error);
    }
}

/**
 * VOICEVOX話者一覧を読み込み
 */
async function loadSpeakers() {
    try {
        refreshSpeakersBtn.disabled = true;
        refreshSpeakersBtn.textContent = '読み込み中...';
        voicevoxStatus.textContent = '接続確認中...';
        voicevoxStatus.className = 'voicevox-status loading';
        
        // まずVOICEVOXの接続状態をチェック
        const isVoicevoxRunning = await window.electronAPI.checkVoicevoxStatus();
        
        if (!isVoicevoxRunning) {
            voicevoxStatus.textContent = '先にVOICEVOXを起動してください';
            voicevoxStatus.className = 'voicevox-status error';
            
            // デフォルトオプションのみ設定
            const createDefaultOption = (value, text) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = text;
                return option;
            };
            
            // スピーカー選択をクリア
            chatSpeakerSelect.innerHTML = '';
            komochiSpeakerSelect.innerHTML = '';
            if (speakerForWordSelect) {
                speakerForWordSelect.innerHTML = '';
            }
            
            chatSpeakerSelect.appendChild(createDefaultOption('1', 'ずんだもん（ノーマル）'));
            komochiSpeakerSelect.appendChild(createDefaultOption('3', 'ずんだもん（ツンツン）'));
            if (speakerForWordSelect) {
                speakerForWordSelect.appendChild(createDefaultOption('1', 'ずんだもん（ノーマル）'));
            }
            
            addChatMessage('システム', 'VOICEVOXが起動していません。先にVOICEVOXを起動してから話者リストを更新してください。', 'error');
            return;
        }
        
        const speakers = await window.electronAPI.getSpeakers();
        
        // スピーカー選択をクリア
        chatSpeakerSelect.innerHTML = '';
        komochiSpeakerSelect.innerHTML = '';
        if (speakerForWordSelect) {
            speakerForWordSelect.innerHTML = '';
        }
        
        if (speakers && speakers.length > 0) {
            // 話者とスタイルを展開してオプションを作成
            speakers.forEach(speaker => {
                if (speaker.styles && speaker.styles.length > 0) {
                    speaker.styles.forEach(style => {
                        // チャット読み上げ用話者選択
                        const option1 = document.createElement('option');
                        option1.value = style.id;
                        option1.textContent = `${speaker.name}（${style.name}）`;
                        chatSpeakerSelect.appendChild(option1);
                        
                        // こもち用話者選択
                        const option2 = document.createElement('option');
                        option2.value = style.id;
                        option2.textContent = `${speaker.name}（${style.name}）`;
                        komochiSpeakerSelect.appendChild(option2);
                        
                        // 単語別話者設定用話者選択
                        if (speakerForWordSelect) {
                            const option3 = document.createElement('option');
                            option3.value = style.id;
                            option3.textContent = `${speaker.name}（${style.name}）`;
                            speakerForWordSelect.appendChild(option3);
                        }
                    });
                }
            });
            
            // 読み上げ設定を復元
            const readingSettings = await window.electronAPI.loadReadingSettings();
            if (readingSettings) {
                if (readingSettings.chatSpeakerId && chatSpeakerSelect.querySelector(`option[value="${readingSettings.chatSpeakerId}"]`)) {
                    chatSpeakerSelect.value = readingSettings.chatSpeakerId;
                }
                if (readingSettings.komochiSpeakerId && komochiSpeakerSelect.querySelector(`option[value="${readingSettings.komochiSpeakerId}"]`)) {
                    komochiSpeakerSelect.value = readingSettings.komochiSpeakerId;
                }
            }
            
            voicevoxStatus.textContent = `話者リスト読み込み完了（${chatSpeakerSelect.options.length}件）`;
            voicevoxStatus.className = 'voicevox-status success';
            addChatMessage('システム', `VOICEVOX話者一覧を読み込みました（${chatSpeakerSelect.options.length}件）`, 'system');
        } else {
            // デフォルトオプション
            const createDefaultOption = (value, text) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = text;
                return option;
            };
            
            chatSpeakerSelect.appendChild(createDefaultOption('1', 'ずんだもん（ノーマル）'));
            komochiSpeakerSelect.appendChild(createDefaultOption('3', 'ずんだもん（ツンツン）'));
            if (speakerForWordSelect) {
                speakerForWordSelect.appendChild(createDefaultOption('1', 'ずんだもん（ノーマル）'));
            }
            
            voicevoxStatus.textContent = '話者リスト取得に失敗しました';
            voicevoxStatus.className = 'voicevox-status error';
            addChatMessage('システム', 'VOICEVOX話者一覧の取得に失敗しました。デフォルト話者を使用します。', 'error');
        }
        
    } catch (error) {
        console.error('話者読み込みエラー:', error);
        voicevoxStatus.textContent = 'エラーが発生しました';
        voicevoxStatus.className = 'voicevox-status error';
        addChatMessage('システム', `話者読み込みエラー: ${error.message}`, 'error');
    } finally {
        refreshSpeakersBtn.disabled = false;
        refreshSpeakersBtn.textContent = 'VOICEVOX話者リスト更新';
        
        // 話者リスト更新後に単語別話者設定のリストも更新
        updateWordSpeakerList();
    }
}

/**
 * スピーカー変更時の処理
 */
/**
 * チャンネルURL履歴を読み込み
 */
async function loadChannelUrlHistory() {
    try {
        const urlData = await window.electronAPI.loadChannelUrl();
        
        // 最後に使用したURLを入力フィールドに設定
        if (urlData.lastChannelUrl) {
            channelUrlInput.value = urlData.lastChannelUrl;
        }
        
        // 履歴をdatalistに追加
        updateChannelUrlHistory(urlData.channelUrlHistory || []);
        
    } catch (error) {
        console.error('チャンネルURL履歴読み込みエラー:', error);
    }
}

/**
 * チャンネルURL履歴を更新
 */
function updateChannelUrlHistory(history) {
    // 既存のオプションをクリア
    channelUrlHistory.innerHTML = '';
    
    // 履歴をオプションとして追加
    history.forEach(url => {
        const option = document.createElement('option');
        option.value = url;
        channelUrlHistory.appendChild(option);
    });
}

/**
 * チャンネルURL保存処理
 */
async function handleSaveChannelUrl() {
    try {
        const channelUrl = channelUrlInput.value.trim();
        
        if (!channelUrl) {
            showError('保存するチャンネルURLを入力してください');
            return;
        }
        
        // URLの簡単な検証
        if (!channelUrl.includes('youtube.com/')) {
            showError('有効なYouTubeチャンネルURLを入力してください');
            return;
        }
        
        // 保存実行
        const result = await window.electronAPI.saveChannelUrl(channelUrl);
        
        if (result.success) {
            addChatMessage('システム', `チャンネルURL保存完了: ${channelUrl}`, 'system');
            
            // 履歴を再読み込み
            await loadChannelUrlHistory();
        } else {
            showError('チャンネルURL保存失敗: ' + result.error);
        }
        
    } catch (error) {
        console.error('チャンネルURL保存エラー:', error);
        showError('チャンネルURL保存エラー: ' + error.message);
    }
}

/**
 * スキップ用NGワード保存処理
 */
async function handleSaveNgWordsSkip() {
    try {
        const ngWordsText = ngWordsSkipTextarea.value.trim();
        const ngWords = ngWordsText ? ngWordsText.split('\n').map(word => word.trim()).filter(word => word) : [];
        
        const result = await window.electronAPI.saveNgWordsSkip(ngWords);
        if (result.success) {
            addChatMessage('システム', `スキップ用NGワードを保存しました (${ngWords.length}件)`, 'system');
        } else {
            showError('スキップ用NGワード保存失敗: ' + result.error);
        }
    } catch (error) {
        console.error('スキップ用NGワード保存エラー:', error);
        showError('スキップ用NGワード保存エラー: ' + error.message);
    }
}

/**
 * 除去用NGワード保存処理
 */
async function handleSaveNgWordsRemove() {
    try {
        const ngWordsText = ngWordsRemoveTextarea.value.trim();
        const ngWords = ngWordsText ? ngWordsText.split('\n').map(word => word.trim()).filter(word => word) : [];
        
        const result = await window.electronAPI.saveNgWordsRemove(ngWords);
        if (result.success) {
            addChatMessage('システム', `除去用NGワードを保存しました (${ngWords.length}件)`, 'system');
        } else {
            showError('除去用NGワード保存失敗: ' + result.error);
        }
    } catch (error) {
        console.error('除去用NGワード保存エラー:', error);
        showError('除去用NGワード保存エラー: ' + error.message);
    }
}

/**
 * NGワード保存処理（旧関数の互換性維持）
 */
async function handleSaveNgWords() {
    try {
        const ngWordsText = ngWordsTextarea?.value?.trim() || '';
        const ngWords = ngWordsText ? ngWordsText.split('\n').map(word => word.trim()).filter(word => word) : [];
        const ngWordMode = document.getElementById('ngWordMode')?.value || 'skip';
        
        // NGワードとモードを同時に保存
        const ngWordResult = await window.electronAPI.saveNgWords(ngWords);
        const modeResult = await window.electronAPI.saveNgWordMode(ngWordMode);
        
        if (ngWordResult.success && modeResult.success) {
            addChatMessage('システム', `NGワード設定保存完了: ${ngWords.length}件（モード: ${ngWordMode === 'skip' ? 'スキップ' : '除去'}）`, 'system');
        } else {
            showError('NGワード保存失敗: ' + (ngWordResult.error || modeResult.error));
        }
        
    } catch (error) {
        console.error('NGワード保存エラー:', error);
        showError('NGワード保存エラー: ' + error.message);
    }
}

/**
 * スキップ用NGワード読み込み処理
 */
async function loadNgWordsSkip() {
    try {
        const ngWords = await window.electronAPI.loadNgWordsSkip();
        if (ngWords && Array.isArray(ngWords)) {
            ngWordsSkipTextarea.value = ngWords.join('\n');
        }
    } catch (error) {
        console.error('スキップ用NGワード読み込みエラー:', error);
    }
}

/**
 * 除去用NGワード読み込み処理
 */
async function loadNgWordsRemove() {
    try {
        const ngWords = await window.electronAPI.loadNgWordsRemove();
        if (ngWords && Array.isArray(ngWords)) {
            ngWordsRemoveTextarea.value = ngWords.join('\n');
        }
    } catch (error) {
        console.error('除去用NGワード読み込みエラー:', error);
    }
}

/**
 * NGワード読み込み処理（旧関数の互換性維持）
 */
async function loadNgWords() {
    try {
        // NGワードリストを読み込み
        const ngWords = await window.electronAPI.loadNgWords();
        if (ngWords && Array.isArray(ngWords) && ngWordsTextarea) {
            ngWordsTextarea.value = ngWords.join('\n');
        }
        
        // NGワードモードを読み込み
        const ngWordMode = await window.electronAPI.loadNgWordMode();
        if (ngWordMode) {
            const modeSelect = document.getElementById('ngWordMode');
            if (modeSelect) {
                modeSelect.value = ngWordMode;
            }
        }
        
    } catch (error) {
        console.error('NGワード読み込みエラー:', error);
    }
}

/**
 * 名前読み方追加処理
 */
async function handleAddPronunciation() {
    const originalName = originalNameInput.value.trim();
    const pronunciationName = pronunciationNameInput.value.trim();
    
    if (!originalName || !pronunciationName) {
        showError('元の名前と読み方の両方を入力してください');
        return;
    }
    
    // グローバル変数として名前読み方を管理
    if (!window.namePronunciations) {
        window.namePronunciations = {};
    }
    
    window.namePronunciations[originalName] = pronunciationName;
    
    // 入力フィールドをクリア
    originalNameInput.value = '';
    pronunciationNameInput.value = '';
    
    // リストを更新
    updatePronunciationList();
    
    // 追加後に設定を保存
    handleSavePronunciations();
    
    addChatMessage('システム', `名前読み方追加: ${originalName} → ${pronunciationName}`, 'system');
}

/**
 * 名前読み方保存処理
 */
async function handleSavePronunciations() {
    try {
        const pronunciations = window.namePronunciations || {};
        const result = await window.electronAPI.saveNamePronunciations(pronunciations);
        
        if (result.success) {
            addChatMessage('システム', `名前読み方保存完了: ${Object.keys(pronunciations).length}件`, 'system');
        } else {
            showError('名前読み方保存失敗: ' + result.error);
        }
        
    } catch (error) {
        console.error('名前読み方保存エラー:', error);
        showError('名前読み方保存エラー: ' + error.message);
    }
}

/**
 * 名前読み方読み込み処理
 */
async function loadNamePronunciations() {
    try {
        const pronunciations = await window.electronAPI.loadNamePronunciations();
        window.namePronunciations = pronunciations;
        updatePronunciationList();
    } catch (error) {
        console.error('名前読み方読み込みエラー:', error);
        window.namePronunciations = {};
    }
}

/**
 * 名前読み方リスト更新
 */
function updatePronunciationList() {
    const pronunciations = window.namePronunciations || {};
    pronunciationList.innerHTML = '';
    
    Object.entries(pronunciations).forEach(([original, pronunciation]) => {
        const item = document.createElement('div');
        item.className = 'pronunciation-item';
        
        const textSpan = document.createElement('span');
        textSpan.className = 'pronunciation-text';
        textSpan.textContent = `${original} → ${pronunciation}`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'pronunciation-delete';
        deleteBtn.textContent = '削除';
        deleteBtn.addEventListener('click', () => {
            console.log('名前読み方削除ボタンがクリックされました:', original);
            deletePronunciation(original);
        });
        
        item.appendChild(textSpan);
        item.appendChild(deleteBtn);
        pronunciationList.appendChild(item);
    });
}

/**
 * 名前読み方削除
 */
function deletePronunciation(originalName) {
    if (window.namePronunciations && window.namePronunciations[originalName]) {
        delete window.namePronunciations[originalName];
        updatePronunciationList();
        
        // 削除後に設定を保存
        handleSavePronunciations();
        
        addChatMessage('システム', `名前読み方削除: ${originalName}`, 'system');
    }
}

/**
 * 音声キューをクリア
 */
async function handleClearAudioQueue() {
    try {
        const result = await window.electronAPI.clearAudioQueue();
        if (result.success) {
            addChatMessage('システム', '音声キューをクリアしました', 'system');
        } else {
            showError('音声キュークリアに失敗しました: ' + result.error);
        }
    } catch (error) {
        console.error('音声キュークリアエラー:', error);
        showError('音声キュークリアエラー: ' + error.message);
    }
}

/**
 * 読み上げ設定変更処理
 */
async function handleReadingSettingsChange() {
    await saveReadingSettings();
}

/**
 * 読み上げ設定保存
 */
async function saveReadingSettings() {
    try {
        const settings = {
            readAllChats: readAllChatsCheckbox.checked,
            chatSpeakerId: parseInt(chatSpeakerSelect.value),
            komochiSpeakerId: parseInt(komochiSpeakerSelect.value),
            readUserName: readUserNameCheckbox.checked,
            readTimestamp: readTimestampCheckbox.checked
        };
        
        const result = await window.electronAPI.saveReadingSettings(settings);
        
        if (result.success) {
            console.log('読み上げ設定保存完了');
        }
        
    } catch (error) {
        console.error('読み上げ設定保存エラー:', error);
    }
}

/**
 * 読み上げ設定読み込み
 */
async function loadReadingSettings() {
    try {
        const settings = await window.electronAPI.loadReadingSettings();
        
        readAllChatsCheckbox.checked = settings.readAllChats !== false;
        readUserNameCheckbox.checked = settings.readUserName !== false;
        readTimestampCheckbox.checked = settings.readTimestamp === true;
        
        // 話者選択の初期値設定（話者一覧読み込み後に実行される）
        setTimeout(() => {
            if (chatSpeakerSelect.querySelector(`option[value="${settings.chatSpeakerId}"]`)) {
                chatSpeakerSelect.value = settings.chatSpeakerId;
            }
            if (komochiSpeakerSelect.querySelector(`option[value="${settings.komochiSpeakerId}"]`)) {
                komochiSpeakerSelect.value = settings.komochiSpeakerId;
            }
        }, 1000);
        
    } catch (error) {
        console.error('読み上げ設定読み込みエラー:', error);
    }
}

/**
 * 性格設定保存
 */
async function handleSavePersonality() {
    try {
        const personality = personalityTextarea.value.trim();
        const result = await window.electronAPI.savePersonality(personality);
        
        if (result.success) {
            addChatMessage('システム', '性格設定を保存しました', 'system');
        } else {
            showError('性格設定保存に失敗しました: ' + result.error);
        }
    } catch (error) {
        console.error('性格設定保存エラー:', error);
        showError('性格設定保存エラー: ' + error.message);
    }
}

/**
 * 性格設定読み込み
 */
async function loadPersonality() {
    try {
        const personality = await window.electronAPI.loadPersonality();
        personalityTextarea.value = personality || '';
    } catch (error) {
        console.error('性格設定読み込みエラー:', error);
    }
}

/**
 * VOICEVOX辞書追加
 */
async function handleAddDictionary() {
    try {
        const surface = dictSurfaceInput.value.trim();
        const reading = dictReadingInput.value.trim();
        const partOfSpeech = dictPartOfSpeechSelect.value;
        
        if (!surface || !reading) {
            showError('表記と読みを入力してください');
            return;
        }
        
        const result = await window.electronAPI.addDictionary({
            surface,
            reading,
            partOfSpeech
        });
        
        if (result.success) {
            addChatMessage('システム', `辞書に追加しました: ${surface} → ${reading}`, 'system');
            dictSurfaceInput.value = '';
            dictReadingInput.value = '';
            loadDictionary(); // 辞書一覧を更新
        } else {
            showError('辞書追加に失敗しました: ' + result.error);
        }
    } catch (error) {
        console.error('辞書追加エラー:', error);
        showError('辞書追加エラー: ' + error.message);
    }
}

/**
 * VOICEVOX辞書一覧読み込み
 */
async function loadDictionary() {
    try {
        const dictionaries = await window.electronAPI.getDictionaries();
        displayDictionaries(dictionaries);
    } catch (error) {
        console.error('辞書読み込みエラー:', error);
    }
}

/**
 * VOICEVOX辞書更新
 */
async function handleRefreshDictionary() {
    try {
        addChatMessage('システム', '辞書を更新中...', 'system');
        await loadDictionary();
        addChatMessage('システム', '辞書更新完了', 'system');
    } catch (error) {
        console.error('辞書更新エラー:', error);
        showError('辞書更新エラー: ' + error.message);
    }
}

/**
 * 辞書一覧表示
 */
function displayDictionaries(dictionaries) {
    dictionaryList.innerHTML = '';
    
    if (!Array.isArray(dictionaries) || dictionaries.length === 0) {
        dictionaryList.innerHTML = '<div class="dictionary-item">辞書データがありません</div>';
        return;
    }
    
    dictionaries.forEach((dict, index) => {
        const item = document.createElement('div');
        item.className = 'dictionary-item';
        item.innerHTML = `
            <div class="dictionary-text">
                <div class="dictionary-surface">${escapeHtml(dict.surface)}</div>
                <div class="dictionary-reading">${escapeHtml(dict.reading)} (${getPartOfSpeechName(dict.partOfSpeech)})</div>
            </div>
            <button class="dictionary-delete" onclick="deleteDictionary('${dict.uuid}')">削除</button>
        `;
        dictionaryList.appendChild(item);
    });
}

/**
 * 辞書項目削除
 */
async function deleteDictionary(uuid) {
    try {
        const result = await window.electronAPI.deleteDictionary(uuid);
        if (result.success) {
            addChatMessage('システム', '辞書項目を削除しました', 'system');
            loadDictionary(); // 辞書一覧を更新
        } else {
            showError('辞書削除に失敗しました: ' + result.error);
        }
    } catch (error) {
        console.error('辞書削除エラー:', error);
        showError('辞書削除エラー: ' + error.message);
    }
}

/**
 * 品詞名取得
 */
function getPartOfSpeechName(partOfSpeech) {
    const names = {
        'PROPER_NOUN': '固有名詞',
        'COMMON_NOUN': '普通名詞',
        'VERB': '動詞',
        'ADJECTIVE': '形容詞',
        'SUFFIX': '接尾辞'
    };
    return names[partOfSpeech] || partOfSpeech;
}

// グローバル関数として削除機能を公開
window.deletePronunciation = deletePronunciation;
window.deleteDictionary = deleteDictionary;
window.removeEmojiReading = removeEmojiReading;
window.removeTriggerWord = removeTriggerWord;
window.removeChatReplacement = removeChatReplacement;
window.removeWordSpeaker = removeWordSpeaker;

/**
 * トリガーワード表示を更新
 */
function updateTriggerWordsDisplay() {
  const triggerWordsList = document.getElementById('triggerWordsList');
  triggerWordsList.innerHTML = '';
  
  triggerWords.forEach((word, index) => {
    const wordItem = document.createElement('div');
    wordItem.className = 'trigger-word-item';
    wordItem.innerHTML = `
      <span>${word}</span>
      <button class="remove-trigger-word" onclick="removeTriggerWord(${index})" title="削除">×</button>
    `;
    triggerWordsList.appendChild(wordItem);
  });
}

/**
 * トリガーワード追加
 */
function addTriggerWord() {
  const input = document.getElementById('newTriggerWord');
  const word = input.value.trim();
  
  if (word && !triggerWords.includes(word)) {
    triggerWords.push(word);
    input.value = '';
    updateTriggerWordsDisplay();
  }
}

/**
 * トリガーワード削除
 */
function removeTriggerWord(index) {
  triggerWords.splice(index, 1);
  updateTriggerWordsDisplay();
  
  // 削除後に設定を保存
  saveTriggerWords();
}

/**
 * トリガーワード保存
 */
async function saveTriggerWords() {
  try {
    const result = await window.electronAPI.saveTriggerWords(triggerWords);
    if (result.success) {
      showStatus('トリガーワード設定を保存しました', 'success');
    } else {
      showStatus('トリガーワード設定の保存に失敗しました', 'error');
    }
  } catch (error) {
    console.error('トリガーワード保存エラー:', error);
    showStatus('トリガーワード設定の保存に失敗しました', 'error');
  }
}

/**
 * トリガーワード読み込み
 */
async function loadTriggerWords() {
  try {
    const loadedWords = await window.electronAPI.getTriggerWords();
    triggerWords = Array.isArray(loadedWords) ? loadedWords : ['こもち'];
    updateTriggerWordsDisplay();
  } catch (error) {
    console.error('トリガーワード読み込みエラー:', error);
    triggerWords = ['こもち'];
    updateTriggerWordsDisplay();
  }
}

/**
 * カスタム絵文字読み方を追加
 */
function addEmojiReading() {
    const emojiName = emojiNameInput.value.trim();
    const reading = emojiReadingInput.value.trim();
    
    if (!emojiName || !reading) {
        addChatMessage('システム', '絵文字名と読み方を入力してください', 'error');
        return;
    }
    
    // コロンが含まれていない場合は自動で追加
    const normalizedEmojiName = emojiName.startsWith(':') && emojiName.endsWith(':') 
        ? emojiName 
        : `:${emojiName.replace(/:/g, '')}:`;
    
    emojiReadings[normalizedEmojiName] = reading;
    
    emojiNameInput.value = '';
    emojiReadingInput.value = '';
    
    updateEmojiReadingList();
    
    // 追加後に設定を保存
    saveEmojiReadings();
    
    addChatMessage('システム', `絵文字読み方を追加しました: ${normalizedEmojiName} → ${reading}`, 'system');
}

/**
 * カスタム絵文字読み方リストを更新
 */
function updateEmojiReadingList() {
    emojiReadingList.innerHTML = '';
    
    Object.entries(emojiReadings).forEach(([emoji, reading]) => {
        const item = document.createElement('div');
        item.className = 'emoji-reading-item';
        
        const contentDiv = document.createElement('div');
        
        const emojiNameSpan = document.createElement('span');
        emojiNameSpan.className = 'emoji-name';
        emojiNameSpan.textContent = emoji;
        
        const emojiReadingSpan = document.createElement('span');
        emojiReadingSpan.className = 'emoji-reading';
        emojiReadingSpan.textContent = `→ ${reading}`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'emoji-remove-btn';
        deleteBtn.textContent = '削除';
        deleteBtn.addEventListener('click', () => {
            console.log('絵文字削除ボタンがクリックされました:', emoji);
            removeEmojiReading(emoji);
        });
        
        contentDiv.appendChild(emojiNameSpan);
        contentDiv.appendChild(emojiReadingSpan);
        
        item.appendChild(contentDiv);
        item.appendChild(deleteBtn);
        
        emojiReadingList.appendChild(item);
    });
}

/**
 * カスタム絵文字読み方を削除
 */
function removeEmojiReading(emoji) {
    delete emojiReadings[emoji];
    updateEmojiReadingList();
    
    // 削除後に設定を保存
    saveEmojiReadings();
    
    addChatMessage('システム', `絵文字読み方を削除しました: ${emoji}`, 'system');
}

/**
 * カスタム絵文字読み方設定を保存
 */
async function saveEmojiReadings() {
    try {
        const result = await window.electronAPI.saveEmojiReadings(emojiReadings);
        
        if (result.success) {
            addChatMessage('システム', 'カスタム絵文字読み方設定を保存しました', 'system');
        } else {
            addChatMessage('システム', `絵文字読み方保存エラー: ${result.error}`, 'error');
        }
        
    } catch (error) {
        console.error('絵文字読み方保存エラー:', error);
        addChatMessage('システム', `絵文字読み方保存エラー: ${error.message}`, 'error');
    }
}

/**
 * カスタム絵文字読み方設定を読み込み
 */
async function loadEmojiReadings() {
    try {
        const loadedReadings = await window.electronAPI.loadEmojiReadings();
        
        if (loadedReadings && typeof loadedReadings === 'object') {
            emojiReadings = loadedReadings;
            updateEmojiReadingList();
            console.log('カスタム絵文字読み方設定を読み込みました:', Object.keys(emojiReadings).length, '件');
        }
        
    } catch (error) {
        console.error('絵文字読み方読み込みエラー:', error);
    }
}

// ===== スパム対策機能 =====

/**
 * スパム統計を更新表示
 */
async function updateSpamStatistics() {
    try {
        const stats = await window.electronAPI.getSpamStatistics();
        
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('usersInCooldown').textContent = stats.usersInCooldown;
        document.getElementById('activeUsers').textContent = stats.activeUsers;
        document.getElementById('recentActivity').textContent = stats.recentActivity;
        
        // トップスパマーリストを更新
        const topSpammersList = document.getElementById('topSpammersList');
        topSpammersList.innerHTML = '';
        
        if (stats.topSpammers.length === 0) {
            topSpammersList.innerHTML = '<div class="spammer-item"><span style="color: #4CAF50;">違反者なし</span></div>';
        } else {
            stats.topSpammers.forEach(spammer => {
                const item = document.createElement('div');
                item.className = 'spammer-item';
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'spammer-name';
                nameSpan.textContent = spammer.userName;
                
                const countSpan = document.createElement('span');
                countSpan.className = 'spammer-count';
                countSpan.textContent = `${spammer.spamCount}回`;
                
                const statusSpan = document.createElement('span');
                statusSpan.className = spammer.isInCooldown ? 'spammer-cooldown' : 'spammer-status';
                statusSpan.textContent = spammer.isInCooldown ? 'クールダウン中' : spammer.lastMessage;
                
                item.appendChild(nameSpan);
                item.appendChild(countSpan);
                item.appendChild(statusSpan);
                
                topSpammersList.appendChild(item);
            });
        }
        
    } catch (error) {
        console.error('スパム統計取得エラー:', error);
        showError('スパム統計取得エラー: ' + error.message);
    }
}

/**
 * 全スパム履歴リセット
 */
async function resetAllSpamHistory() {
    if (!confirm('全ユーザーのスパム履歴をリセットしますか？この操作は取り消せません。')) {
        return;
    }
    
    try {
        const result = await window.electronAPI.resetSpamHistory();
        addChatMessage('システム', result, 'system');
        await updateSpamStatistics();
    } catch (error) {
        console.error('スパム履歴リセットエラー:', error);
        showError('スパム履歴リセットエラー: ' + error.message);
    }
}

/**
 * 個別ユーザーのスパム履歴リセット
 */
async function resetUserSpamHistory() {
    const userName = document.getElementById('userResetInput').value.trim();
    if (!userName) {
        showError('ユーザー名を入力してください');
        return;
    }
    
    if (!confirm(`${userName} のスパム履歴をリセットしますか？`)) {
        return;
    }
    
    try {
        const result = await window.electronAPI.resetSpamHistory(userName);
        addChatMessage('システム', result, 'system');
        document.getElementById('userResetInput').value = '';
        await updateSpamStatistics();
    } catch (error) {
        console.error('ユーザースパム履歴リセットエラー:', error);
        showError('ユーザースパム履歴リセットエラー: ' + error.message);
    }
}

/**
 * スパム対策設定を保存
 */
async function saveAntiSpamSettings() {
    try {
        const settings = {
            maxMessagesPerMinute: parseInt(document.getElementById('maxMessagesPerMinute').value) || 5,
            maxMessagesPerFiveMinutes: parseInt(document.getElementById('maxMessagesPerFiveMinutes').value) || 15,
            duplicateThreshold: parseFloat(document.getElementById('duplicateThreshold').value) || 0.8,
            cooldownDuration: parseInt(document.getElementById('cooldownDuration').value) * 1000 || 30000 // 秒をミリ秒に変換
        };
        
        const result = await window.electronAPI.saveAntiSpamSettings(settings);
        
        if (result.success) {
            addChatMessage('システム', 'スパム対策設定を保存しました', 'system');
        } else {
            showError('スパム対策設定保存失敗: ' + result.error);
        }
        
    } catch (error) {
        console.error('スパム対策設定保存エラー:', error);
        showError('スパム対策設定保存エラー: ' + error.message);
    }
}

/**
 * スパム対策設定を読み込み
 */
async function loadAntiSpamSettings() {
    try {
        const settings = await window.electronAPI.loadAntiSpamSettings();
        
        if (settings) {
            document.getElementById('maxMessagesPerMinute').value = settings.maxMessagesPerMinute || 5;
            document.getElementById('maxMessagesPerFiveMinutes').value = settings.maxMessagesPerFiveMinutes || 15;
            document.getElementById('duplicateThreshold').value = settings.duplicateThreshold || 0.8;
            document.getElementById('cooldownDuration').value = Math.floor((settings.cooldownDuration || 30000) / 1000); // ミリ秒を秒に変換
        }
        
    } catch (error) {
        console.error('スパム対策設定読み込みエラー:', error);
    }
}


// ===== 音声設定機能 =====

/**
 * 音声設定スライダーの初期化
 */
function initVoiceSettings() {
    // チャット音量スライダー
    const chatVolumeSlider = document.getElementById('chatVolumeSlider');
    const chatVolumeValue = document.getElementById('chatVolumeValue');
    
    chatVolumeSlider?.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        chatVolumeValue.textContent = `${value}%`;
        saveChatVoiceSettings();
    });
    
    // チャット話速スライダー
    const chatSpeedSlider = document.getElementById('chatSpeedSlider');
    const chatSpeedValue = document.getElementById('chatSpeedValue');
    
    chatSpeedSlider?.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        const speed = value / 100;
        chatSpeedValue.textContent = `${speed.toFixed(1)}x`;
        saveChatVoiceSettings();
    });
    
    // こもち音量スライダー
    const komochiVolumeSlider = document.getElementById('komochiVolumeSlider');
    const komochiVolumeValue = document.getElementById('komochiVolumeValue');
    
    komochiVolumeSlider?.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        komochiVolumeValue.textContent = `${value}%`;
        saveKomochiVoiceSettings();
    });
    
    // こもち話速スライダー
    const komochiSpeedSlider = document.getElementById('komochiSpeedSlider');
    const komochiSpeedValue = document.getElementById('komochiSpeedValue');
    
    komochiSpeedSlider?.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        const speed = value / 100;
        komochiSpeedValue.textContent = `${speed.toFixed(1)}x`;
        saveKomochiVoiceSettings();
    });
}

/**
 * チャット音声設定を保存
 */
async function saveChatVoiceSettings() {
    try {
        const volume = parseInt(document.getElementById('chatVolumeSlider').value) / 100;
        const speed = parseInt(document.getElementById('chatSpeedSlider').value) / 100;
        
        await window.electronAPI.saveChatVoiceSettings({ volume, speed });
    } catch (error) {
        console.error('チャット音声設定保存エラー:', error);
    }
}

/**
 * こもち音声設定を保存
 */
async function saveKomochiVoiceSettings() {
    try {
        const volume = parseInt(document.getElementById('komochiVolumeSlider').value) / 100;
        const speed = parseInt(document.getElementById('komochiSpeedSlider').value) / 100;
        
        await window.electronAPI.saveKomochiVoiceSettings({ volume, speed });
    } catch (error) {
        console.error('こもち音声設定保存エラー:', error);
    }
}

/**
 * 音声設定を読み込み
 */
async function loadVoiceSettings() {
    try {
        // チャット音声設定
        const chatSettings = await window.electronAPI.loadChatVoiceSettings();
        if (chatSettings) {
            const chatVolumeSlider = document.getElementById('chatVolumeSlider');
            const chatVolumeValue = document.getElementById('chatVolumeValue');
            const chatSpeedSlider = document.getElementById('chatSpeedSlider');
            const chatSpeedValue = document.getElementById('chatSpeedValue');
            
            if (chatVolumeSlider && chatSettings.volume !== undefined) {
                chatVolumeSlider.value = Math.round(chatSettings.volume * 100);
                chatVolumeValue.textContent = `${Math.round(chatSettings.volume * 100)}%`;
            }
            
            if (chatSpeedSlider && chatSettings.speed !== undefined) {
                chatSpeedSlider.value = Math.round(chatSettings.speed * 100);
                chatSpeedValue.textContent = `${chatSettings.speed.toFixed(1)}x`;
            }
        }
        
        // こもち音声設定
        const komochiSettings = await window.electronAPI.loadKomochiVoiceSettings();
        if (komochiSettings) {
            const komochiVolumeSlider = document.getElementById('komochiVolumeSlider');
            const komochiVolumeValue = document.getElementById('komochiVolumeValue');
            const komochiSpeedSlider = document.getElementById('komochiSpeedSlider');
            const komochiSpeedValue = document.getElementById('komochiSpeedValue');
            
            if (komochiVolumeSlider && komochiSettings.volume !== undefined) {
                komochiVolumeSlider.value = Math.round(komochiSettings.volume * 100);
                komochiVolumeValue.textContent = `${Math.round(komochiSettings.volume * 100)}%`;
            }
            
            if (komochiSpeedSlider && komochiSettings.speed !== undefined) {
                komochiSpeedSlider.value = Math.round(komochiSettings.speed * 100);
                komochiSpeedValue.textContent = `${komochiSettings.speed.toFixed(1)}x`;
            }
        }
        
    } catch (error) {
        console.error('音声設定読み込みエラー:', error);
    }
}

// ===== 設定ファイル管理機能 =====

/**
 * 設定フォルダーを開く
 */
async function openConfigFolder() {
    try {
        console.log('🚀 openConfigFolder: 処理開始');
        
        // window.electronAPIが存在するかチェック
        if (!window.electronAPI) {
            console.error('❌ window.electronAPIが存在しません');
            showError('Electron APIが利用できません');
            return;
        }
        
        // openConfigFolder関数が存在するかチェック
        if (!window.electronAPI.openConfigFolder) {
            console.error('❌ window.electronAPI.openConfigFolderが存在しません');
            showError('設定フォルダーを開く機能が利用できません');
            return;
        }
        
        // ユーザーに処理中であることを通知
        addChatMessage('システム', '🔄 設定フォルダーを開いています...', 'system');
        
        console.log('🔄 openConfigFolder: electronAPI呼び出し開始');
        const startTime = Date.now();
        const result = await window.electronAPI.openConfigFolder();
        const endTime = Date.now();
        console.log(`🔄 openConfigFolder: electronAPI呼び出し完了 (${endTime - startTime}ms)`, result);
        
        if (result && result.success) {
            console.log('✅ openConfigFolder: 成功');
            const methodText = result.method === 'explorer-select' ? 'Windows Explorer (ファイル選択)' : 
                              result.method === 'explorer-folder' ? 'Windows Explorer (フォルダー)' :
                              result.method === 'cmd-start' ? 'CMD Start' :
                              result.method === 'showItemInFolder' ? 'ファイル選択表示' :
                              result.method === 'openPath' ? 'システム標準' : '不明';
            addChatMessage('システム', `✅ 設定フォルダーを開きました (${methodText})`, 'system');
        } else {
            const errorMsg = result?.error || '不明なエラー';
            console.error('❌ openConfigFolder: エラー結果:', errorMsg);
            showError('❌ 設定フォルダーを開けませんでした: ' + errorMsg);
            
            // 手動でパスを表示する
            try {
                console.log('🔄 手動パス表示のため設定パスを取得...');
                const configPath = await window.electronAPI.getConfigPath();
                if (configPath) {
                    addChatMessage('システム', `📁 手動でこのパスを開いてください: ${configPath}`, 'system');
                    addChatMessage('システム', '📋 上記パスをクリックしてコピーできます', 'system');
                }
            } catch (pathError) {
                console.error('❌ 設定パス取得エラー:', pathError);
            }
        }
    } catch (error) {
        console.error('💥 openConfigFolder: 例外発生:', error);
        showError('💥 設定フォルダーを開けませんでした: ' + error.message);
        
        // フォールバック: 設定パスを表示
        try {
            const configPath = await window.electronAPI.getConfigPath();
            if (configPath) {
                addChatMessage('システム', `📁 手動でこのパスを開いてください: ${configPath}`, 'system');
            }
        } catch (pathError) {
            console.error('❌ 設定パス取得エラー:', pathError);
            addChatMessage('システム', '📁 手動パス: C:\\Users\\mikan\\.komochi-chat-config.json', 'system');
        }
    }
}

/**
 * 設定をエクスポート
 */
async function exportConfig() {
    try {
        const result = await window.electronAPI.exportConfig();
        if (result.success) {
            addChatMessage('システム', `設定をエクスポートしました: ${result.filePath}`, 'system');
        } else {
            showError('設定エクスポート失敗: ' + result.error);
        }
    } catch (error) {
        console.error('設定エクスポートエラー:', error);
        showError('設定エクスポートエラー: ' + error.message);
    }
}

/**
 * 設定をインポート
 */
async function importConfig() {
    try {
        const result = await window.electronAPI.importConfig();
        if (result.success) {
            addChatMessage('システム', '設定をインポートしました。アプリケーションを再起動してください。', 'system');
            // 設定を再読み込み
            await loadAllSettings();
        } else if (result.cancelled) {
            // ユーザーがキャンセルした場合は何もしない
        } else {
            showError('設定インポート失敗: ' + result.error);
        }
    } catch (error) {
        console.error('設定インポートエラー:', error);
        showError('設定インポートエラー: ' + error.message);
    }
}

/**
 * 設定をリセット
 */
async function resetConfig() {
    if (!confirm('全ての設定がリセットされます。この操作は取り消せません。続行しますか？')) {
        return;
    }
    
    try {
        const result = await window.electronAPI.resetConfig();
        if (result.success) {
            addChatMessage('システム', '設定をリセットしました。アプリケーションを再起動してください。', 'system');
            // 設定を再読み込み
            await loadAllSettings();
        } else {
            showError('設定リセット失敗: ' + result.error);
        }
    } catch (error) {
        console.error('設定リセットエラー:', error);
        showError('設定リセットエラー: ' + error.message);
    }
}

/**
 * 設定ファイルパスを表示
 */
async function displayConfigPath() {
    try {
        console.log('設定ファイルパス取得開始...');
        
        const configPathDisplay = document.getElementById('configFilePath');
        if (!configPathDisplay) {
            console.error('configFilePath要素が見つかりません');
            return;
        }
        
        // 読み込み中表示
        configPathDisplay.textContent = '読み込み中...';
        
        if (!window.electronAPI || !window.electronAPI.getConfigPath) {
            throw new Error('electronAPI.getConfigPath が利用できません');
        }
        
        console.log('electronAPI.getConfigPath を呼び出します...');
        const configPath = await window.electronAPI.getConfigPath();
        console.log('取得した設定ファイルパス:', configPath);
        
        if (configPath) {
            configPathDisplay.textContent = configPath;
            configPathDisplay.title = `クリックしてコピー: ${configPath}`;
            
            // クリックでパスをコピーできるようにする
            configPathDisplay.style.cursor = 'pointer';
            configPathDisplay.onclick = async () => {
                try {
                    await navigator.clipboard.writeText(configPath);
                    addChatMessage('システム', 'ファイルパスをクリップボードにコピーしました', 'system');
                } catch (err) {
                    console.error('クリップボードコピーエラー:', err);
                    // フォールバック: 手動でのコピーを促す
                    const textArea = document.createElement('textarea');
                    textArea.value = configPath;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    addChatMessage('システム', 'ファイルパスをクリップボードにコピーしました', 'system');
                }
            };
            
            console.log('設定ファイルパス表示完了:', configPath);
        } else {
            configPathDisplay.textContent = 'エラー: パスを取得できませんでした';
            configPathDisplay.title = '';
            configPathDisplay.style.cursor = 'default';
            configPathDisplay.onclick = null;
        }
    } catch (error) {
        console.error('設定ファイルパス取得エラー:', error);
        const configPathDisplay = document.getElementById('configFilePath');
        if (configPathDisplay) {
            configPathDisplay.textContent = `エラー: ${error.message}`;
            configPathDisplay.title = '';
            configPathDisplay.style.cursor = 'default';
            configPathDisplay.onclick = null;
        }
    }
}

/**
 * 全ての設定を読み込み
 */
async function loadAllSettings() {
    await Promise.all([
        loadChannelUrl(),
        loadApiKey(),
        loadNgWords(),
        loadNgWordsSkip(),
        loadNgWordsRemove(),
        loadNamePronunciations(),
        loadEmojiReadings(),
        loadChatReplacements(),
        loadWordSpeakers(),
        loadTriggerWords(),
        loadPersonality(),
        loadAntiSpamSettings(),
        loadVoiceSettings()
    ]);
}

/**
 * DOM要素を安全に再取得する関数
 * DOMContentLoaded後に呼び出してDOM要素のnullチェックと再取得を行います
 */
function refreshDomElements() {
    console.log('🔄 DOM要素を再取得中...');
    
    // 基本的なDOM要素を再取得
    channelUrlInput = document.getElementById('channelUrl');
    connectBtn = document.getElementById('connectBtn');
    disconnectBtn = document.getElementById('disconnectBtn');
    saveChannelUrlBtn = document.getElementById('saveChannelUrlBtn');
    channelUrlHistory = document.getElementById('channelUrlHistory');
    liveUrlStatus = document.getElementById('liveUrlStatus');
    chatArea = document.getElementById('chatArea');
    chatStats = document.getElementById('chatStats');
    connectionTimeEl = document.getElementById('connectionTime');
    messageCountEl = document.getElementById('messageCount');
    filteredCountEl = document.getElementById('filteredCount');
    audioQueueStatusEl = document.getElementById('audioQueueStatus');
    clearAudioQueueBtn = document.getElementById('clearAudioQueueBtn');

    // AI設定用のDOM要素を再取得
    aiEnabledCheckbox = document.getElementById('aiEnabled');
    voiceEnabledCheckbox = document.getElementById('voiceEnabled');
    refreshSpeakersBtn = document.getElementById('refreshSpeakers');
    voicevoxStatus = document.getElementById('voicevoxStatus');
    openaiApiKeyInput = document.getElementById('openaiApiKey');
    saveApiKeyBtn = document.getElementById('saveApiKey');
    apiKeyStatus = document.getElementById('apiKeyStatus');

    // 読み上げ設定用のDOM要素を再取得
    readAllChatsCheckbox = document.getElementById('readAllChats');
    chatSpeakerSelect = document.getElementById('chatSpeakerSelect');
    komochiSpeakerSelect = document.getElementById('komochiSpeakerSelect');
    speakerSelect = document.getElementById('speakerSelect');
    readUserNameCheckbox = document.getElementById('readUserName');
    readTimestampCheckbox = document.getElementById('readTimestamp');

    // NGワード設定用のDOM要素を再取得
    ngWordsTextarea = document.getElementById('ngWordsTextarea');
    ngWordsSkipTextarea = document.getElementById('ngWordsSkipTextarea');
    saveNgWordsSkipBtn = document.getElementById('saveNgWordsSkip');
    ngWordsRemoveTextarea = document.getElementById('ngWordsRemoveTextarea');
    saveNgWordsRemoveBtn = document.getElementById('saveNgWordsRemove');

    // 名前読み方設定用のDOM要素を再取得
    originalNameInput = document.getElementById('originalName');
    pronunciationNameInput = document.getElementById('pronunciationName');
    addPronunciationBtn = document.getElementById('addPronunciation');
    pronunciationList = document.getElementById('pronunciationList');

    // テキスト置き換え設定用のDOM要素を再取得
    originalTextInput = document.getElementById('originalText');
    replacementTextInput = document.getElementById('replacementText');
    addTextReplacementBtn = document.getElementById('addTextReplacement');
    textReplacementList = document.getElementById('textReplacementList');
    saveTextReplacementsBtn = document.getElementById('saveTextReplacements');

    // 性格設定用のDOM要素を再取得
    personalityTextarea = document.getElementById('personalityTextarea');
    savePersonalityBtn = document.getElementById('savePersonality');

    // トリガーワード設定用のDOM要素を再取得
    newTriggerWordInput = document.getElementById('newTriggerWord');
    addTriggerWordBtn = document.getElementById('addTriggerWord');
    triggerWordsList = document.getElementById('triggerWordsList');
    saveTriggerWordsBtn = document.getElementById('saveTriggerWords');

    // 絵文字読み方設定用のDOM要素を再取得
    emojiNameInput = document.getElementById('emojiName');
    emojiReadingInput = document.getElementById('emojiReading');
    addEmojiReadingBtn = document.getElementById('addEmojiReading');
    emojiReadingList = document.getElementById('emojiReadingList');

    // チャット読み替え設定用のDOM要素を再取得
    originalChatWordInput = document.getElementById('originalChatWord');
    replacementChatWordInput = document.getElementById('replacementChatWord');
    addChatReplacementBtn = document.getElementById('addChatReplacement');
    chatReplacementList = document.getElementById('chatReplacementList');
    // 単語別話者設定用のDOM要素を再取得
    triggerWordForSpeakerInput = document.getElementById('triggerWordForSpeaker');
    speakerForWordSelect = document.getElementById('speakerForWord');
    addWordSpeakerBtn = document.getElementById('addWordSpeaker');
    wordSpeakerList = document.getElementById('wordSpeakerList');
    // VOICEVOX辞書登録用のDOM要素を再取得
    dictSurfaceInput = document.getElementById('dictSurface');
    dictReadingInput = document.getElementById('dictReading');
    dictPartOfSpeechSelect = document.getElementById('dictPartOfSpeech');
    addDictionaryBtn = document.getElementById('addDictionary');
    dictionaryList = document.getElementById('dictionaryList');
    refreshDictionaryBtn = document.getElementById('refreshDictionary');

    // 設定管理用のDOM要素を再取得
    openConfigFolderBtn = document.getElementById('openConfigFolder');
    exportConfigBtn = document.getElementById('exportConfig');
    importConfigBtn = document.getElementById('importConfig');
    resetConfigBtn = document.getElementById('resetConfig');
    configPathDisplay = document.getElementById('configPathDisplay');

    // ログ出力してDOM要素の取得状況を確認
    const elements = {
        channelUrlInput, connectBtn, disconnectBtn, saveChannelUrlBtn,
        chatArea, aiEnabledCheckbox, voiceEnabledCheckbox, openaiApiKeyInput,
        speakerSelect, ngWordsTextarea, ngWordsSkipTextarea, originalNameInput, personalityTextarea,
        newTriggerWordInput, addTriggerWordBtn, emojiNameInput, dictSurfaceInput,
        openConfigFolderBtn, exportConfigBtn, importConfigBtn, resetConfigBtn
    };
    
    const missingElements = [];
    const foundElements = [];
    
    for (const [name, element] of Object.entries(elements)) {
        if (element) {
            foundElements.push(name);
        } else {
            missingElements.push(name);
        }
    }
    
    console.log('✅ 取得成功したDOM要素:', foundElements.length, '個');
    if (missingElements.length > 0) {
        console.warn('⚠️ 取得できなかったDOM要素:', missingElements);
    }
    
    console.log('🔄 DOM要素再取得完了');
}

/**
 * チャット読み替えを追加
 */
function addChatReplacement() {
    const originalWord = originalChatWordInput.value.trim();
    const replacementWord = replacementChatWordInput.value.trim();
    
    if (!originalWord || !replacementWord) {
        addChatMessage('システム', '置き換え元と置き換え先の単語を入力してください', 'error');
        return;
    }
    
    chatReplacements[originalWord] = replacementWord;
    
    originalChatWordInput.value = '';
    replacementChatWordInput.value = '';
    
    updateChatReplacementList();
    
    // 追加後に設定を保存
    saveChatReplacements();
    
    addChatMessage('システム', `チャット読み替えを追加しました: ${originalWord} → ${replacementWord}`, 'system');
}

/**
 * チャット読み替えリストを更新
 */
function updateChatReplacementList() {
    if (!chatReplacementList) return;
    
    chatReplacementList.innerHTML = '';
    
    Object.entries(chatReplacements).forEach(([originalWord, replacementWord]) => {
        const replacementItem = document.createElement('div');
        replacementItem.className = 'replacement-item';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'replacement-content';
        
        const originalSpan = document.createElement('span');
        originalSpan.className = 'replacement-original';
        originalSpan.textContent = originalWord;
        
        const arrowSpan = document.createElement('span');
        arrowSpan.className = 'replacement-arrow';
        arrowSpan.textContent = ' → ';
        
        const replacementSpan = document.createElement('span');
        replacementSpan.className = 'replacement-text';
        replacementSpan.textContent = replacementWord;
        
        contentDiv.appendChild(originalSpan);
        contentDiv.appendChild(arrowSpan);
        contentDiv.appendChild(replacementSpan);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-small btn-danger';
        deleteBtn.textContent = '削除';
        deleteBtn.addEventListener('click', () => removeChatReplacement(originalWord));
        
        replacementItem.appendChild(contentDiv);
        replacementItem.appendChild(deleteBtn);
        chatReplacementList.appendChild(replacementItem);
    });
}

/**
 * チャット読み替えを削除
 */
function removeChatReplacement(originalWord) {
    delete chatReplacements[originalWord];
    updateChatReplacementList();
    saveChatReplacements();
    
    addChatMessage('システム', `チャット読み替えを削除しました: ${originalWord}`, 'system');
}

/**
 * チャット読み替え設定を保存
 */
async function saveChatReplacements() {
    try {
        const result = await window.electronAPI.saveChatReplacements(chatReplacements);
        if (result.success) {
            addChatMessage('システム', 'チャット読み替え設定を保存しました', 'system');
        } else {
            addChatMessage('システム', 'チャット読み替え設定の保存に失敗しました', 'error');
        }
    } catch (error) {
        console.error('チャット読み替え設定保存エラー:', error);
        addChatMessage('システム', `チャット読み替え設定保存エラー: ${error.message}`, 'error');
    }
}

/**
 * チャット読み替え設定を読み込み
 */
async function loadChatReplacements() {
    try {
        const loadedReplacements = await window.electronAPI.loadChatReplacements();
        if (loadedReplacements) {
            chatReplacements = loadedReplacements;
            updateChatReplacementList();
            console.log('チャット読み替え設定を読み込みました:', Object.keys(chatReplacements).length, '件');
        }
    } catch (error) {
        console.error('チャット読み替え設定読み込みエラー:', error);
    }
}

/**
 * 単語別話者設定を追加
 */
function addWordSpeaker() {
    console.log('🔄 addWordSpeaker関数が呼び出されました');
    console.log('triggerWordForSpeakerInput:', triggerWordForSpeakerInput);
    console.log('speakerForWordSelect:', speakerForWordSelect);
    
    const triggerWord = triggerWordForSpeakerInput?.value?.trim();
    const speakerId = speakerForWordSelect?.value;
    
    console.log('入力されたトリガーワード:', triggerWord);
    console.log('選択された話者ID:', speakerId);
    
    if (!triggerWord || !speakerId) {
        const errorMsg = !triggerWord ? 'トリガーワードが入力されていません' : '話者が選択されていません';
        console.error('❌ 入力エラー:', errorMsg);
        addChatMessage('システム', 'トリガーワードと話者を入力してください', 'error');
        return;
    }
    
    if (wordSpeakers[triggerWord]) {
        addChatMessage('システム', `「${triggerWord}」の設定を更新しました`, 'system');
    } else {
        addChatMessage('システム', `「${triggerWord}」の話者設定を追加しました`, 'system');
    }
    
    wordSpeakers[triggerWord] = speakerId;
    console.log('現在のwordSpeakers:', wordSpeakers);
    
    updateWordSpeakerList();
    
    // 追加後に設定を保存
    saveWordSpeakers();
    
    // 入力フィールドをクリア
    if (triggerWordForSpeakerInput) triggerWordForSpeakerInput.value = '';
    if (speakerForWordSelect) speakerForWordSelect.selectedIndex = 0;
    
    console.log('✅ addWordSpeaker関数の処理が完了しました');
}

/**
 * 単語別話者設定リストを更新
 */
function updateWordSpeakerList() {
    console.log('🔄 updateWordSpeakerList関数が呼び出されました');
    console.log('wordSpeakerList要素:', wordSpeakerList);
    console.log('現在のwordSpeakers:', wordSpeakers);
    
    if (!wordSpeakerList) {
        console.error('❌ wordSpeakerList要素が見つかりません');
        return;
    }
    
    wordSpeakerList.innerHTML = '';
    
    Object.entries(wordSpeakers).forEach(([word, speakerId]) => {
        const listItem = document.createElement('div');
        listItem.className = 'list-item word-speaker-item';
        
        // 話者名を取得（スピーカーセレクトボックスから）
        let speakerName = speakerId;
        if (speakerForWordSelect) {
            const option = Array.from(speakerForWordSelect.options).find(opt => opt.value === speakerId);
            if (option) {
                speakerName = option.textContent;
            }
        }
        
        // コンテンツ部分を作成
        const contentDiv = document.createElement('div');
        contentDiv.className = 'word-speaker-content';
        
        const triggerWordSpan = document.createElement('span');
        triggerWordSpan.className = 'trigger-word';
        triggerWordSpan.textContent = word;
        
        const arrowSpan = document.createElement('span');
        arrowSpan.className = 'speaker-arrow';
        arrowSpan.textContent = '→';
        
        const speakerNameSpan = document.createElement('span');
        speakerNameSpan.className = 'speaker-name';
        speakerNameSpan.textContent = speakerName;
        
        contentDiv.appendChild(triggerWordSpan);
        contentDiv.appendChild(arrowSpan);
        contentDiv.appendChild(speakerNameSpan);
        
        // 削除ボタンを作成
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '削除';
        removeBtn.addEventListener('click', () => {
            console.log('削除ボタンがクリックされました:', word);
            removeWordSpeaker(word);
        });
        
        listItem.appendChild(contentDiv);
        listItem.appendChild(removeBtn);
        wordSpeakerList.appendChild(listItem);
    });
    
    console.log('✅ 単語別話者設定リスト更新完了:', Object.keys(wordSpeakers).length, '件');
}

/**
 * 単語別話者設定を削除
 */
function removeWordSpeaker(triggerWord) {
    console.log('🔄 removeWordSpeaker関数が呼び出されました:', triggerWord);
    
    if (wordSpeakers[triggerWord]) {
        delete wordSpeakers[triggerWord];
        updateWordSpeakerList();
        
        // 削除後に設定を保存
        saveWordSpeakers();
        
        addChatMessage('システム', `「${triggerWord}」の話者設定を削除しました`, 'system');
        console.log('✅ 単語別話者設定を削除しました:', triggerWord);
    } else {
        console.warn('⚠️ 削除対象が見つかりませんでした:', triggerWord);
    }
}

/**
 * 単語別話者設定を保存
 */
async function saveWordSpeakers() {
    try {
        const result = await window.electronAPI.saveWordSpeakers(wordSpeakers);
        if (result.success) {
            addChatMessage('システム', '単語別話者設定を保存しました', 'system');
        } else {
            addChatMessage('システム', '単語別話者設定の保存に失敗しました', 'error');
        }
    } catch (error) {
        console.error('単語別話者設定保存エラー:', error);
        addChatMessage('システム', `単語別話者設定保存エラー: ${error.message}`, 'error');
    }
}

/**
 * 単語別話者設定を読み込み
 */
async function loadWordSpeakers() {
    try {
        const loadedWordSpeakers = await window.electronAPI.loadWordSpeakers();
        if (loadedWordSpeakers) {
            wordSpeakers = loadedWordSpeakers;
            updateWordSpeakerList();
            console.log('単語別話者設定を読み込みました:', Object.keys(wordSpeakers).length, '件');
        }
    } catch (error) {
        console.error('単語別話者設定読み込みエラー:', error);
    }
}


