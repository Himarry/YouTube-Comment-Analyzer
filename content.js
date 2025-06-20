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
    }      const btn = document.createElement('button');    btn.id = 'ytcmtck-analyze-btn';
    btn.textContent = '🔍コメント解析';
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
    
    // 設定ボタンを追加
    const settingsBtn = document.createElement('button');
    settingsBtn.id = 'ytcmtck-settings-btn';
    settingsBtn.textContent = '⚙️';
    settingsBtn.style.marginLeft = '8px';
    settingsBtn.style.marginTop = '2px';
    settingsBtn.style.background = 'transparent';
    settingsBtn.style.color = '#0f0f0f';
    settingsBtn.style.border = '0px';
    settingsBtn.style.cursor = 'pointer';
    settingsBtn.style.fontSize = '1.4rem';
    settingsBtn.style.fontWeight = '500';
    settingsBtn.style.fontFamily = 'Roboto, Arial, sans-serif';
    settingsBtn.style.height = '36px';
    settingsBtn.style.display = 'flex';
    settingsBtn.style.alignItems = 'center';
    settingsBtn.style.justifyContent = 'center';
    settingsBtn.style.width = '36px';
    settingsBtn.style.borderRadius = '50%';
    settingsBtn.style.transition = 'background-color 0.1s ease';
    settingsBtn.title = '設定';
    
    settingsBtn.addEventListener('mouseenter', () => {
      settingsBtn.style.backgroundColor = '#f2f2f2';
    });
    settingsBtn.addEventListener('mouseleave', () => {
      settingsBtn.style.backgroundColor = 'transparent';
    });
      additional.appendChild(settingsBtn);
    settingsBtn.addEventListener('click', showSettingsModal);
      console.log('ytcmtck: 解析ボタンを挿入しました');
    
    // 検索ボックスを表示（設定に応じて）
    setTimeout(() => {
      updateSearchBoxVisibility();
    }, 100);
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
      result.id = 'ytcmtck-analyze-result';      result.style.margin = '16px 0';
      result.style.padding = '16px';
      result.style.background = settings.useCustomBackground ? settings.backgroundColor : '#f9f9f9';
      result.style.border = '1px solid #ddd';
      result.style.borderRadius = '8px';
      result.style.fontSize = '16px';
      result.style.lineHeight = '1.5';
      result.style.fontFamily = 'Roboto, Arial, sans-serif';
      result.style.whiteSpace = 'pre-line';
      const commentSection = document.querySelector('#comments');
      if (commentSection) commentSection.prepend(result);
    }    result.textContent = message;
    if (isFinal) {
      result.style.background = settings.useCustomBackground ? settings.backgroundColor : '#e6ffe6';
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
  const YOUTUBE_API_KEY = 'AIzaSyCB9iLVqz1AsLrYk83tILnILa7n6OzfEkg';  // 設定のデフォルト値
  let settings = {
    showUsernames: true,
    showComments: true,
    useCustomBackground: false,
    backgroundColor: '#f9f9f9',
    showSearchBox: true
  };

  // 検索結果を格納する変数
  let allComments = [];
  let searchResultsContainer = null;

  // 設定を読み込み
  function loadSettings() {
    const saved = localStorage.getItem('ytcmtck-settings');
    if (saved) {
      try {
        settings = { ...settings, ...JSON.parse(saved) };
      } catch (e) {
        console.error('設定の読み込みに失敗:', e);
      }
    }
  }

  // 設定を保存
  function saveSettings() {
    localStorage.setItem('ytcmtck-settings', JSON.stringify(settings));
  }
  // iPhone風スイッチを作成
  function createToggleSwitch(isOn, onChange) {
    const switchContainer = document.createElement('div');
    switchContainer.style.position = 'relative';
    switchContainer.style.width = '50px';
    switchContainer.style.height = '30px';
    switchContainer.style.backgroundColor = isOn ? '#007AFF' : '#E5E5EA';
    switchContainer.style.borderRadius = '15px';
    switchContainer.style.cursor = 'pointer';
    switchContainer.style.transition = 'background-color 0.3s ease';
    
    const switchButton = document.createElement('div');
    switchButton.style.position = 'absolute';
    switchButton.style.top = '2px';
    switchButton.style.left = isOn ? '22px' : '2px';
    switchButton.style.width = '26px';
    switchButton.style.height = '26px';
    switchButton.style.backgroundColor = '#FFFFFF';
    switchButton.style.borderRadius = '50%';
    switchButton.style.transition = 'left 0.3s ease';
    switchButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    
    switchContainer.appendChild(switchButton);
    
    switchContainer.addEventListener('click', () => {
      const newState = !isOn;
      isOn = newState;
      switchContainer.style.backgroundColor = newState ? '#007AFF' : '#E5E5EA';
      switchButton.style.left = newState ? '22px' : '2px';
      onChange(newState);
    });
    
    return switchContainer;
  }
  // カラーサークルピッカーを作成
  function createColorPicker(selectedColor, onChange) {
    const colors = [
      '#f9f9f9', '#e6ffe6', '#ffe6e6', '#e6f3ff', '#fff2e6',
      '#f0e6ff', '#ffe6f9', '#e6fff9', '#ffffe6', '#f5f5f5',
      '#d1ecf1', '#f8d7da', '#d4edda', '#fff3cd', '#e2e3e5'
    ];

    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(5, 1fr)';
    container.style.gap = '8px';
    container.style.marginTop = '8px';

    colors.forEach(color => {
      const colorCircle = document.createElement('div');
      colorCircle.style.width = '32px';
      colorCircle.style.height = '32px';
      colorCircle.style.backgroundColor = color;
      colorCircle.style.borderRadius = '50%';
      colorCircle.style.cursor = 'pointer';
      colorCircle.style.border = selectedColor === color ? '3px solid #007AFF' : '2px solid #ddd';
      colorCircle.style.transition = 'all 0.2s ease';
      colorCircle.style.boxSizing = 'border-box';

      colorCircle.addEventListener('click', () => {
        // 他の全ての色円の選択状態をリセット
        container.querySelectorAll('div').forEach(circle => {
          circle.style.border = '2px solid #ddd';
        });
        // 選択した色円をハイライト
        colorCircle.style.border = '3px solid #007AFF';
        onChange(color);
      });

      container.appendChild(colorCircle);
    });    return container;
  }

  // 検索ボックスの表示状態を更新する関数
  function updateSearchBoxVisibility() {
    const existingSearchBox = document.getElementById('ytcmtck-user-search');
    
    if (settings.showSearchBox) {
      // 表示設定がONで、まだ検索ボックスがない場合は作成
      if (!existingSearchBox) {
        console.log('ytcmtck: 検索ボックス表示設定がON - 作成します');
        createUserSearchBox();
      }
    } else {
      // 表示設定がOFFで、検索ボックスがある場合は削除
      if (existingSearchBox) {
        console.log('ytcmtck: 検索ボックス表示設定がOFF - 削除します');
        existingSearchBox.remove();
      }
    }
  }// ユーザーID検索ボックスを作成
  function createUserSearchBox() {
    // 設定で検索ボックスが非表示の場合は何もしない
    if (!settings.showSearchBox) {
      console.log('ytcmtck: 検索ボックスが設定で無効化されています');
      return;
    }
    
    // 既存の検索ボックスがある場合は削除
    const existingSearch = document.getElementById('ytcmtck-user-search');
    if (existingSearch) {
      existingSearch.remove();
    }

    // コメント解析ボタンの下に表示するため、まず解析ボタンの親要素を探す
    let targetElement = null;
    
    // 1. 解析ボタンが存在する場合、その親要素（#additional-section）の後に挿入
    const analyzeButton = document.getElementById('ytcmtck-analyze-btn');
    if (analyzeButton && analyzeButton.parentElement) {
      const additionalSection = analyzeButton.parentElement; // #additional-section
      const commentsHeader = additionalSection.parentElement; // ytd-comments-header-renderer
      if (commentsHeader) {
        targetElement = commentsHeader;
        console.log('ytcmtck: 解析ボタンの下（ytd-comments-header-renderer内）に挿入');
      }
    }
    
    // 2. フォールバック：従来の方法で挿入先を探す
    if (!targetElement) {
      const selectors = [
        'ytd-comments-header-renderer',
        '#contents.style-scope.ytd-item-section-renderer',
        '#contents',
        'ytd-item-section-renderer #contents',
        '[role="main"] #contents',
        'ytd-comments #contents',
        'ytd-item-section-renderer[page-subtype="comments"] #contents'
      ];

      for (const selector of selectors) {
        targetElement = document.querySelector(selector);
        if (targetElement) {
          console.log(`ytcmtck: フォールバック挿入先が見つかりました: ${selector}`);
          break;
        }
      }
    }if (!targetElement) {
      console.log('ytcmtck: 適切な挿入先が見つかりません。利用可能な要素をデバッグ出力します...');
      // デバッグ用：コメント関連の要素を探す
      const commentsSection = document.querySelector('ytd-comments');
      const itemSectionRenderers = document.querySelectorAll('ytd-item-section-renderer');
      const contentsElements = document.querySelectorAll('#contents');
      const pageManager = document.querySelector('ytd-page-manager');
      const watchFlexy = document.querySelector('ytd-watch-flexy');
      
      console.log('ytcmtck: ytd-comments:', commentsSection);
      console.log('ytcmtck: ytd-item-section-renderer 要素数:', itemSectionRenderers.length);
      console.log('ytcmtck: #contents 要素数:', contentsElements.length);
      console.log('ytcmtck: ytd-page-manager:', pageManager);
      console.log('ytcmtck: ytd-watch-flexy:', watchFlexy);
      
      // 詳細デバッグ：各要素の属性を確認
      itemSectionRenderers.forEach((element, index) => {
        console.log(`ytcmtck: ytd-item-section-renderer[${index}]:`, {
          'page-subtype': element.getAttribute('page-subtype'),
          'section-identifier': element.getAttribute('section-identifier'),
          'class': element.className,
          'id': element.id,
          'hasContents': !!element.querySelector('#contents')
        });
      });
      
      // フォールバック戦略を拡張
      if (commentsSection) {
        targetElement = commentsSection;
        console.log('ytcmtck: フォールバック1: ytd-commentsを使用');
      } else if (itemSectionRenderers.length > 0) {
        // コメント関連のytd-item-section-rendererを優先
        const commentsRenderer = Array.from(itemSectionRenderers).find(el => 
          el.getAttribute('page-subtype') === 'comments' || 
          el.getAttribute('section-identifier') === 'comments' ||
          el.querySelector('#contents')
        );
        targetElement = commentsRenderer || itemSectionRenderers[0];
        console.log('ytcmtck: フォールバック2: ytd-item-section-rendererを使用');
      } else if (contentsElements.length > 0) {
        targetElement = contentsElements[0].parentElement;
        console.log('ytcmtck: フォールバック3: #contentsの親要素を使用');
      } else if (watchFlexy) {
        targetElement = watchFlexy;
        console.log('ytcmtck: フォールバック4: ytd-watch-flexyを使用');
      } else {
        console.log('ytcmtck: 全てのフォールバック戦略が失敗しました');
        return;
      }
    }    // 検索ボックスコンテナを作成
    const searchContainer = document.createElement('div');
    searchContainer.id = 'ytcmtck-user-search';
    searchContainer.style.margin = '8px 0 16px 0'; // 上マージンを少し狭く
    searchContainer.style.padding = '16px';
    searchContainer.style.backgroundColor = '#f8f9fa';
    searchContainer.style.borderRadius = '8px';
    searchContainer.style.border = '1px solid #e1e5e9';
    searchContainer.style.fontFamily = 'Roboto, Arial, sans-serif';
    searchContainer.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'; // 軽い影を追加    // タイトル
    const searchTitle = document.createElement('h4');
    searchTitle.textContent = '🔍 ユーザーID検索';
    searchTitle.style.margin = '0 0 8px 0';
    searchTitle.style.fontSize = '14px';
    searchTitle.style.fontWeight = '500';
    searchTitle.style.color = '#0f0f0f';
    searchContainer.appendChild(searchTitle);
      // 説明文を追加
    const searchDescription = document.createElement('div');
    searchDescription.style.fontSize = '12px';
    searchDescription.style.color = '#666';
    searchDescription.style.marginBottom = '12px';
    searchDescription.style.lineHeight = '1.4';
    
    if (allComments.length === 0) {
      searchDescription.textContent = '現在表示されているコメントから検索できます（解析後はより多くのコメントから検索可能）';
    } else {
      searchDescription.textContent = `${allComments.length}件のコメントから検索できます`;
    }
    searchContainer.appendChild(searchDescription);

    // 検索入力欄
    const searchInputContainer = document.createElement('div');
    searchInputContainer.style.display = 'flex';
    searchInputContainer.style.gap = '8px';
    searchInputContainer.style.marginBottom = '12px';    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '@ユーザーID を入力';
    searchInput.style.flex = '1';
    searchInput.style.padding = '8px 12px';
    searchInput.style.border = '1px solid #ccc';
    searchInput.style.borderRadius = '20px';
    searchInput.style.fontSize = '14px';
    searchInput.style.outline = 'none';
    searchInput.style.fontFamily = 'Roboto, Arial, sans-serif';

    const searchButton = document.createElement('button');
    searchButton.textContent = '検索';
    searchButton.style.padding = '8px 16px';
    searchButton.style.border = 'none';
    searchButton.style.borderRadius = '20px';
    searchButton.style.backgroundColor = '#007AFF';
    searchButton.style.color = '#ffffff';
    searchButton.style.cursor = 'pointer';
    searchButton.style.fontSize = '14px';
    searchButton.style.transition = 'background-color 0.2s ease';

    searchButton.addEventListener('mouseenter', () => {
      searchButton.style.backgroundColor = '#0056CC';
    });
    searchButton.addEventListener('mouseleave', () => {
      searchButton.style.backgroundColor = '#007AFF';
    });

    searchInputContainer.appendChild(searchInput);
    searchInputContainer.appendChild(searchButton);
    searchContainer.appendChild(searchInputContainer);

    // 検索結果表示エリア
    searchResultsContainer = document.createElement('div');
    searchResultsContainer.id = 'ytcmtck-search-results';
    searchResultsContainer.style.display = 'none';
    searchContainer.appendChild(searchResultsContainer);    // 検索機能
    const performSearch = () => {
      const query = searchInput.value.trim();
      if (!query) {
        searchResultsContainer.style.display = 'none';
        return;
      }

      // @を自動追加
      const searchQuery = query.startsWith('@') ? query : '@' + query;
      let results = [];

      // 解析済みのコメントがある場合はそれを使用
      if (allComments.length > 0) {
        results = allComments.filter(comment => 
          comment.author.toLowerCase().includes(searchQuery.toLowerCase().substring(1))
        );
      } else {
        // 解析前の場合は、現在ページ上にあるコメントを検索
        results = searchPageComments(searchQuery.substring(1));
      }

      displaySearchResults(results, searchQuery);
    };

    // イベントリスナー
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
    searchInput.addEventListener('input', () => {
      if (searchInput.value.trim() === '') {
        searchResultsContainer.style.display = 'none';
      }
    });    // コメント解析ボタンの下に挿入
    let insertionSuccess = false;
    
    try {
      const analyzeButton = document.getElementById('ytcmtck-analyze-btn');
      
      if (analyzeButton && analyzeButton.parentElement) {
        // 解析ボタンの親要素（#additional-section）の後に挿入
        const additionalSection = analyzeButton.parentElement;
        const commentsHeader = additionalSection.parentElement;
        
        if (commentsHeader) {
          // ytd-comments-header-rendererの後に挿入
          commentsHeader.parentNode.insertBefore(searchContainer, commentsHeader.nextSibling);
          console.log('ytcmtck: ユーザー検索ボックスをコメント解析ボタンの下に挿入しました');
          insertionSuccess = true;
        }
      }
      
      // フォールバック1：ytd-comments-header-rendererがtargetElementの場合
      if (!insertionSuccess && targetElement && targetElement.tagName === 'YTD-COMMENTS-HEADER-RENDERER') {
        targetElement.parentNode.insertBefore(searchContainer, targetElement.nextSibling);
        console.log('ytcmtck: ユーザー検索ボックスをytd-comments-header-rendererの後に挿入しました');
        insertionSuccess = true;
      }
      
      // フォールバック2：従来の挿入方法
      if (!insertionSuccess && targetElement) {
        if (targetElement.id === 'contents' || targetElement.querySelector('#contents')) {
          // targetElementが#contentsまたは#contentsを含む場合
          const actualContents = targetElement.id === 'contents' ? targetElement : targetElement.querySelector('#contents');
          if (actualContents && actualContents.parentNode) {
            actualContents.parentNode.insertBefore(searchContainer, actualContents);
            console.log('ytcmtck: ユーザー検索ボックスを#contentsの直前に挿入しました');
            insertionSuccess = true;
          }
        } else {
          // targetElementの最初に挿入
          if (targetElement.querySelector('*')) {
            targetElement.insertBefore(searchContainer, targetElement.firstElementChild);
          } else {
            targetElement.appendChild(searchContainer);
          }
          console.log('ytcmtck: ユーザー検索ボックスを要素内に挿入しました（フォールバック）');
          insertionSuccess = true;
        }
      }
    } catch (error) {
      console.error('ytcmtck: 検索ボックス挿入エラー:', error);
      // 最終フォールバック：bodyに追加
      try {
        document.body.appendChild(searchContainer);
        searchContainer.style.position = 'fixed';
        searchContainer.style.top = '100px';
        searchContainer.style.left = '20px';
        searchContainer.style.zIndex = '9999';
        searchContainer.style.width = '400px';
        console.log('ytcmtck: 最終フォールバック - bodyに固定位置で挿入');
        insertionSuccess = true;
      } catch (finalError) {
        console.error('ytcmtck: 最終フォールバックも失敗:', finalError);
      }
    }
    
    if (insertionSuccess) {
      console.log('ytcmtck: ユーザー検索ボックスの挿入が完了しました');
    } else {
      console.log('ytcmtck: ユーザー検索ボックスの挿入に失敗しました');
    }  }

  // ページ上のコメントを検索する関数（解析前用）
  function searchPageComments(searchTerm) {
    const results = [];
    
    // 現在表示されているコメントを取得
    const commentElements = document.querySelectorAll('#contents ytd-comment-thread-renderer, #contents ytd-comment-view-model');
    
    commentElements.forEach((commentElement, index) => {
      try {
        // ユーザー名を取得
        const authorElement = commentElement.querySelector('#author-text span');
        const author = authorElement ? authorElement.textContent.trim() : '';
        
        // コメント本文を取得
        const contentElement = commentElement.querySelector('#content-text, #content span[dir="auto"]');
        const text = contentElement ? contentElement.textContent.trim() : '';
        
        // プロフィール画像URLを取得
        const imgElement = commentElement.querySelector('img');
        const authorProfileImageUrl = imgElement ? imgElement.src : '';
        
        // 投稿時間を取得
        const timeElement = commentElement.querySelector('.published-time-text a, [class*="published-time"] a');
        const publishedText = timeElement ? timeElement.textContent.trim() : '';
        
        // 検索条件にマッチするかチェック
        if (author.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push({
            author: author,
            text: text,
            authorProfileImageUrl: authorProfileImageUrl,
            publishedAt: publishedText,
            id: `page-comment-${index}`,
            element: commentElement // スクロール用
          });
        }
      } catch (error) {
        console.log('ytcmtck: コメント解析中にエラー:', error);
      }
    });
    
    return results;
  }

  // 検索結果を表示
  function displaySearchResults(results, query) {
    if (!searchResultsContainer) return;

    searchResultsContainer.innerHTML = '';
    searchResultsContainer.style.display = 'block';

    if (results.length === 0) {
      const noResults = document.createElement('div');
      noResults.textContent = `"${query}" に一致するユーザーが見つかりませんでした`;
      noResults.style.padding = '12px';
      noResults.style.color = '#666';
      noResults.style.fontSize = '14px';
      noResults.style.textAlign = 'center';
      searchResultsContainer.appendChild(noResults);
      return;
    }

    const resultHeader = document.createElement('div');
    resultHeader.textContent = `"${query}" の検索結果 (${results.length}件)`;
    resultHeader.style.fontSize = '14px';
    resultHeader.style.fontWeight = '500';
    resultHeader.style.marginBottom = '12px';
    resultHeader.style.color = '#0f0f0f';
    searchResultsContainer.appendChild(resultHeader);

    const resultsList = document.createElement('div');
    resultsList.style.maxHeight = '300px';
    resultsList.style.overflowY = 'auto';
    resultsList.style.border = '1px solid #e1e5e9';
    resultsList.style.borderRadius = '8px';
    resultsList.style.backgroundColor = '#ffffff';

    results.forEach((comment, index) => {
      const resultItem = document.createElement('div');
      resultItem.style.padding = '12px';
      resultItem.style.borderBottom = index < results.length - 1 ? '1px solid #f0f0f0' : 'none';
      resultItem.style.cursor = 'pointer';
      resultItem.style.transition = 'background-color 0.2s ease';

      resultItem.addEventListener('mouseenter', () => {
        resultItem.style.backgroundColor = '#f8f9fa';
      });
      resultItem.addEventListener('mouseleave', () => {
        resultItem.style.backgroundColor = '#ffffff';
      });

      const authorInfo = document.createElement('div');
      authorInfo.style.display = 'flex';
      authorInfo.style.alignItems = 'center';
      authorInfo.style.marginBottom = '8px';

      const authorImage = document.createElement('img');
      authorImage.src = comment.authorProfileImageUrl;
      authorImage.style.width = '24px';
      authorImage.style.height = '24px';
      authorImage.style.borderRadius = '50%';
      authorImage.style.marginRight = '8px';
      authorImage.onerror = () => {
        authorImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiNFNUU3RUIiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMCIgcj0iNCIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMjAgMTkuMkMyMCAxNi4wODU3IDE2LjQxODMgMTMuNiAxMiAxMy42QzcuNTgxNzEgMTMuNiA0IDE2LjA4NTcgNCAzNy4yVjIwSDIwVjE5LjJaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPg==';
      };

      const authorName = document.createElement('span');
      authorName.textContent = comment.author;
      authorName.style.fontSize = '14px';
      authorName.style.fontWeight = '500';
      authorName.style.color = '#0f0f0f';      const timeAgo = document.createElement('span');
      timeAgo.textContent = ` • ${comment.publishedAt || formatTimeAgo(comment.publishedAt)}`;
      timeAgo.style.fontSize = '12px';
      timeAgo.style.color = '#606060';

      authorInfo.appendChild(authorImage);
      authorInfo.appendChild(authorName);
      authorInfo.appendChild(timeAgo);

      const commentText = document.createElement('div');
      commentText.textContent = comment.text.length > 100 ? comment.text.substring(0, 100) + '...' : comment.text;
      commentText.style.fontSize = '14px';
      commentText.style.color = '#0f0f0f';
      commentText.style.lineHeight = '1.4';

      resultItem.appendChild(authorInfo);
      resultItem.appendChild(commentText);      // クリックでコメントにスクロール
      resultItem.addEventListener('click', () => {
        // APIから取得したコメントの場合
        if (comment.id && comment.id.startsWith('page-comment-')) {
          // ページ上のコメント（解析前）
          if (comment.element) {
            comment.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // ハイライト効果
            const originalBackground = comment.element.style.backgroundColor;
            comment.element.style.backgroundColor = '#fff3cd';
            setTimeout(() => {
              comment.element.style.backgroundColor = originalBackground;
            }, 2000);
          }
        } else {
          // 解析後のコメント
          const commentElement = document.querySelector(`[data-ytcmtck-hidden="true"] a[href*="lc=${comment.id}"]`);
          if (commentElement) {
            commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // ハイライト効果
            const highlightElement = commentElement.closest('[data-ytcmtck-hidden="true"]');
            if (highlightElement) {
              const originalBackground = highlightElement.style.backgroundColor;
              highlightElement.style.backgroundColor = '#fff3cd';
              setTimeout(() => {
                highlightElement.style.backgroundColor = originalBackground;
              }, 2000);
            }
          }
        }
      });

      resultsList.appendChild(resultItem);
    });

    searchResultsContainer.appendChild(resultsList);
  }

  // 設定モーダルを表示
  function showSettingsModal() {
    // 既存のモーダルがある場合は削除
    const existingModal = document.getElementById('ytcmtck-settings-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'ytcmtck-settings-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.zIndex = '10000';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#ffffff';
    modalContent.style.borderRadius = '12px';
    modalContent.style.padding = '24px';
    modalContent.style.minWidth = '320px';
    modalContent.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
    modalContent.style.fontFamily = 'Roboto, Arial, sans-serif';

    const title = document.createElement('h2');
    title.textContent = 'コメント解析 設定';
    title.style.margin = '0 0 24px 0';
    title.style.fontSize = '20px';
    title.style.fontWeight = '600';
    title.style.color = '#0f0f0f';
    modalContent.appendChild(title);

    // ユーザー名表示設定
    const usernameRow = document.createElement('div');
    usernameRow.style.display = 'flex';
    usernameRow.style.justifyContent = 'space-between';
    usernameRow.style.alignItems = 'center';
    usernameRow.style.marginBottom = '20px';
    
    const usernameLabel = document.createElement('span');
    usernameLabel.textContent = 'ユーザー名を表示';
    usernameLabel.style.fontSize = '16px';
    usernameLabel.style.color = '#0f0f0f';
    usernameRow.appendChild(usernameLabel);

    const usernameSwitch = createToggleSwitch(settings.showUsernames, (value) => {
      settings.showUsernames = value;
      saveSettings();
    });
    usernameRow.appendChild(usernameSwitch);
    modalContent.appendChild(usernameRow);

    // コメント表示設定
    const commentRow = document.createElement('div');
    commentRow.style.display = 'flex';
    commentRow.style.justifyContent = 'space-between';
    commentRow.style.alignItems = 'center';
    commentRow.style.marginBottom = '32px';
    
    const commentLabel = document.createElement('span');
    commentLabel.textContent = 'コメントを表示';
    commentLabel.style.fontSize = '16px';
    commentLabel.style.color = '#0f0f0f';
    commentRow.appendChild(commentLabel);

    const commentSwitch = createToggleSwitch(settings.showComments, (value) => {
      settings.showComments = value;
      saveSettings();
    });    commentRow.appendChild(commentSwitch);
    modalContent.appendChild(commentRow);

    // 背景色カスタマイズ設定
    const backgroundRow = document.createElement('div');
    backgroundRow.style.display = 'flex';
    backgroundRow.style.justifyContent = 'space-between';
    backgroundRow.style.alignItems = 'center';
    backgroundRow.style.marginBottom = '16px';
    
    const backgroundLabel = document.createElement('span');
    backgroundLabel.textContent = '背景色をカスタマイズ';
    backgroundLabel.style.fontSize = '16px';
    backgroundLabel.style.color = '#0f0f0f';
    backgroundRow.appendChild(backgroundLabel);

    const backgroundSwitch = createToggleSwitch(settings.useCustomBackground, (value) => {
      settings.useCustomBackground = value;
      saveSettings();
      // 色選択部分の表示/非表示を切り替え
      colorPickerSection.style.display = value ? 'block' : 'none';
    });
    backgroundRow.appendChild(backgroundSwitch);
    modalContent.appendChild(backgroundRow);

    // 色選択部分
    const colorPickerSection = document.createElement('div');
    colorPickerSection.style.display = settings.useCustomBackground ? 'block' : 'none';
    colorPickerSection.style.marginBottom = '32px';

    const colorLabel = document.createElement('div');
    colorLabel.textContent = '背景色を選択';
    colorLabel.style.fontSize = '14px';
    colorLabel.style.color = '#666';
    colorLabel.style.marginBottom = '8px';
    colorPickerSection.appendChild(colorLabel);

    const colorPicker = createColorPicker(settings.backgroundColor, (color) => {
      settings.backgroundColor = color;
      saveSettings();
    });    colorPickerSection.appendChild(colorPicker);
    modalContent.appendChild(colorPickerSection);

    // 検索ボックス表示設定
    const searchBoxRow = document.createElement('div');
    searchBoxRow.style.display = 'flex';
    searchBoxRow.style.justifyContent = 'space-between';
    searchBoxRow.style.alignItems = 'center';
    searchBoxRow.style.marginBottom = '32px';

    const searchBoxLabel = document.createElement('span');
    searchBoxLabel.textContent = '検索ボックスを表示';
    searchBoxLabel.style.fontSize = '16px';
    searchBoxLabel.style.color = '#0f0f0f';
    searchBoxRow.appendChild(searchBoxLabel);

    const searchBoxSwitch = createToggleSwitch(settings.showSearchBox, (value) => {
      settings.showSearchBox = value;
      saveSettings();
      // 検索ボックスの表示/非表示を即座に反映
      updateSearchBoxVisibility();
    });
    searchBoxRow.appendChild(searchBoxSwitch);
    modalContent.appendChild(searchBoxRow);

    // 閉じるボタン
    const closeButton = document.createElement('button');
    closeButton.textContent = '閉じる';
    closeButton.style.width = '100%';
    closeButton.style.padding = '12px';
    closeButton.style.backgroundColor = '#007AFF';
    closeButton.style.color = '#ffffff';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '8px';
    closeButton.style.fontSize = '16px';
    closeButton.style.fontWeight = '600';
    closeButton.style.cursor = 'pointer';
    closeButton.style.transition = 'background-color 0.2s ease';
    
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.backgroundColor = '#0056CC';
    });
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = '#007AFF';
    });
    
    closeButton.addEventListener('click', () => {
      modal.remove();
    });
    modalContent.appendChild(closeButton);

    modal.appendChild(modalContent);
    
    // モーダル外をクリックしたら閉じる
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
  }

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
  }
  // 検索ボックスの状態を更新
  function updateSearchBoxState() {
    const searchBox = document.getElementById('ytcmtck-user-search');
    if (!searchBox) return;
    
    const searchDescription = searchBox.querySelector('div:nth-child(2)'); // 説明文
    const searchInput = searchBox.querySelector('input');
    
    if (searchDescription) {
      if (allComments.length === 0) {
        searchDescription.textContent = '現在表示されているコメントから検索できます（解析後はより多くのコメントから検索可能）';
      } else {
        searchDescription.textContent = `${allComments.length}件のコメントから検索できます`;
      }
    }
    
    if (searchInput) {
      searchInput.placeholder = '@ユーザーID を入力';
      searchInput.style.backgroundColor = '#ffffff';
    }
  }

  async function onAnalyzeClick() {
    showResult('解析中です', false);
    
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
    
    // 全コメントを保存（検索用）
    allComments = apiData.comments;
    
    showResult('解析が完了しました。\nまもなく解析結果が表示されます。', false);
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
            const commentElement = document.createElement('ytd-comment-view-model');            commentElement.className = 'style-scope ytd-comment-thread-renderer';
            commentElement.setAttribute('data-ytcmtck-hidden', 'true');
            commentElement.style.borderRadius = '8px';
            commentElement.style.marginBottom = '16px';
            commentElement.style.backgroundColor = settings.useCustomBackground ? settings.backgroundColor : 'transparent';
            commentElement.style.padding = settings.useCustomBackground ? '12px' : '0';
            commentElement.innerHTML = `
            <div id="body" class="style-scope ytd-comment-view-model">              <div id="author-thumbnail" class="style-scope ytd-comment-view-model">
                <button id="author-thumbnail-button" class="style-scope ytd-comment-view-model" style="border: none; background: none; padding: 0; cursor: pointer;" aria-label="${comment.author}">
                  <yt-img-shadow fit="" height="40" width="40" class="style-scope ytd-comment-view-model no-transition" style="background-color: transparent;">
                    <img style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" src="${comment.authorProfileImageUrl}" alt="${comment.author}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMzQgMzJDMzQgMjYuNDc3MiAyOS41MjI4IDIyIDI0IDIySDIwSDEyQzEwLjg5NTQgMjIgMTAgMjIuODk1NCAxMCAyNFYzNEgzNFYzMloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'">
                  </yt-img-shadow>
                </button>
              </div>
              <div id="main" class="style-scope ytd-comment-view-model">                <div id="header" class="style-scope ytd-comment-view-model" style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
                  ${settings.showUsernames ? `<h3 class="style-scope ytd-comment-view-model" style="margin: 0; font-size: 13px; line-height: 18px; font-weight: 500;"> 
                    <a class="yt-simple-endpoint style-scope ytd-comment-view-model" href="${comment.authorChannelUrl}" style="color: #0f0f0f; text-decoration: none;">
                      <span class="style-scope ytd-comment-view-model">${comment.author}</span>
                    </a>
                  </h3>` : ''}
                  <span dir="auto" style="color: #606060; font-size: 12px; line-height: 18px;">
                    <a class="yt-simple-endpoint style-scope ytd-comment-view-model" href="/watch?v=${getVideoId()}&lc=${comment.id}" style="color: inherit; text-decoration: none;">
                      ${formatTimeAgo(comment.publishedAt)}
                    </a>
                  </span>
                </div>
                ${settings.showComments ? `<div style="margin-top: 2px;">
                  <span style="color: #0f0f0f; font-size: 14px; line-height: 20px; white-space: pre-wrap;">${comment.text}</span>
                </div>` : ''}<div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
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
          });        }
      }
    }    showResult(resultMsg, true);
    
    // 検索ボックスの状態を更新
    updateSearchBoxState();
      // 検索ボックスを表示（複数回試行で確実に表示）
    setTimeout(() => {
      console.log('ytcmtck: 検索ボックス挿入（1回目）');
      updateSearchBoxVisibility();
    }, 500);
    setTimeout(() => {
      if (!document.getElementById('ytcmtck-user-search')) {
        console.log('ytcmtck: 検索ボックス挿入（2回目、リトライ）');
        updateSearchBoxVisibility();
      } else {
        updateSearchBoxState();
      }
    }, 1500);
    setTimeout(() => {
      if (!document.getElementById('ytcmtck-user-search')) {
        console.log('ytcmtck: 検索ボックス挿入（3回目、最終リトライ）');
        updateSearchBoxVisibility();
      } else {
        updateSearchBoxState();
      }
    }, 3000);
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
        // 検索ボックスが消えた場合の復旧（解析実行後かつ表示設定がONの場合のみ）
      if (settings.showSearchBox && allComments.length > 0 && !document.getElementById('ytcmtck-user-search')) {
        console.log('ytcmtck: 検索ボックスが消失、再挿入を試行');
        setTimeout(() => {
          // 再度チェックしてから再挿入
          if (!document.getElementById('ytcmtck-user-search')) {
            console.log('ytcmtck: 検索ボックス再挿入実行');
            createUserSearchBox();
          }
        }, 500);
      }
    }, 1500); // チェック間隔を短縮（2000ms → 1500ms）
  }

  // 初期化
  function init() {
    // 設定を読み込み
    loadSettings();
    
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
