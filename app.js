// 存储RSS源的键名
const RSS_FEEDS_KEY = 'rss_feeds';
const ARTICLES_CACHE_KEY = 'articles_cache';
const CACHE_EXPIRY_TIME = 60 * 60 * 1000; // 1小时的毫秒数

// 初始化Bootstrap模态框
const addFeedModal = new bootstrap.Modal(document.getElementById('addFeedModal'));

// 获取存储的RSS源
function getFeeds() {
    return JSON.parse(localStorage.getItem(RSS_FEEDS_KEY) || '[]');
}

// 保存RSS源
function saveFeeds(feeds) {
    localStorage.setItem(RSS_FEEDS_KEY, JSON.stringify(feeds));
}

// 获取缓存的文章列表
function getCachedArticles() {
    const cache = localStorage.getItem(ARTICLES_CACHE_KEY);
    if (!cache) return null;

    const { articles, timestamp } = JSON.parse(cache);
    const now = Date.now();

    // 检查缓存是否过期
    if (now - timestamp > CACHE_EXPIRY_TIME) {
        localStorage.removeItem(ARTICLES_CACHE_KEY);
        return null;
    }

    return articles;
}

// 保存文章列表到缓存
function cacheArticles(articles) {
    const cache = {
        articles,
        timestamp: Date.now()
    };
    localStorage.setItem(ARTICLES_CACHE_KEY, JSON.stringify(cache));
}

