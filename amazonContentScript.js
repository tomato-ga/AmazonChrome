// /Users/ore/Desktop/AmazonChromeEx/amazonContentScript.js

console.log("amazonContentScript.js is ロード");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message:", message);
    if (message.action === 'processDpData') {
        let productInfo = message.data;
        console.log("Received Deal URL:", message.dealUrl);
        console.log("Received DP URL:", productInfo);

        if (window.location.href.includes('/dp')) {
            
            // 商品名を取得
            const h1Text = document.evaluate("//h1[@id='title']/span[@id='productTitle']", document, null, XPathResult.STRING_TYPE, null).stringValue.trim();
            if (h1Text) {
                productInfo.productName = h1Text;
                console.log(`商品名:`, productInfo.productName);
            } else {
                console.warn("No h1 tag found on the /dp page.");
            }
        
            // 画像URLを取得する
            const imgElements = document.evaluate(`//div[@class="imgTagWrapper"]/img`, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
            for (let i = 0; i < imgElements.snapshotLength; i++) {
                const imgNode = imgElements.snapshotItem(i);
                const src = imgNode.getAttribute('src');
                if (src && src.includes('media-amazon')) {
                    productInfo.imageUrl = src;
                    console.log(`画像URLが見つかりました:`, productInfo.imageUrl);
                }
            }
        
            // ASINをURLから抽出
            function extractASIN(url) {
                const regexForASIN = /\/dp\/([A-Z0-9]{10})/;
                const matches = url.match(regexForASIN);
                if (matches && matches.length > 1) {
                    return matches[1];
                }
                return "";
            }
            const asin = extractASIN(window.location.href);
            productInfo.asin = asin;
            console.log("商品ページのASINを抽出完了:", productInfo.asin);
        
            // AffURLを作る
            let currentUrl = window.location.href;
            let affUrl = currentUrl + "&tag=entamenews-22";
            productInfo.affUrl = affUrl;
            console.log(`アフィURLを作成:`, productInfo.affUrl)
        
            // 割引きを抽出
            const extractPriceoff = () => {
                const rePrice = /-\d+%/;
                const priceOffElements = document.querySelectorAll('div.a-section span');
                for (let priceOffElement of priceOffElements) {
                    let priceOffText = priceOffElement.textContent;
                    if (rePrice.test(priceOffText)) {
                        return priceOffText;
                    }
                }
                return "割引きなし";
            }
            const priceOfftext = extractPriceoff();
            productInfo.priceOff = priceOfftext;
            console.log("商品ページの割引きを抽出:", productInfo.priceOff);
        
            // 値段を抽出
            const extractPrice = () => {
                const rePrice = /￥([\d,]+)/;
                const priceElements = document.querySelectorAll('span.a-offscreen');
                for (let priceElement of priceElements) {
                    let priceText = priceElement.textContent;
                    if (rePrice.test(priceText)) {
                        return priceText;
                    }
                }
                return "値段なし";
            }
            const priceText = extractPrice();
            productInfo.price = priceText;
            console.log("商品ページの値段を抽出中:", productInfo.price);
        
        
            // 商品説明を抽出
            const extractProductDescription = () => {
                const descripElement = document.querySelector('div#productDescription');
                if (descripElement) {
                    let descripText = descripElement.textContent.trim();
                    if (descripText.length > 0) {
                        return descripText;
                    }
                }
                return "";
            }
            const descriptionText1 = extractProductDescription();
        
            const extractFeatureBullets = () => {
                const descripElement = document.querySelector(`div#feature-bullets`);
                if (descripElement) {
                    let descripText = descripElement.textContent.trim();
                    if (descripText.length > 0) {
                        return descripText;
                    }
                }
                return "";
            }
            const descriptionText2 = extractFeatureBullets();
        
            // 優先度に基づいて商品説明を格納
            productInfo.descripText = descriptionText1 ? descriptionText1 : (descriptionText2 ? descriptionText2 : "商品説明なし");
            console.log("商品ページの商品説明:", productInfo.descripText);
        
            // TODO タブを閉じる
            // chrome.runtime.sendMessage({ action: 'closeCurrentTab' });
        
            // TODO descriptionText1の文字数が少なすぎる場合は、descriptionText2にする
        
        }
    }
})
