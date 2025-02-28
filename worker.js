// 定义常量
const CHECK_INTERVAL = 10 * 60 * 1000; // 10分钟检查一次

// 检查订阅源更新
async function checkFeedUpdates() {
    try {
        // 请求主线程获取数据
        self.postMessage({ type: 'getFeeds' });
        self.postMessage({ type: 'getArticlesCache' });

        // 等待主线程返回数据后继续处理
        let feeds = [];
        let articlesCache = {};
        let hasUpdates = false;

        for (const feed of feeds) {
            try {
                const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(feed.url)}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const feedText = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(feedText, 'text/xml');
                
                // 解析RSS/Atom源
                const items = Array.from(xmlDoc.querySelectorAll('item, entry'));
                const feedArticles = articlesCache[feed.url] || [];
                
                for (const item of items) {
                    const guid = item.querySelector('guid')?.textContent || item.querySelector('id')?.textContent;
                    const link = item.querySelector('link')?.textContent;
                    const articleId = guid || link;
                    
                    // 检查文章是否已存在
                    if (!feedArticles.some(a => a.id === articleId)) {
                        const newArticle = {
                            id: articleId,
                            title: item.querySelector('title')?.textContent || '无标题',
                            link: link,
                            pubDate: new Date(item.querySelector('pubDate, published')?.textContent).getTime(),
                            content: item.querySelector('description, content')?.textContent || '',
                            feedName: feed.title
                        };
                        
                        feedArticles.unshift(newArticle);
                        hasUpdates = true;
                    }
                }
                
                // 更新缓存
                articlesCache[feed.url] = feedArticles;
                
            } catch (error) {
                console.error(`检查订阅源 ${feed.title} 失败:`, error);
            }
        }
        
        if (hasUpdates) {
            // 通知主线程更新缓存
            self.postMessage({ type: 'updateArticlesCache', data: articlesCache });
            self.postMessage({ type: 'update', message: '发现新文章' });
        }
        
    } catch (error) {
        console.error('检查更新失败:', error);
        self.postMessage({ type: 'error', message: error.message });
    }
}

// 启动定时检查
setInterval(checkFeedUpdates, CHECK_INTERVAL);

// 立即执行一次检查
checkFeedUpdates();

// 监听主线程消息
self.addEventListener('message', (e) => {
    const { type, data } = e.data;
    
    switch (type) {
        case 'check':
            checkFeedUpdates();
            break;
        case 'feedsData':
            feeds = data;
            break;
        case 'articlesCacheData':
            articlesCache = data;
            break;
    }
});