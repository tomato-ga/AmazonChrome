chrome.webNavigation.onCompleted.addListener(function(details) {
    chrome.storage.sync.get('enabled', function(data) {
        if (data.enabled) {
        if (details.url === 'https://www.amazon.co.jp/') {
            chrome.tabs.update(details.tabId, {url: 'https://www.amazon.co.jp/gp/goldbox'});
        }
    }
    });
    }, {
    url: [{
        hostEquals: 'www.amazon.co.jp',
        pathEquals: '/'
    }]
});
