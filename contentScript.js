let pageCounter = 0;
let dpUrlLists = [];
let dealUrlLists = [];
let dealLinksObject = {};

const extractDpUrlsIfDealUrlsExists = async (dpUrls) => {
    for (let i = 0; i < dpUrls.length; i += 3) {
        let urlsToOpen = dpUrls.slice(i, i + 3);
        for (let dpUrl of urlsToOpen) {
            setTimeout(async () => {
                await chrome.runtime.sendMessage({ action: 'openTab', url: dpUrl });
            }, 5000); // 5秒待機してから実行
        }
        await new Promise(resolve => setTimeout(resolve, 7000)); // 3つのタブが開かれるのを待つための15秒の待ち時間
    }
};


const openDealUrls = async () => {
    let maxUrlsToOpen = 3; // dealページを3枚までに制限した 本番では外す
    for (let i = 0; i < Math.min(dealUrlLists.length, maxUrlsToOpen); i++) {
        chrome.runtime.sendMessage({ action: 'openTab', url: dealUrlLists[i] });
        await new Promise(resolve => setTimeout(resolve, 1000));  // 1秒待つ
    }
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
            dpUrlLists.push(dpurl);
        }

        let dealurl = slashDealUrl(node.href);
        if (dealurl) {
            dealUrlLists.push(dealurl);
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
        console.log("dpのURL: ", dpUrlLists);
    }

    return dpUrlLists;
};

const slashDpUrl = (nodehref) => {
    let url = nodehref;
    if (url.indexOf('/dp') !== -1) {
        return url;
    }
}

const slashDealUrl = (nodehref) => {
    let url = nodehref;
    if (url.indexOf('/deal') !== -1) {
        return url;
    }
}

window.addEventListener('load', async () => {
    const currentUrl = window.location.href;
    if (!currentUrl.includes('/dp') && !currentUrl.includes('/deal')) {
        await processPage();
        // await extractDpUrlsIfDealUrlsExists(dpUrlLists);
        await openDealUrls();
    }
});


