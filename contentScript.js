let pageCounter = 0;
let dpUrlLists = [];
let dealUrlLists = [];


// TODO dealページにアクセスしてないwww
// TODO dealページのURLとdpページをkeyとvalueで紐付ける

const extractDpUrlsIfDealUrlsExists = (dealUrlLists) => {
    if (dealUrlLists.length > 0) {
        let aTags = document.evaluate(
            '//div[contains(@class, "gridDisplayGrid")]//a[contains(@class, "a-link-normal") and contains(@class, "DealLink-module")]',
            document,
            null,
            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
            null
        );

        for (let i= 0; i< aTags.snapshotLength; i++)  {
            let node = aTags.snapshotItem(i);
            let dpurl = slashDpUrl(node.href);
            if (dpurl) {
                dpUrlLists.push(dpurl);
            }
        }
    }
};

const processPage = async () => {
    // ページの最後までスクロール
    window.scrollBy(0, document.body.scrollHeight);

    await new Promise(resolve => setTimeout(resolve, 4500));

    let aTags = document.evaluate(
        '//div[contains(@class, "gridDisplayGrid")]//a[contains(@class, "a-link-normal") and contains(@class, "DealLink-module")]',
        document,
        null,
        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
        null
    );
    console.log("------------------------");
    console.log("リンクの数", aTags.snapshotLength);
    console.log("------------------------");


    for (let i = 0; i < aTags.snapshotLength; i++) {
        let node = aTags.snapshotItem(i);

        dpurl = slashDpUrl(node.href);
        if (dpurl) {
            dpUrlLists.push(dpurl);
            // console.log(node.textContent);
            // console.log(dpurl);
        }

        dealurl = slashDealUrl(node.href);
        if (dealurl) {
            dealUrlLists.push(dealurl);
            // console.log(node.textContent);
            // console.log(dealurl);
        }
    }

    if (pageCounter < 4) {
        let nextLink = document.querySelector('ul.a-pagination > li.a-last > a');
        if (nextLink) {
            pageCounter++;
            nextLink.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await processPage();  // 再帰的に呼び出し
        }
    } else {
        // すべてのページの処理が完了した後に関数を呼び出す
        extractDpUrlsIfDealUrlsExists(dealUrlLists);
        console.log("-----------------");
        console.log("dpのURL: ");
        console.log(dpUrlLists);
        console.log("-----------------");
        console.log("最終的なdpのURLだよ");
        console.log("最終的なdpのURL件数はこちら→", dpUrlLists.length);
    }
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

window.addEventListener('load', () => {
    processPage();
});


// MutationObserver設定コード
// let pageCounter = 0;
// let observer;

// const observerCallback = (mutationsList, observerInstance) => {
//     for(let mutation of mutationsList) {
//         if (mutation.type === 'childList') {
//             observerInstance.disconnect();  // Observerを一時的に停止
//             processPage();
//             break;
//         }
//     }
// };

// const setupObserver = () => {
//     let targetNode = document.evaluate(
//         '//div[contains(@class, "gridDisplayGrid")]',
//         document,
//         null,
//         XPathResult.FIRST_ORDERED_NODE_TYPE,
//         null
//     ).singleNodeValue;

//     if (targetNode) {
//         observer = new MutationObserver(observerCallback);
//         observer.observe(targetNode, { childList: true, subtree: true });
//     }
// };

// const doubleScroll = () => {
//     window.scrollBy(0, document.body.scrollHeight);
//     setTimeout(() => {
//         window.scrollBy(0, document.body.scrollHeight);
//     }, 3000);
// };

// const processPage = () => {
//     // setupObserver();  // Observerを設定
//     doubleScroll();

//     setTimeout(function() {
//         let aTags = document.evaluate(
//             '//div[contains(@class, "gridDisplayGrid")]//a[contains(@class, "a-link-normal") and contains(@class, "DealLink-module")]',
//             document,
//             null,
//             XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
//             null
//         );

//         console.log(aTags.snapshotLength);

//         for (let i = 0; i < aTags.snapshotLength; i++) {
//             let node = aTags.snapshotItem(i);

//             dpurl = slashDpUrl(node.href);
//             if (dpurl) {
//                 console.log(node.textContent);
//                 console.log(dpurl);
//             }

//             dealurl = slashDealUrl(node.href);
//             if (dealurl) {
//                 console.log(node.textContent);
//                 console.log(dealurl);
//             }
//         }

//         if (pageCounter < 4) {
//             let nextLink = document.querySelector('li.a-last > a');
//             if (nextLink) {
//                 console.log("ページカウンター", pageCounter);
//                 pageCounter++;
//                 nextLink.click();
//                 setTimeout(() => {
//                     if (observer) {
//                         setupObserver();  // Observerを再設定
//                     }
//                 }, 2000);
//             }
//         } else {
//             if (observer) {
//                 observer.disconnect();
//             }
//         }
//     }, 8500);
// };

// const slashDpUrl = (nodehref) => {
//     let url = nodehref;
//     if (url.indexOf('/dp') !== -1) {
//         return url;
//     }
// }

// const slashDealUrl = (nodehref) => {
//     let url = nodehref;
//     if (url.indexOf('/deal') !== -1) {
//         return url;
//     }
// }

// window.addEventListener('load', () => {
//     processPage();
// });