document.getElementById('clickMe').addEventListener('click', function() {
    chrome.storage.sync.get('enabled', function(data) {
      var newState = !data.enabled; // 現在の状態を反転させる
      chrome.storage.sync.set({enabled: newState}, function() {
        document.getElementById('clickMe').textContent = newState ? 'Disable' : 'Enable';
      });
    });
  });
  
  // 初期状態の設定
  chrome.storage.sync.get('enabled', function(data) {
    document.getElementById('clickMe').textContent = data.enabled ? 'Disable' : 'Enable';
  });
  