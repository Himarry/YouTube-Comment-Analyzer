// YouTubeのコメント欄付近に「コメントを解析する」ボタンを設置し、クリック時に解析・結果表示
(function() {
  // コメント欄の親要素を探す（新仕様: #additional-section内部）
  function findInsertTarget() {
    const commentsHeader = document.querySelector('ytd-comments-header-renderer');
    if (!commentsHeader) return null;
    const additional = commentsHeader.querySelector('#additional-section');
    return additional;
  }

  function insertAnalyzeButton() {
    // 既にボタンがある場合は何もしない
    if (document.getElementById('ytcmtck-analyze-btn')) return;
    
    const additional = findInsertTarget();
    if (!additional) {
      console.log('ytcmtck: #additional-section not found, retrying...');
      return;
    }
      const btn = document.createElement('button');
    btn.id = 'ytcmtck-analyze-btn';
    btn.textContent = 'コメント解析';
    btn.style.marginLeft = '16px';
    btn.style.marginTop = '2px';
    btn.style.background = 'transparent';
    btn.style.color = '#0f0f0f';
    btn.style.border = '0px';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '1.4rem';
    btn.style.fontWeight = '500';
    btn.style.fontFamily = 'Roboto, Arial, sans-serif';
    btn.style.height = '36px';
    btn.style.display = 'flex';
    btn.style.alignItems = 'top';
    btn.style.transition = 'background-color 0.1s ease';
    
    // #additional-section内部の最後に挿入
    additional.appendChild(btn);
    btn.addEventListener('click', onAnalyzeClick);
    console.log('ytcmtck: 解析ボタンを挿入しました');
  }

  // MutationObserverでDOM変更を監視
  function startObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              if (node.matches && (
                node.matches('ytd-comments-header-renderer') ||
                node.querySelector && node.querySelector('ytd-comments-header-renderer')
              )) {
                shouldCheck = true;
              }
            }
          });
        }
      });
      
      if (shouldCheck) {
        setTimeout(insertAnalyzeButton, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return observer;
  }  function showResult(message, isFinal) {
    let result = document.getElementById('ytcmtck-analyze-result');
    if (!result) {
      result = document.createElement('div');
      result.id = 'ytcmtck-analyze-result';
      result.style.margin = '16px 0';
      result.style.padding = '16px';
      result.style.background = '#f9f9f9';
      result.style.border = '1px solid #ddd';
      result.style.borderRadius = '8px';
      result.style.fontSize = '16px';
      result.style.lineHeight = '1.5';
      result.style.fontFamily = 'Roboto, Arial, sans-serif';
      result.style.whiteSpace = 'pre-line';
      const commentSection = document.querySelector('#comments');
      if (commentSection) commentSection.prepend(result);
    }
    result.textContent = message;
    if (isFinal) {
      result.style.background = '#e6ffe6';
      result.style.fontWeight = '500';
      // 5秒後に自動で削除
      setTimeout(() => {
        if (result && result.parentNode) {
          result.remove();
        }
      }, 5000);
    }
  }

  // ★APIキーをここに設定（ご自身のYouTube Data APIキーに差し替えてください）
  const YOUTUBE_API_KEY = 'AIzaSyCB9iLVqz1AsLrYk83tILnILa7n6OzfEkg';

  // 動画IDをURLから取得
  function getVideoId() {
    const url = new URL(location.href);
    return url.searchParams.get('v');
  }  // YouTube Data APIでコメントを取得
  async function fetchComments(videoId) {
    if (!videoId) return { count: 0, comments: [] };
    const apiUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}&maxResults=100`;
    try {
      const res = await fetch(apiUrl);
      const data = await res.json();
      if (data.error) {
        console.error('YouTube API Error:', data.error);
        return { count: 0, comments: [] };
      }
      const comments = data.items ? data.items.map(item => ({
        author: item.snippet.topLevelComment.snippet.authorDisplayName,
        authorProfileImageUrl: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
        authorChannelUrl: item.snippet.topLevelComment.snippet.authorChannelUrl || '#',
        text: item.snippet.topLevelComment.snippet.textDisplay,
        publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
        updatedAt: item.snippet.topLevelComment.snippet.updatedAt,
        likeCount: item.snippet.topLevelComment.snippet.likeCount || 0,
        id: item.snippet.topLevelComment.id
      })) : [];
      return { count: comments.length, comments: comments };
    } catch (e) {
      console.error('API fetch error:', e);
      return { count: 0, comments: [] };
    }
  }
  // YouTubeの時間表示形式に変換
  function formatTimeAgo(publishedAt) {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffMs = now - published;
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) {
      return `${years} 年前`;
    } else if (months > 0) {
      return `${months} か月前`;
    } else if (weeks > 0) {
      return `${weeks} 週間前`;
    } else if (days > 0) {
      return `${days} 日前`;
    } else if (hours > 0) {
      return `${hours} 時間前`;
    } else if (minutes > 0) {
      return `${minutes} 分前`;
    } else {
      return '今';
    }
  }  async function onAnalyzeClick() {
    showResult('解析中...', false);
    
    const videoId = getVideoId();
    if (!videoId) {
      showResult('エラー: 動画IDが取得できませんでした', true);
      return;
    }
    
    const ytComments = document.querySelectorAll('#contents #content-text');
    const ytCount = ytComments.length;
    
    await new Promise(r => setTimeout(r, 1000));
    const apiData = await fetchComments(videoId);
    const apiCount = apiData.count;
    
    showResult('解析が完了しました。', false);
    await new Promise(r => setTimeout(r, 1000));
    
    let resultMsg = '解析結果：\n';
    
    if (ytCount === apiCount) {
      resultMsg += '全てのコメントが表示されています。';
    } else {
      const hiddenCount = Math.max(0, apiCount - ytCount);
      resultMsg += '表示されていないコメントが見つかったため、コメント欄のトップに表示しました';
      const hiddenComments = apiData.comments.slice(ytCount);
      if (hiddenComments.length > 0) {
        const newHiddenComments = hiddenComments.filter(comment => !displayedCommentIds.has(comment.id));
        if (newHiddenComments.length > 0) {
          newHiddenComments.forEach((comment, index) => {
            displayedCommentIds.add(comment.id);
            const commentElement = document.createElement('ytd-comment-view-model');
            commentElement.className = 'style-scope ytd-comment-thread-renderer';
            commentElement.setAttribute('data-ytcmtck-hidden', 'true');
            commentElement.style.borderRadius = '8px';
            commentElement.style.marginBottom = '16px';
            commentElement.innerHTML = `
            <div id="body" class="style-scope ytd-comment-view-model">              <div id="author-thumbnail" class="style-scope ytd-comment-view-model">
                <button id="author-thumbnail-button" class="style-scope ytd-comment-view-model" style="border: none; background: none; padding: 0; cursor: pointer;" aria-label="${comment.author}">
                  <yt-img-shadow fit="" height="40" width="40" class="style-scope ytd-comment-view-model no-transition" style="background-color: transparent;">
                    <img style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" src="${comment.authorProfileImageUrl}" alt="${comment.author}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMzQgMzJDMzQgMjYuNDc3MiAyOS41MjI4IDIyIDI0IDIySDIwSDEyQzEwLjg5NTQgMjIgMTAgMjIuODk1NCAxMCAyNFYzNEgzNFYzMloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'">
                  </yt-img-shadow>
                </button>
              </div>
              <div id="main" class="style-scope ytd-comment-view-model">
                <div id="header" class="style-scope ytd-comment-view-model" style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
                  <h3 class="style-scope ytd-comment-view-model" style="margin: 0; font-size: 13px; line-height: 18px; font-weight: 500;"> 
                    <a class="yt-simple-endpoint style-scope ytd-comment-view-model" href="${comment.authorChannelUrl}" style="color: #0f0f0f; text-decoration: none;">
                      <span class="style-scope ytd-comment-view-model">${comment.author}</span>
                    </a>
                  </h3>
                  <span dir="auto" style="color: #606060; font-size: 12px; line-height: 18px;">
                    <a class="yt-simple-endpoint style-scope ytd-comment-view-model" href="/watch?v=${getVideoId()}&lc=${comment.id}" style="color: inherit; text-decoration: none;">
                      ${formatTimeAgo(comment.publishedAt)}
                    </a>
                  </span>
                </div>
                <div style="margin-top: 2px;">
                  <span style="color: #0f0f0f; font-size: 14px; line-height: 20px; white-space: pre-wrap;">${comment.text}</span>
                </div>                <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
                  <button style="background: none; border: none; padding: 0px; border-radius: 18px; cursor: pointer; display: flex; align-items: center; gap: 6px;" onmouseover="this.style.backgroundColor='#f2f2f2'" onmouseout="this.style.backgroundColor='transparent'" title="高評価">
                    <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.77 11h-4.23l1.52-4.94C16.38 5.03 15.54 4 14.38 4c-.58 0-1.14.24-1.52.65L7 11H3v10h14.43c1.06 0 1.98-.67 2.19-1.61l1.34-6c.27-1.24-.78-2.39-2.19-2.39zM7 20H4v-8h3v8zm12.98-6.83-1.34 6c-.1.48-.61.83-1.21.83H8v-8.61l5.6-6.06c.19-.21.48-.33.78-.33.26 0 .5.11.63.3.07.1.15.26.09.47l-1.52 4.94-.4 1.29h5.58c.41 0 .8.17 1.03.46.13.15.26.4.19.71z"/>
                    </svg>
                    ${comment.likeCount > 0 ? `<span style="font-size: 12px; color: #606060;">${comment.likeCount}</span>` : ''}
                  </button>
                  <button style="background: none; border: none; border-radius: 18px; padding: 0px; cursor: pointer; display: flex; align-items: center;" onmouseover="this.style.backgroundColor='#f2f2f2'" onmouseout="this.style.backgroundColor='transparent'">
                    <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 4H6.57c-1.07 0-1.98.67-2.19 1.61l-1.34 6C2.77 12.85 3.82 14 5.23 14h4.23l-1.52 4.94C7.62 19.97 8.46 21 9.62 21c.58 0 1.14-.24 1.52-.65L17 14h4V4h-4zm-6.6 15.67c-.19.21-.48.33-.78.33-.26 0-.5-.11-.63-.3-.07-.1-.15-.26-.09-.47l1.52-4.94.4-1.29H5.23c-.41 0-.8-.17-1.03-.46-.12-.15-.25-.4-.18-.72l1.34-6c.1-.47.61-.82 1.21-.82H16v8.61l-5.6 6.06zM20 13h-3V5h3v8z"/>
                    </svg>
                  </button>
                  <button style="background: none; border: none; padding: 6px 16px; border-radius: 18px; cursor: pointer; font-size: 12px; font-weight: 500; onmouseover="this.style.backgroundColor='#f2f2f2'" onmouseout="this.style.backgroundColor='transparent'">
                    返信
                  </button>
                </div>
              </div>
            </div>
          `;
            const commentSection = document.querySelector('#comments #contents');
            if (commentSection) commentSection.prepend(commentElement);
          });
        }
      }
    }
    showResult(resultMsg, true);
  }
  // 動的ページ対応とMutationObserver
  let lastUrl = location.href;
  let checkInterval;
  let observer;

  function startMonitoring() {
    // MutationObserverを開始
    observer = startObserver();
    
    // URLチェック用インターバル
    checkInterval = setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log('ytcmtck: ページ遷移を検出、ボタン再挿入を試行');
        setTimeout(insertAnalyzeButton, 1000);
        setTimeout(insertAnalyzeButton, 3000); // 遅延読み込み対応
      }
      
      // ボタンが消えた場合の復旧
      if (!document.getElementById('ytcmtck-analyze-btn') && findInsertTarget()) {
        console.log('ytcmtck: ボタンが消失、再挿入');
        insertAnalyzeButton();
      }
    }, 2000);
  }

  // 初期化
  function init() {
    // 複数回試行で確実に挿入
    setTimeout(insertAnalyzeButton, 1000);
    setTimeout(insertAnalyzeButton, 3000);
    setTimeout(insertAnalyzeButton, 5000);
    
    // 監視開始
    startMonitoring();
  }

  // ページ読み込み完了後に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 既に表示済みのコメントIDを記録する配列
  let displayedCommentIds = new Set();

  // 既存の未表示コメントを削除する関数
  function removeExistingHiddenComments() {
    const existingComments = document.querySelectorAll('[data-ytcmtck-hidden="true"]');
    existingComments.forEach(comment => comment.remove());
    addLog(`既存の未表示コメント ${existingComments.length}件を削除`, 'progress');
  }
})();
