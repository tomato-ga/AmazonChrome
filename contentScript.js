// /Users/donbe/Library/Mobile Documents/com~apple~CloudDocs/Codes/AmazonChromeEx/contentScript.js

let pageCounter = 0;
let dpUrlLists = [];
let dealUrlLists = [];
let dealLinksObject = {};
let dpLinkObject = {};


const extractDpUrlsIfDealUrlsExists = async (dpLinkObject) => {
    const dpUrls = dpLinkObject.urls;  // dpLinkObjectからURLリストを取得

    for (let i = 0; i < dpUrls.length; i += 3) {
        let urlsToOpen = dpUrls.slice(i, i + 3);
        for (let dpUrl of urlsToOpen) {
            setTimeout(async () => {
                await chrome.runtime.sendMessage({ action: 'openTab', url: dpUrl });
            }, 5000); // 5秒待機してから実行
        }
        await new Promise(resolve => setTimeout(resolve, 7000)); // 3つのタブが開かれるのを待つための7秒の待ち時間
    }
};


const sendToBackground = (message) => {
    try {
        chrome.runtime.sendMessage(message);
    } catch (error) {
        console.error("Failed to send message:", error);
    }
};

const handleDpUrl = (url) => {
    dpUrlLists.push(url);
    dpLinkObject = {
        urls: dpUrlLists,
        hasDealUrl: false
    };
};

const handleDealUrl = (url) => {
    dealUrlLists.push(url);
    dealLinksObject[url] = {
        urls: null,  // この部分は後で更新することが考えられます
        hasDealUrl: true
    };
};

const processPage = async () => {

    window.scrollBy(0, document.body.scrollHeight);
    await new Promise(resolve => setTimeout(resolve, 4500));

    let aTags = document.evaluate(
        '//div[contains(@class, "gridDisplayGrid")]//a[contains(@class, "a-link-normal") and contains(@class, "DealLink-module")]',
        document,
        null,
        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
        null
    );

    for (let i = 0; i < aTags.snapshotLength; i++) {
        let node = aTags.snapshotItem(i);
        
        let dpurl = slashDpUrl(node.href);
        if (dpurl) {
            handleDpUrl(dpurl);
        }

        let dealurl = slashDealUrl(node.href);
        if (dealurl) {
            handleDealUrl(dealurl);
        }
    }

    if (pageCounter < 2) {
        let nextLink = document.querySelector('ul.a-pagination > li.a-last > a');
        if (nextLink) {
            pageCounter++;
            nextLink.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await processPage();
        }
    } else {
        sendToBackground({action: "dpData", data: dpLinkObject});
        sendToBackground({action: "dealData", data: dealLinksObject});
    }

    console.log("dpLinkObjectの中身", dpLinkObject);
    console.log("dealLinksObjectの中身", dealLinksObject);
};

const slashDpUrl = (nodehref) => {
    return nodehref.includes('/dp') ? nodehref : null;
};

const slashDealUrl = (nodehref) => {
    return nodehref.includes('/deal') ? nodehref : null;
};

window.addEventListener('load', async () => {
    const currentUrl = window.location.href;
    if (!currentUrl.includes('/dp') && !currentUrl.includes('/deal')) {
        await processPage();
        await extractDpUrlsIfDealUrlsExists(dpLinkObject); // TODO 処理の順番が違う？

    }
});
