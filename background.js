chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "logMessage") {
        console.log(message.msg);
    }
    if (message.action === "capture") {
        chrome.tabs.captureVisibleTab(null, { format: "png" }, function (dataUrl) {
            sendResponse(dataUrl);
        });
        return true; // Needed for async response
    }
});
