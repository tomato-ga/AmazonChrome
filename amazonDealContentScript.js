// /Users/ore/Desktop/AmazonChromeEx/amazonDealContentScript.js

console.log("amazonDealContentScript.js is loaded");


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

    let links = [];
    for (let i = 0; i < aTags.snapshotLength; i++) {
        let href = aTags.snapshotItem(i).getAttribute('href');
        if (!href.startsWith('http')) {
            href = 'https://www.amazon.co.jp' + href;
        }
        console.log(href);
        links.push(href);
    }

    chrome.runtime.sendMessage({ action: 'processLinks', links: links });

    // 他のファイルやバックグラウンドスクリプトとの通信やデータの保存にchrome.runtime.sendMessageを使用します。
    // chrome.runtime.sendMessage({ action: 'dealLinks', links: links });
}

