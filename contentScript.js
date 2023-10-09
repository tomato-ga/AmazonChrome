// /Users/donbe/Library/Mobile Documents/com~apple~CloudDocs/Codes/AmazonChromeEx/contentScript.js

let pageCounter = 0;
let dpUrlLists = [];
let dealUrlLists = [];
let dealLinksObject = {};
let dpLinkObject = {};

let hasProcessedPage = false;

const TAB_OPEN_INTERVAL = 5000;
const TAB_GROUP_DELAY = 7000;
const TABS_AT_ONCE = 2;
const RETRY_LIMIT = 3;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const openTabAndMonitor = (url, data) => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'dpData', url: url, data: data }, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
};

const chromeRuntoDPorDealUrls = async (dataObject) => {
    if (dataObject.hasDealUrl) {
        await chrome.runtime.sendMessage({ action: 'dealData', data: dataObject });
        return;
    }

    const dpUrls = dataObject.urls;
    if (!dpUrls || !Array.isArray(dpUrls) || dpUrls.length === 0) {
        console.warn("dpUrls is not properly defined or is an empty array.");
        return;
    }

    for (let i = 0; i < dpUrls.length; i += TABS_AT_ONCE) {
        let dpurlsToOpen = dpUrls.slice(i, i + TABS_AT_ONCE);
        for (let dpUrl of dpurlsToOpen) {
            let retries = RETRY_LIMIT;
            while (retries > 0) {
                try {
                    await openTabAndMonitor(dpUrl, dataObject);
                    await sleep(TAB_OPEN_INTERVAL);
                    break;
                } catch (error) {
                    retries--;
                    if (retries === 0) {
                        console.error(`Failed to open and monitor tab for URL ${dpUrl} after ${RETRY_LIMIT} attempts.`);
                    } else {
                        await sleep(1000);  // Wait for a short interval before retrying.
                    }
                }
            }
        }
        await sleep(TAB_GROUP_DELAY);
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
    if (!dealUrlLists.includes(url)) {
        dealUrlLists.push(url);
    }
    dealLinksObject.hasDealUrl = true;
    dealLinksObject.urls = dealUrlLists;
};

const processPage = async () => {
    if (hasProcessedPage) return;

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

    if (pageCounter < 1) {
        let nextLink = document.querySelector('ul.a-pagination > li.a-last > a');
        if (nextLink) {
            pageCounter++;
            nextLink.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await processPage();
        }
    } else {
        hasProcessedPage = true;
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
    if (!currentUrl.includes('/dp') && !currentUrl.includes('/deal') && !hasProcessedPage) {
        await processPage();
        await chromeRuntoDPorDealUrls(dpLinkObject);
        // await chromeRuntoDPorDealUrls(dealLinksObject);
    }
});
