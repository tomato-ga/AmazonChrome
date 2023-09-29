chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openTab') {
        chrome.tabs.create({ url: message.url, active: false });
        return true; // Will respond asynchronously
    }
});

chrome.webNavigation.onCompleted.addListener(function(details) {
    chrome.storage.sync.get('enabled', function(data) {
        if (data.enabled) {
            if (details.url === 'https://www.amazon.co.jp/') {
                // 新規ウィンドウをバックグラウンドで開く
                chrome.windows.create({
                    url: 'https://www.amazon.co.jp/gp/goldbox',
                    focused: false, // ウィンドウをフォアグラウンドにしない
                    type: 'normal'  // 通常のウィンドウとして開く
                });
            }
        }
    });
}, {
    url: [{
        hostEquals: 'www.amazon.co.jp',
        pathEquals: '/'
    }]
});
