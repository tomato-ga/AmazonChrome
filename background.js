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
                let isLoaded = false;
        
                const checkTabStatus = (tabId, info) => {
                    if (info.status === 'complete' && tabId === newTab.id) {
                        isLoaded = true;
                        chrome.tabs.sendMessage(tabId, {action: 'processDpData', data: message.data, url: message.url});
                        chrome.tabs.onUpdated.removeListener(checkTabStatus);  // Remove the listener to avoid it being called again
                    }
                };
        
                // 5秒後にタブのロードステータスを確認する
                setTimeout(() => {
                    if (!isLoaded) {
                        // タブのロードが完了していない場合、タブをリロードする
                        chrome.tabs.reload(newTab.id);
                    }
                }, 5000);
        
                chrome.tabs.onUpdated.addListener(checkTabStatus);
            });
            break;
            
        case 'dealData':
            openTabsForDealUrls(message.data);
            break;

        case 'saveToDynamoDB':
            console.log('保存はあとで');
            // TODO DB保存は一時停止中
            saveToDynamoDB(message.data).then(response => {
                sendResponse(response);
            });
            return true;  // 応答を非同期で返すために必要

        case 'closeCreatedWindow':
            if (openedWindowId) {
                chrome.windows.remove(openedWindowId); // ウィンドウを閉じる
                openedWindowId = null; // IDをリセット
            }
            break;
    }
});

// chrome.webNavigation.onCompleted.addListener(function(details) {
//     chrome.storage.sync.get('enabled', function(data) {
//         if (data.enabled) {
//             if (details.url === 'https://www.amazon.co.jp/') {
//                 // 新規ウィンドウをバックグラウンドで開く
//                 chrome.windows.create({
//                     url: 'https://www.amazon.co.jp/gp/goldbox',
//                     focused: false, // ウィンドウをフォアグラウンドにしない
//                     type: 'normal'  // 通常のウィンドウとして開く
//                 });
//             }
//         }
//     });
// }, {
//     url: [{
//         hostEquals: 'www.amazon.co.jp',
//         pathEquals: '/'
//     }]
// });


let openedWindowId; // 新しく開いたウィンドウのIDを保存する変数

chrome.webNavigation.onCompleted.addListener(function(details) {
    chrome.storage.sync.get('enabled', function(data) {
        if (data.enabled) {
            if (details.url === 'https://www.amazon.co.jp/') {
                chrome.windows.create({
                    url: 'https://www.amazon.co.jp/gp/goldbox',
                    focused: false,
                    type: 'normal'
                }, function(window) {
                    openedWindowId = window.id; // ウィンドウIDを保存
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

let retries = 3;
const delay = (ms) => new Promise(res => setTimeout(res, ms));

// TODO dealの場合は別テーブルを用意する
async function saveToDynamoDB(productInfo) {

    if (productInfo.dealUrl) {
        try {
            // MEMO: テスト用のAPI const response = await fetch('https://02iq8m0s80.execute-api.ap-northeast-1.amazonaws.com/saletest/saletest', {
    
            const response = await fetch('https://ywrr1ij1ka.execute-api.ap-northeast-1.amazonaws.com/dealtest/saledeal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productInfo)
            });
    
            if (!response.ok) {
                const err = await response.json();
                throw err;
            }
            const responseData = await response.json();
            console.log('データ保存成功', responseData);
            return responseData;  // 保存が成功した場合はレスポンスを返す
        } catch (err) {
            console.error('DynamoDB保存でエラーが出ました', err);
            return err;  // エラーが発生した場合はエラー情報を返す
        }
    }

    try {
        // MEMO: テスト用のAPI const response = await fetch('https://02iq8m0s80.execute-api.ap-northeast-1.amazonaws.com/saletest/saletest', {

        const response = await fetch('https://y6rdeogd9l.execute-api.ap-northeast-1.amazonaws.com/ex/salesapi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productInfo)
        });

        if (!response.ok) {
            const err = await response.json();
            throw err;
        }
        const responseData = await response.json();
        console.log('データ保存成功', responseData);
        return responseData;  // 保存が成功した場合はレスポンスを返す
    } catch (err) {
        console.error('DynamoDB保存でエラーが出ました', err);
        return err;  // エラーが発生した場合はエラー情報を返す
    }
}

