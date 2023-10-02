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

        // DealページのdpURLを処理する
        case 'processDealLinkMap':
            dealProcessLinks(message.linkMap);
            break;

        case 'dpData':
            console.log("Received dpData:", message.url, message.data);
            
            chrome.tabs.create({ url: message.url, active: false }, (newTab) => {
                chrome.tabs.onUpdated.addListener(function listener (tabId, info) {
                    if (info.status === 'complete' && tabId === newTab.id) {
                        chrome.tabs.sendMessage(tabId, {action: 'processDpData', data: message.data, url: message.url});
                        chrome.tabs.onUpdated.removeListener(listener);  // Remove the listener to avoid it being called again
                    }
                });
            });
            break;

        case 'dealData':
            openTabsForDealUrls(message.data);
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

// TODO dealURLを含めたオブジェクトが渡る
async function dealProcessLinks(linksObj) {
    let processedCount = 0;

    // 1. Listenerの累積を防ぐための関数
    function createTabAndUpdateListener(dpUrl, dealUrl) {
        return new Promise((resolve, reject) => {
            chrome.tabs.create({ url: dpUrl, active: false }, function(tab) {
                function listener(tabId, info) {
                    if (info.status === 'complete' && tabId === tab.id) {
                        console.log("deal URLから/dpを開いたよ");
                        
                        // chrome.runtime.sendMessageをchrome.tabs.sendMessageに変更
                        chrome.tabs.sendMessage(tab.id, { action: 'processDpData', dpUrl: dpUrl, dealUrl: dealUrl });

                        // リスナーを削除
                        chrome.tabs.onUpdated.removeListener(listener);
                        resolve();
                    }
                }

                // 新しいタブが開かれた後にリスナーを追加
                chrome.tabs.onUpdated.addListener(listener);
            });
        });
    }

    for (let dealUrl in linksObj) {
        let dpUrls = linksObj[dealUrl];
        console.log("dealURLから開くdpURLです: ", dpUrls);

        for (let dpUrl of dpUrls) {
            try {
                // 2. タイムアウトの代わりにリスナーがresolveされるのを待つ
                await createTabAndUpdateListener(dpUrl, dealUrl);
                processedCount++;
            } catch (error) {
                console.error("Error while processing dpUrl:", dpUrl, "Error:", error);
            }
        }
        // 2. 各dealUrlごとの待ち時間。必要に応じて調整してください。
        await new Promise(resolve => setTimeout(resolve, 7000));
    }

    console.log(`Processed ${processedCount} links.`);
}


const processedTabs = new Set();  // 処理済みのタブIDを保存するセット

async function openTabsForDealUrls(data) {
    console.log("Received dealData:", data);
    
    let urlsToOpen = data.urls.slice(0, 3); // 配列の先頭から3つの要素を取得

    for (let dealUrl of urlsToOpen) {
        if (dealUrl) {
            // タブを開くときにPromiseを使用して、完了を待つ
            await new Promise(resolve => {
                chrome.tabs.create({ url: dealUrl, active: false }, function(newTab) {
                    let listener = function(tabId, info) {
                        if (info.status === 'complete' && tabId === newTab.id && !processedTabs.has(tabId)) {
                            chrome.tabs.sendMessage(tabId, {action: 'processDealData'});
                            processedTabs.add(tabId);  // タブIDを処理済みのセットに追加
                            chrome.tabs.onUpdated.removeListener(listener);
                            resolve();
                        }
                    };
                    // 新しいタブが開かれた後にリスナーを追加
                    chrome.tabs.onUpdated.addListener(listener);
                });
            });
        }
    }
}

