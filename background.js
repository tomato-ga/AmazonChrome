// /Users/ore/Desktop/AmazonChromeEx/background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'openTab':
            chrome.tabs.create({ url: message.url, active: false });
            return true; // Will respond asynchronously

        case 'dealLinks':
            console.log(message.links);
            break;

        case 'closeCurrentTab':
            chrome.tabs.remove(sender.tab.id);
            break;

        case 'processLinkMap':
            dealProcessLinks(message.linkMap);
            break;

        // 他のメッセージタイプの処理もここに追加できます
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

async function dealProcessLinks(linkMap) {
    let processedCount = 0;

    // linkMapから全ての/dpリンクを取得
    for (let dealUrl in linkMap) {
        const dpLinks = linkMap[dealUrl];

        for (let i = 0; i < dpLinks.length; i += 3) {
            let urlsToOpen = dpLinks.slice(i, i + 3);
            for (let dpUrl of urlsToOpen) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                chrome.tabs.create({ url: dpUrl, active: false });
                processedCount++;
            }
            await new Promise(resolve => setTimeout(resolve, 7000));
        }
    }
    console.log(`Processed ${processedCount} links.`);
}
