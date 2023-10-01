// /Users/ore/Desktop/AmazonChromeEx/amazonDealContentScript.js

console.log("amazonDealContentScript.js is loaded");


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action=== 'processDealData') {

        if (window.location.href.includes('/deal')) {
            window.scrollBy(0, document.body.scrollHeight);
        
            let aTags = document.evaluate(
                '//div[@id="octopus-dlp-asin-stream"]//li//a[1]',
                document,
                null,
                XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
                null
            );
        
            console.log(aTags.snapshotLength);
        
            let dealLinkMap = {};
            let dpLinks = [];
            for (let i = 0; i < aTags.snapshotLength; i++) {
                let href = aTags.snapshotItem(i).getAttribute('href');
                if (!href.startsWith('http')) {
                    href = 'https://www.amazon.co.jp' + href;
                }
                console.log(href);
                dpLinks.push(href);
            }
            
            dealLinkMap[window.location.href] = dpLinks;
            console.log(dealLinkMap);
        
            // background scriptにこのリンクマップを送る
            chrome.runtime.sendMessage({ action: 'processDealLinkMap', linkMap: dealLinkMap });
        
            // TODO DBに保存する
        }

    }
})




