let pageCounter = 0;  // グローバル変数としてページカウンタを定義

const processPage = () => {
    // ページの最後までスクロール
    window.scrollBy(0, document.body.scrollHeight);

    // setTimeoutを使用して遅延させる
    setTimeout(function() {
        // Xpathでノードを取得する
        let aTags = document.evaluate(
            '//div[contains(@class, "gridDisplayGrid")]//a[contains(@class, "a-link-normal") and contains(@class, "DealLink-module")]',
            document,
            null,
            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
            null
        );

        console.log(aTags.snapshotLength);

        for (let i = 0; i < aTags.snapshotLength; i++) {
            let node = aTags.snapshotItem(i);

            dpurl = slashDpUrl(node.href);
            if (dpurl) {
                console.log(node.textContent);
                console.log(dpurl);
            }

            dealurl = slashDealUrl(node.href);
            if (dealurl) {
                console.log(node.textContent);
                console.log(dealurl);
            }
        }

        // すべての要素を取得した後、次のページへのリンクをクリック
        if (pageCounter < 4) {  // 5ページ分の処理を実行する前に
            let nextLink = document.querySelector('li.a-last > a');
            if (nextLink) {
                pageCounter++;  // ページカウンタをインクリメント
                nextLink.click();
            }
        }
    }, 6500);  // 6秒待機
};

// MutationObserverのコールバック関数
const observerCallback = (mutationsList, observer) => {
    for(let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            processPage();
            break;
        }
    }
};

// MutationObserverのインスタンスを作成
const observer = new MutationObserver(observerCallback);

// body要素の子要素の変更を監視する設定
observer.observe(document.body, { childList: true, subtree: true });

// 初回のページ読み込み時にもprocessPageを実行
window.addEventListener('load', processPage);


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