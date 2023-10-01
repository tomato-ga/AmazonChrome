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
            dealProcessLinks(message.links);
            break;

        case 'dpData':  // このアクションを追加
            console.log("Received dpData:", message.data);
            // dpDataのfurther処理をこちらに追加する
            break;

        case 'dealData':  // このアクションを追加
            console.log("Received dealData:", message.data);
            // dealDataのfurther処理をこちらに追加する
            break;
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


async function dealProcessLinks(links) {
    let processedCount = 0;

    for (let i = 0; i < links.length; i += 3) {
        let urlsToOpen = links.slice(i, i + 3);
        for (let dpUrl of urlsToOpen) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            chrome.tabs.create({ url: dpUrl, active: false });
            processedCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 7000));
    }

    console.log(`Processed ${processedCount} out of ${links.length} links.`);
}
