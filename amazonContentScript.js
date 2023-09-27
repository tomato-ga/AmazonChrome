if (window.location.href.includes('/dp')) {
    const h1Text = document.evaluate("//h1[@id='title']/span[@id='productTitle']", document, null, XPathResult.STRING_TYPE, null).stringValue.trim();
    if (h1Text) {
        console.log(`H1 text: ${h1Text}`);
        chrome.runtime.sendMessage({ action: 'h1Text', text: h1Text });
    } else {
        console.warn("No h1 tag found on the /dp page.");
    }
}