// 获取网站favicon的函数
async function getFavicon(url) {
    const defaultIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI0ZGOTgwMCIgZD0iTTYuMTggMTUuNjRBMi4xOCAyLjE4IDAgMDA0IDEzLjQ2YTIuMTggMi4xOCAwIDEwMi4xOCAyLjE4em0xMi4wNi0uOTZjLS4wNS0yLjEtLjg1LTQuMDctMi4zMy01LjU1cy0zLjQ1LTIuMjgtNS41NS0yLjMzYTEgMSAwIDAwLTEuMDYgMSAxIDEgMCAwMDEgMS4wNmMxLjY4LjA0IDMuMjUuNyA0LjQ0IDEuODlhNi41NCA2LjU0IDAgMDExLjg5IDQuNDQgMSAxIDAgMDAxLjA2IDEgMSAxIDAgMDAxLTEuMDZ6TTYuMTggMjBBNiA2IDAgMDA0IDE0YTEgMSAwIDAwLTEuMDYgMSAxIDEgMCAwMDEgMS4wNiA0IDQgMCAwMTQuMjQgNC4yNCAxIDEgMCAwMDEuMDYgMSAxIDEgMCAwMDEtMS4wNkE2IDYgMCAwMDYuMTggMjB6bTEyLjA2LTUuMzJjLS4wNS00LjItMS43Mi04LjE0LTQuNzEtMTEuMTNTNi42IDEuMSAyLjQgMS4wNWExIDEgMCAwMC0xLjA2IDEgMSAxIDAgMDAxIDEuMDZjMy43My4wNCA3LjI0IDEuNTMgOS44OSA0LjE4czQuMTQgNi4xNiA0LjE4IDkuODlhMSAxIDAgMDAxLjA2IDEgMSAxIDAgMDAxLTEuMDZ6Ii8+PC9zdmc+';    
    try {
        const urlObj = new URL(url);
        const baseUrl = urlObj.origin;
        const faviconUrl = `${baseUrl}/favicon.ico`;
        
        // 尝试获取网站自身的favicon
        try {
            const response = await fetch(faviconUrl, {
                mode: 'no-cors',
                headers: {
                    'Referer': ''
                }
            });
            if (response.status === 0) { // no-cors模式下，status总是0
                return faviconUrl;
            }
        } catch (error) {
            console.log('尝试获取网站favicon失败，将使用备选方案');
        }
        
        // 尝试使用Google Favicon服务
        try {
            const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(baseUrl)}`;
            const googleResponse = await fetch(googleFaviconUrl, {
                mode: 'no-cors',
                headers: {
                    'Referer': ''
                }
            });
            if (googleResponse.status === 0) { // no-cors模式下，status总是0
                return googleFaviconUrl;
            }
        } catch (error) {
            console.log('尝试获取Google favicon失败，将使用默认图标');
        }
        
        return defaultIcon;
    } catch (error) {
        console.error('URL解析错误:', error);
        return defaultIcon;
    }
}

// 渲染RSS源列表
function renderFeedList() {
    const feeds = getFeeds();
    const feedList = $('#feedList');
    feedList.empty();

    feeds.forEach((feed, index) => {
        const item = $(`
            <li class="list-group-item d-flex justify-content-between align-items-center" data-feed-id="${index}">
                <div class="d-flex align-items-center">
                    <img src="${feed.favicon || 'https://www.google.com/s2/favicons?domain=default'}" 
                         alt="favicon" 
                         class="me-2" 
                         style="width: 16px; height: 16px;">
                    <span class="feed-title">${feed.name}</span>
                </div>
                <div class="feed-actions">
                    <button class="btn btn-link edit-feed p-0 me-2" title="编辑" data-index="${index}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-link delete-feed p-0" title="删除" data-index="${index}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </li>
        `);
        feedList.append(item);
    });

    // 绑定编辑按钮事件
    $('.edit-feed').click(function(e) {
        e.stopPropagation();
        const index = $(this).data('index');
        const feeds = getFeeds();
        const feed = feeds[index];
        
        $('#feedName').val(feed.name);
        $('#feedUrl').val(feed.url);
        $('#addFeedForm').data('editIndex', index);
        $('#addFeedModal .modal-title').text('修改RSS源');
        $('#saveFeedBtn').text('更新');
        addFeedModal.show();
    });

    // 绑定删除按钮事件
    $('.delete-feed').click(function(e) {
        e.stopPropagation();
        const index = $(this).data('index');
        const feeds = getFeeds();
        const feed = feeds[index];

        // 显示确认对话框
        if (confirm(`确定要删除订阅源「${feed.name}」吗？删除后将清除该订阅源的所有缓存数据。`)) {
            // 删除订阅源
            feeds.splice(index, 1);
            saveFeeds(feeds);

            // 清理相关的本地存储数据
            // 1. 清除文章列表缓存
            localStorage.removeItem(ARTICLES_CACHE_KEY);

            // 2. 清除该订阅源的所有文章缓存
            const cacheKeys = Object.keys(localStorage);
            cacheKeys.forEach(key => {
                if (key.startsWith(`${ARTICLE_CACHE_KEY}_`)) {
                    const cache = JSON.parse(localStorage.getItem(key));
                    if (cache?.article?.feedName === feed.name) {
                        localStorage.removeItem(key);
                    }
                }
            });

            // 3. 更新已读文章列表，移除该订阅源的文章
            const readArticles = JSON.parse(localStorage.getItem(READ_ARTICLES_KEY) || '[]');
            const updatedReadArticles = readArticles.filter(articleId => {
                const cache = localStorage.getItem(`${ARTICLE_CACHE_KEY}_${articleId}`);
                if (!cache) return false;
                const article = JSON.parse(cache)?.article;
                return article?.feedName !== feed.name;
            });
            localStorage.setItem(READ_ARTICLES_KEY, JSON.stringify(updatedReadArticles));

            // 重新渲染订阅源列表并加载文章
            renderFeedList();
            loadAllArticles();
        }
    });

    // 点击RSS源时加载其文章
    $('#feedList .list-group-item').click(function() {
        const index = $(this).find('.delete-feed').data('index');
        const feeds = getFeeds();
        const feed = feeds[index];
        loadArticles(feed);
        $(this).addClass('active').siblings().removeClass('active');
    });
}

// 加载RSS源的文章
// CORS代理服务列表
const CORS_PROXIES = [
    'https://api.allorigins.win/get?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://api.codetabs.com/v1/proxy?quest='
];

// 使用代理获取RSS源内容
async function fetchWithProxy(url, proxyIndex = 0, retryCount = 0) {
    const MAX_RETRIES = 2; // 每个代理最大重试次数
    
    if (proxyIndex >= CORS_PROXIES.length) {
        console.warn('所有代理服务都尝试失败，将直接尝试获取原始URL');
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.text();
        } catch (error) {
            throw new Error('无法获取RSS源内容：所有尝试都失败了');
        }
    }

    try {
        const proxyUrl = CORS_PROXIES[proxyIndex] + encodeURIComponent(url);
        console.log(`尝试使用代理服务 ${CORS_PROXIES[proxyIndex]}`);
        
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // 根据不同的代理服务处理响应数据
        let content;
        if (proxyIndex === 0) {
            // api.allorigins.win 返回的数据格式为 { contents: string }
            const data = await response.json();
            content = data.contents;
        } else {
            // 其他代理服务直接返回内容
            content = await response.text();
        }

        // 检查内容是否为HTML页面或空内容
        if (!content || content.trim().length === 0) {
            throw new Error('返回的内容为空');
        }
        if (content.toLowerCase().includes('<!doctype html>') || content.toLowerCase().includes('<html')) {
            throw new Error('返回的内容是HTML页面，不是有效的RSS/XML格式');
        }

        // 预处理XML内容
        content = content
            .replace(/^\s*<\?xml[^>]*\?>\s*/i, '') // 移除现有的XML声明
            .replace(/^\uFEFF/, '') // 移除BOM
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // 移除控制字符
            .replace(/[\uD800-\uDFFF]/g, '') // 移除无效的Unicode字符
            .replace(/&(?![a-zA-Z]+;|#[0-9]+;|#x[0-9a-fA-F]+;)/g, '&amp;') // 修复未转义的&符号
            .replace(/<([a-zA-Z]+)([^>]*)\/>/, '<$1$2></$1>') // 修复自闭合标签
            .trim();

        // 添加新的XML声明
        content = '<?xml version="1.0" encoding="UTF-8"?>\n' + content;

        // 验证XML基本结构
        if (!content.match(/<(rss|feed|rdf:RDF)[^>]*>/i)) {
            throw new Error('无效的RSS/Atom格式：缺少根元素');
        }

        return content;
    } catch (error) {
        console.warn(`代理服务 ${CORS_PROXIES[proxyIndex]} 失败:`, error);
        
        // 如果当前代理未达到最大重试次数，则重试当前代理
        if (retryCount < MAX_RETRIES) {
            console.log(`重试当前代理服务 (${retryCount + 1}/${MAX_RETRIES})`);
            return await new Promise(resolve => setTimeout(resolve, 1000)) // 延迟1秒后重试
                .then(() => fetchWithProxy(url, proxyIndex, retryCount + 1));
        }
        
        // 如果当前代理已达到最大重试次数，尝试下一个代理
        return fetchWithProxy(url, proxyIndex + 1, 0);
    }
}

async function loadArticles(feed) {
    try {
        console.log(`开始加载RSS源: ${feed.name} (${feed.url})`);        
        
        // 首先尝试从缓存中获取文章
        const cachedArticles = getCachedArticles();
        if (cachedArticles) {
            const feedArticles = cachedArticles.filter(article => article.feedName === feed.name);
            if (feedArticles.length > 0) {
                console.log('从缓存中获取文章成功');
                renderArticleList(feed.name, feedArticles);
                return;
            }
        }

        // 如果缓存中没有数据，则从RSS源获取
        let xmlContent = await fetchWithProxy(feed.url);
        
        // 移除可能存在的BOM标记和无效字符
        xmlContent = xmlContent.replace(/^\uFEFF|[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '');
        console.log('已清理BOM标记和无效字符');
        
        // 检查并添加XML声明
        if (!xmlContent.trim().startsWith('<?xml')) {
            xmlContent = '<?xml version="1.0" encoding="UTF-8"?>' + xmlContent;
            console.log('已添加XML声明');
        }

        // 尝试修复常见的XML问题
        xmlContent = xmlContent
            .replace(/&(?![a-zA-Z]+;|#[0-9]+;|#x[0-9a-fA-F]+;)/g, '&amp;') // 修复未转义的&符号
            .replace(/<([a-zA-Z]+)([^>]*)\/>/, '<$1$2></$1>') // 修复自闭合标签
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // 移除控制字符
            .replace(/[\uD800-\uDFFF]/g, ''); // 移除无效的Unicode字符
        
        console.log('已修复XML格式问题');
        
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlContent, 'text/xml');

        // 检查XML解析错误
        const parserError = xml.querySelector('parsererror');
        if (parserError) {
            throw new Error('XML解析错误：' + parserError.textContent);
        }
        console.log('XML解析成功');

        const articles = [];

        // 检测RSS格式并处理命名空间
        const atomNS = 'http://www.w3.org/2005/Atom';
        const isAtom = xml.getElementsByTagNameNS(atomNS, 'feed').length > 0 || xml.querySelector('feed');
        const isRSS1 = xml.querySelector('RDF');
        const isRSS2 = xml.querySelector('rss');
        
        if (isAtom) {
            // 处理Atom格式，包括命名空间
            const atomNS = 'http://www.w3.org/2005/Atom';
            const entries = xml.getElementsByTagNameNS(atomNS, 'entry') || xml.getElementsByTagName('entry');
            Array.from(entries).forEach(entry => {
                // 获取所有link元素，优先使用命名空间
                const links = entry.getElementsByTagNameNS(atomNS, 'link') || entry.getElementsByTagName('link');
                let link = '';
                
                // 优先使用alternate类型的链接
                for (let i = 0; i < links.length; i++) {
                    const linkEl = links[i];
                    const rel = linkEl.getAttribute('rel') || '';
                    if (rel === 'alternate' || !rel) {
                        link = linkEl.getAttribute('href');
                        if (link) break;
                    }
                }
                
                // 如果没有找到合适的链接，使用第一个有href属性的链接
                if (!link && links.length > 0) {
                    for (let i = 0; i < links.length; i++) {
                        link = links[i].getAttribute('href');
                        if (link) break;
                    }
                }

                // 获取标题和更新时间，优先使用命名空间
                const titleEl = entry.getElementsByTagNameNS(atomNS, 'title')[0] || entry.getElementsByTagName('title')[0];
                const titleText = titleEl?.textContent || '无标题';
                // 清理标题中可能包含的HTML标签
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = titleText;
                const title = tempDiv.textContent || tempDiv.innerText || '无标题';

                const updatedEl = entry.getElementsByTagNameNS(atomNS, 'updated')[0] || entry.getElementsByTagName('updated')[0];
                const publishedEl = entry.getElementsByTagNameNS(atomNS, 'published')[0] || entry.getElementsByTagName('published')[0];
                const modifiedEl = entry.getElementsByTagNameNS(atomNS, 'modified')[0] || entry.getElementsByTagName('modified')[0];
                const updated = updatedEl?.textContent || publishedEl?.textContent || modifiedEl?.textContent;

                // 获取文章内容
                const contentEl = entry.getElementsByTagNameNS(atomNS, 'content')[0] || entry.getElementsByTagName('content')[0];
                let content = '';
                if (contentEl) {
                    if (contentEl.getAttribute('type') === 'html' || contentEl.getAttribute('type') === 'xhtml') {
                        content = contentEl.innerHTML || contentEl.textContent;
                    } else {
                        content = contentEl.textContent;
                    }
                }

                articles.push({
                    title: title.trim(),
                    link: link,
                    content: content,
                    pubDate: new Date(updated || Date.now()).getTime(),
                    feedName: feed.name,
                    feedTitle: feed.name,
                    favicon: feed.favicon
                });
            });
        } else if (isRSS1 || isRSS2) {
            // 处理RSS 1.0和2.0格式
            const items = xml.getElementsByTagName('item');
            Array.from(items).forEach(item => {
                const title = item.getElementsByTagName('title')[0]?.textContent || '无标题';
                const link = item.getElementsByTagName('link')[0]?.textContent || '';
                const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent ||
                               item.getElementsByTagName('dc:date')[0]?.textContent ||
                               item.getElementsByTagName('date')[0]?.textContent;

                // 获取文章内容，按优先级尝试不同的标签
                let content = '';
                const contentEncoded = item.getElementsByTagName('content:encoded')[0];
                const description = item.getElementsByTagName('description')[0];
                const dcContent = item.getElementsByTagName('dc:content')[0];
                const contentEl = item.getElementsByTagName('content')[0];

                if (contentEncoded) {
                    content = contentEncoded.textContent;
                } else if (description) {
                    content = description.textContent;
                } else if (dcContent) {
                    content = dcContent.textContent;
                } else if (contentEl) {
                    content = contentEl.textContent;
                }

                articles.push({
                    title: title.trim(),
                    link: link,
                    content: content,
                    pubDate: new Date(pubDate || Date.now()).getTime(),
                    feedName: feed.name,
                    feedTitle: feed.name,
                    favicon: feed.favicon
                });
            });
        } else {
            throw new Error('不支持的RSS格式');
        }

        if (articles.length === 0) {
            throw new Error('未找到任何文章');
        }

        // 按发布时间排序
        articles.sort((a, b) => b.pubDate - a.pubDate);
        // 限制每个订阅源只显示最新的20篇文章
        const latestArticles = articles.slice(0, 20);
        renderArticleList(feed.name, latestArticles);
    } catch (error) {
        console.error('加载文章失败:', error);
        console.error('Feed URL:', feed.url);
        console.error('错误详情:', error.stack);
        alert(`加载文章失败: ${error.message}`);
    }
}

// 渲染文章列表
function renderArticleList(feedName, articles) {
    const articleList = $('#articleList');
    articleList.empty();

    // 过滤掉已读的文章
    const unreadArticles = articles.filter(article => !ArticleDetail.isRead(article.link));

    if (unreadArticles.length === 0) {
        articleList.html('<div class="text-center text-muted p-3">暂无未读文章</div>');
        return;
    }

    unreadArticles.forEach(article => {
        // 创建一个干净的文章对象，只包含必要的字段
        const cleanArticle = {
            title: article.title?.trim() || '无标题',
            link: article.link,
            pubDate: article.pubDate,
            author: article.author,
            'content:encoded': article['content:encoded'],
            content: article.content,
            description: article.description,
            summary: article.summary,
            feedTitle: article.feedTitle,
            feedName: article.feedName || feedName
        };

        // 确保所有字段都经过适当的处理
        Object.keys(cleanArticle).forEach(key => {
            if (typeof cleanArticle[key] === 'string') {
                // 移除控制字符和特殊Unicode字符
                cleanArticle[key] = cleanArticle[key]
                    .replace(/[\u0000-\u001F\u007F-\u009F\u2000-\u200F\u2028-\u202F]/g, '')
                    .replace(/[\uD800-\uDFFF]/g, '')
                    .trim();
            }
        });

        // 获取feed的favicon
        const feeds = getFeeds();
        const feed = feeds.find(f => f.name === cleanArticle.feedName);
        const favicon = feed ? feed.favicon : 'https://www.google.com/s2/favicons?domain=default';

        // 格式化日期
        const formatDate = (timestamp) => {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();
            const isThisYear = date.getFullYear() === now.getFullYear();
            
            if (isToday) {
                return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            } else if (isThisYear) {
                return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            } else {
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            }
        };

        // 缓存文章数据
        ArticleDetail.cache(cleanArticle.link, cleanArticle);

        const item = $(`
            <li class="list-group-item article-item" data-article-id="${cleanArticle.link}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="d-flex align-items-center">
                        <img src="${favicon}" alt="favicon" class="me-2" style="width: 16px; height: 16px;">
                        <div class="article-info">
                            <div class="article-title">${cleanArticle.title}</div>
                            <div class="article-meta text-muted small">
                                <span class="me-2">${cleanArticle.feedName}</span>
                                ${cleanArticle.author ? `<span class="me-2">${cleanArticle.author}</span>` : ''}
                                <span>${formatDate(cleanArticle.pubDate)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </li>
        `);
        articleList.append(item);
    });

    // 绑定点击事件
    $('.article-item').click(function() {
        const articleId = $(this).data('article-id');
        const article = ArticleDetail.getFromCache(articleId);
        if (!article) {
            console.error('文章数据不存在:', articleId);
            alert('加载文章失败：文章数据不存在');
            return;
        }
        ArticleDetail.show(article);
        $(this).addClass('active').siblings().removeClass('active');
    });
}

// 添加RSS源
$('#addFeedBtn').click(() => {
    $('#addFeedForm')[0].reset();
    $('#addFeedForm').removeData('editIndex');
    $('#addFeedModal .modal-title').text('添加RSS源');
    $('#saveFeedBtn').text('保存');
    addFeedModal.show();
});

// 保存RSS源
$('#saveFeedBtn').click(async () => {
    const name = $('#feedName').val().trim();
    const url = $('#feedUrl').val().trim();

    if (!name || !url) {
        alert('请填写完整信息');
        return;
    }

    const feeds = getFeeds();
    const editIndex = $('#addFeedForm').data('editIndex');
    const favicon = await getFavicon(url);
    
    if (editIndex >= 0) {
        // 更新现有RSS源
        feeds[editIndex] = { name, url, favicon };
    } else {
        // 添加新RSS源
        feeds.push({ name, url, favicon });
    }
    
    saveFeeds(feeds);
    renderFeedList();
    // 清除文章缓存并重新加载所有文章
    localStorage.removeItem(ARTICLES_CACHE_KEY);
    loadAllArticles();
    addFeedModal.hide();
    $('#addFeedForm')[0].reset();
});

// 导出RSS源
$('#exportBtn').click(() => {
    const feeds = getFeeds();
    const blob = new Blob([JSON.stringify(feeds, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rss_feeds.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// 导入RSS源
$('#importBtn').click(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
        try {
            const file = e.target.files[0];
            const text = await file.text();
            const feeds = JSON.parse(text);
            
            if (!Array.isArray(feeds)) {
                throw new Error('无效的RSS源文件格式');
            }

            // 为每个导入的RSS源获取favicon
            const feedsWithFavicon = await Promise.all(feeds.map(async feed => {
                feed.favicon = await getFavicon(feed.url);
                return feed;
            }));
            
            saveFeeds(feedsWithFavicon);
            renderFeedList();
            // 清除文章缓存并重新加载
            localStorage.removeItem(ARTICLES_CACHE_KEY);
            loadAllArticles();
        } catch (error) {
            console.error('导入RSS源失败:', error);
            alert(`导入失败: ${error.message}`);
        }
    };
    input.click();
});

// 初始化页面
function initializePage() {
    renderFeedList();
    loadAllArticles();

    // 绑定添加RSS源按钮事件
    $('#addFeedBtn').click(() => {
        $('#addFeedForm').data('editIndex', -1);
        $('#addFeedModal .modal-title').text('添加RSS源');
        $('#saveFeedBtn').text('保存');
        $('#feedName').val('');
        $('#feedUrl').val('');
        addFeedModal.show();
    });

    // 绑定移动端显示侧边栏按钮事件
    $('#showSidebarBtn').click(() => {
        $('.feed-list-container').addClass('show');
    });

    // 绑定移动端关闭侧边栏按钮事件
    $('#closeSidebarBtn').click(() => {
        $('.feed-list-container').removeClass('show');
    });

    const feeds = getFeeds();
    if (feeds.length > 0) {
        loadAllArticles();
    }
}

// 侧边栏折叠状态的本地存储key
const SIDEBAR_STATE_KEY = 'sidebar_collapsed';

// 初始化侧边栏状态
function initializeSidebarState() {
    const feedListContainer = document.querySelector('.feed-list-container');
    const contentContainer = document.querySelector('.content-container');
    const toggleSidebarBtn = document.querySelector('.toggle-sidebar-btn');

    if (!feedListContainer || !contentContainer || !toggleSidebarBtn) {
        console.warn('侧边栏初始化失败：未找到必要的DOM元素');
        return;
    }

    const isCollapsed = localStorage.getItem(SIDEBAR_STATE_KEY) === 'true';
    if (isCollapsed) {
        feedListContainer.classList.add('collapsed');
        contentContainer.classList.add('sidebar-collapsed');
    }

    // 绑定侧边栏切换按钮事件
    toggleSidebarBtn.addEventListener('click', () => {
        const isCurrentlyCollapsed = feedListContainer.classList.contains('collapsed');

        feedListContainer.classList.toggle('collapsed');
        contentContainer.classList.toggle('sidebar-collapsed');

        // 更新折叠按钮图标
        const icon = toggleSidebarBtn.querySelector('i');
        if (feedListContainer.classList.contains('collapsed')) {
            icon.classList.remove('bi-chevron-left');
            icon.classList.add('bi-chevron-right');
        } else {
            icon.classList.remove('bi-chevron-right');
            icon.classList.add('bi-chevron-left');
        }

        // 保存当前状态到本地存储
        localStorage.setItem(SIDEBAR_STATE_KEY, !isCurrentlyCollapsed);
    });

    // 移动端导航栏按钮
    document.querySelector('.navbar-toggler')?.addEventListener('click', () => {
        document.querySelector('.feed-list-container').classList.toggle('show');
    });

    // 移动端显示侧边栏按钮
    document.getElementById('showSidebarBtn')?.addEventListener('click', () => {
        document.querySelector('.feed-list-container').style.left = '0';
    });

    // 移动端关闭侧边栏按钮
    document.getElementById('closeSidebarBtn')?.addEventListener('click', () => {
        document.querySelector('.feed-list-container').style.left = '-100%';
    });
}

// 加载所有RSS源的文章
async function loadAllArticles() {
    const feeds = getFeeds();
    const articleList = $('#articleList');
    articleList.empty();

    if (feeds.length === 0) {
        articleList.html('<div class="text-center text-muted p-3">暂无订阅源，请先添加RSS源</div>');
        return;
    }

    // 首先尝试从缓存中获取文章
    const cachedArticles = getCachedArticles();
    if (cachedArticles && cachedArticles.length > 0) {
        console.log('从缓存中获取所有文章成功');
        renderArticleList(null, cachedArticles);
        return;
    }

    // 显示加载提示
    articleList.html('<div class="text-center p-3"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">加载中...</span></div><div class="mt-2 text-muted">正在加载文章...</div></div>');

    try {
        // 并行加载所有订阅源的文章
        const allArticles = [];
        await Promise.all(feeds.map(async (feed) => {
            try {
                const xmlContent = await fetchWithProxy(feed.url);
                
                // 预处理XML内容
                const cleanXmlContent = xmlContent
                    .replace(/^\uFEFF/, '') // 移除BOM
                    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // 移除控制字符
                    .trim(); // 移除前后空白字符
                
                // 尝试解析XML内容
                const parser = new DOMParser();
                const xml = parser.parseFromString(cleanXmlContent, 'text/xml');
                
                // 检查解析是否成功
                const parserError = xml.querySelector('parsererror');
                if (parserError) {
                    throw new Error(`XML解析错误：${parserError.textContent}`);
                }

                const articles = [];
                const isAtom = xml.querySelector('feed');
                const isRSS1 = xml.querySelector('RDF');
                const isRSS2 = xml.querySelector('rss');

                if (isAtom) {
                    // 处理Atom格式
                    const entries = xml.getElementsByTagName('entry');
                    Array.from(entries).forEach(entry => {
                        const article = parseAtomEntry(entry, feed);
                        if (article) articles.push(article);
                    });
                } else if (isRSS1 || isRSS2) {
                    // 处理RSS格式
                    const items = xml.getElementsByTagName('item');
                    Array.from(items).forEach(item => {
                        const article = parseRSSItem(item, feed);
                        if (article) articles.push(article);
                    });
                }

                allArticles.push(...articles);
            } catch (error) {
                console.error(`加载${feed.name}的文章失败:`, error);
            }
        }));

        // 按发布时间排序
        allArticles.sort((a, b) => b.pubDate - a.pubDate);

        // 缓存所有文章
        if (allArticles.length > 0) {
            cacheArticles(allArticles);
        }

        // 渲染文章列表
        if (allArticles.length > 0) {
            renderArticleList(null, allArticles);
        } else {
            articleList.html('<div class="text-center text-muted p-3">暂无文章</div>');
        }
    } catch (error) {
        console.error('加载文章失败:', error);
        articleList.html(`<div class="text-center text-danger p-3">加载文章失败: ${error.message}</div>`);
    }
}

// 解析Atom格式的文章条目
function parseAtomEntry(entry, feed) {
    try {
        const title = entry.getElementsByTagName('title')[0]?.textContent || '无标题';
        const links = entry.getElementsByTagName('link');
        let link = '';
        
        // 获取文章链接
        for (let i = 0; i < links.length; i++) {
            const linkEl = links[i];
            const rel = linkEl.getAttribute('rel') || '';
            if (rel === 'alternate' || !rel) {
                link = linkEl.getAttribute('href');
                if (link) break;
            }
        }

        // 获取发布时间
        const updated = entry.getElementsByTagName('updated')[0]?.textContent ||
                       entry.getElementsByTagName('published')[0]?.textContent ||
                       entry.getElementsByTagName('modified')[0]?.textContent;

        // 获取作者
        const authorEl = entry.getElementsByTagName('author')[0];
        const author = authorEl ? authorEl.getElementsByTagName('name')[0]?.textContent : null;

        // 获取内容
        const contentEl = entry.getElementsByTagName('content')[0];
        let content = '';
        if (contentEl) {
            content = contentEl.textContent;
        }

        return {
            title: title.trim(),
            link: link,
            content: content,
            pubDate: new Date(updated || Date.now()).getTime(),
            author: author,
            feedName: feed.name,
            feedTitle: feed.name,
            favicon: feed.favicon
        };
    } catch (error) {
        console.error('解析Atom条目失败:', error);
        return null;
    }
}

// 解析RSS格式的文章条目
function parseRSSItem(item, feed) {
    try {
        const title = item.getElementsByTagName('title')[0]?.textContent || '无标题';
        const link = item.getElementsByTagName('link')[0]?.textContent || '';
        const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent ||
                       item.getElementsByTagName('dc:date')[0]?.textContent ||
                       item.getElementsByTagName('date')[0]?.textContent;

        // 获取作者
        const author = item.getElementsByTagName('author')[0]?.textContent ||
                      item.getElementsByTagName('dc:creator')[0]?.textContent;

        // 获取内容
        let content = '';
        const contentEncoded = item.getElementsByTagName('content:encoded')[0];
        const description = item.getElementsByTagName('description')[0];

        if (contentEncoded) {
            content = contentEncoded.textContent;
        } else if (description) {
            content = description.textContent;
        }

        return {
            title: title.trim(),
            link: link,
            content: content,
            pubDate: new Date(pubDate || Date.now()).getTime(),
            author: author,
            feedName: feed.name,
            feedTitle: feed.name,
            favicon: feed.favicon
        };
    } catch (error) {
        console.error('解析RSS条目失败:', error);
        return null;
    }
}

// 绑定刷新按钮事件
function initializeRefreshButton() {
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        localStorage.removeItem(ARTICLES_CACHE_KEY);
        loadAllArticles();
    });
}

$(document).ready(() => {
    initializePage();
    ArticleDetail.initialize();
    initializeSidebarState();
    initializeRefreshButton();
});