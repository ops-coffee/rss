// 文章详情相关的常量
const ARTICLE_CACHE_KEY = 'article_cache';
const ARTICLE_CACHE_EXPIRY = 30 * 60 * 1000; // 30分钟缓存过期

// 获取文章详情的缓存
function getCachedArticle(url) {
    const cache = localStorage.getItem(`${ARTICLE_CACHE_KEY}_${url}`);
    if (!cache) {
        console.log('未找到文章缓存:', url);
        return null;
    }

    try {
        const { article, timestamp } = JSON.parse(cache);
        const now = Date.now();

        if (now - timestamp > ARTICLE_CACHE_EXPIRY) {
            console.log('文章缓存已过期:', url);
            localStorage.removeItem(`${ARTICLE_CACHE_KEY}_${url}`);
            return null;
        }

        console.log('成功获取文章缓存:', url);
        return article;
    } catch (error) {
        console.error('解析文章缓存失败:', error);
        localStorage.removeItem(`${ARTICLE_CACHE_KEY}_${url}`);
        return null;
    }
}

// 缓存文章详情
function cacheArticle(url, article) {
    // 创建文章数据的副本，避免修改原始数据
    const articleToCache = { ...article };

    // 处理Atom格式的content字段
    if (articleToCache.content) {
        if (typeof articleToCache.content === 'object') {
            // 处理Atom格式的content对象
            if (articleToCache.content._) {
                // 如果存在文本内容
                articleToCache.content = articleToCache.content._;
            } else if (articleToCache.content.type === 'html' && articleToCache.content.$) {
                // 如果是HTML格式的内容
                articleToCache.content = articleToCache.content.$;
            }
        }
        // 如果content是字符串，保持原样
    }

    const cache = {
        article: articleToCache,
        timestamp: Date.now()
    };
    localStorage.setItem(`${ARTICLE_CACHE_KEY}_${url}`, JSON.stringify(cache));
}

// 处理HTML实体和特殊字符
function decodeHtmlEntities(text) {
    if (!text) return '';
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}

// 显示文章详情
function showArticleDetail(article) {
    if (!article) {
        console.error('无效的文章数据');
        return;
    }

    const detailContainer = document.getElementById('articleDetail');
    const formatDate = (timestamp) => {
        if (!timestamp) return '未知时间';
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    try {
        // 从缓存的JSON数据中获取文章内容
        const title = article.title || '无标题';
        const author = article.author ? decodeHtmlEntities(article.author) : null;
        const pubDate = formatDate(article.pubDate);
        const source = decodeHtmlEntities(article.feedTitle || article.feedName) || '未知来源';
        // 优化内容获取逻辑，优先处理Atom格式的content字段
        let content = '';
        if (article.content && typeof article.content === 'object' && article.content._) {
            // Atom格式的content字段
            content = article.content._;
        } else {
            content = article['content:encoded'] || article.content || article.description || article.summary || '暂无内容';
        }
        const link = article.link || null;

        // 高亮对应的订阅源
        const feedList = document.querySelectorAll('#feedList .list-group-item');
        feedList.forEach(item => {
            const feedTitle = item.querySelector('.feed-title').textContent;
            if (feedTitle === article.feedName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // 构建文章详情HTML
        detailContainer.innerHTML = `
            <div class="card-header">
                <h4 class="card-title">${title}</h4>
                <div class="article-meta">
                    ${author ? `
                        <span class="text-muted me-3">
                            <i class="bi bi-person"></i> ${author}
                        </span>
                    ` : ''}
                    <span class="text-muted me-3">
                        <i class="bi bi-calendar"></i> ${pubDate}
                    </span>
                    <span class="text-muted">
                        <i class="bi bi-rss"></i> ${source}
                    </span>
                </div>
            </div>
            <div class="card-body article-content">
                <div class="article-content-inner">${content}</div>
                ${link ? `<div class="mt-3"><a href="${link}" target="_blank" class="btn btn-primary">阅读原文</a></div>` : ''}
            </div>
        `;

        // 在移动端视图下，显示文章详情时隐藏文章列表
        if (window.innerWidth <= 768) {
            document.querySelector('.content-container').classList.add('detail-view');
        }

        // 处理文章内容中的图片
        const images = detailContainer.getElementsByTagName('img');
        Array.from(images).forEach(img => {
            // 移除宽高属性，使用CSS控制
            img.removeAttribute('width');
            img.removeAttribute('height');
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
        });

        // 处理文章内容中的链接
        const links = detailContainer.getElementsByTagName('a');
        Array.from(links).forEach(link => {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        });

    } catch (error) {
        console.error('显示文章详情失败:', error);
        detailContainer.innerHTML = `
            <div class="card-body">
                <div class="alert alert-danger">加载文章失败: ${error.message}</div>
            </div>
        `;
    }
}

// 文章详情模块
const ArticleDetail = {
    cache: cacheArticle,
    getFromCache: getCachedArticle,
    show: showArticleDetail
};

// 返回文章列表（移动端）
function backToList() {
    document.querySelector('.content-container').classList.remove('detail-view');
}

// 已读文章相关的常量
const READ_ARTICLES_KEY = 'read_articles';

// 获取已读文章列表
function getReadArticles() {
    const readArticles = localStorage.getItem(READ_ARTICLES_KEY);
    return readArticles ? JSON.parse(readArticles) : [];
}

// 标记文章为已读
function markArticleAsRead(articleId) {
    const readArticles = getReadArticles();
    if (!readArticles.includes(articleId)) {
        readArticles.push(articleId);
        localStorage.setItem(READ_ARTICLES_KEY, JSON.stringify(readArticles));
    }
}

// 检查文章是否已读
function isArticleRead(articleId) {
    const readArticles = getReadArticles();
    return readArticles.includes(articleId);
}

// 初始化文章详情相关事件
function initializeArticleDetail() {
    // 点击文章链接时显示详情
    document.getElementById('articleList').addEventListener('click', (e) => {
        const listItem = e.target.closest('.list-group-item');
        if (!listItem) return;

        try {
            const articleId = listItem.dataset.articleId;
            if (!articleId) throw new Error('文章ID不存在');
            
            const article = getCachedArticle(articleId);
            if (!article) throw new Error('文章数据不存在');
            
            // 标记文章为已读
            markArticleAsRead(articleId);
            
            showArticleDetail(article);
        } catch (error) {
            console.error('文章加载错误:', error);
            alert('加载文章失败：请确保文章数据格式正确');
        }
    });

    // 移动端返回按钮事件
    document.getElementById('backToListBtn')?.addEventListener('click', backToList);
}

// 导出函数
window.ArticleDetail = {
    ...ArticleDetail,
    isRead: isArticleRead,
    getReadList: getReadArticles
};

// 导出文章详情模块
window.ArticleDetail = ArticleDetail;

// 添加初始化方法到ArticleDetail对象
ArticleDetail.initialize = initializeArticleDetail;