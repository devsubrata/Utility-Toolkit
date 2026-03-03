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

chrome.runtime.onMessage.addListener(async (msg) => {
    if (msg.action === "saveFrame") {
        chrome.downloads.download({
            url: msg.url,
            filename: msg.filename,
            conflictAction: "uniquify",
            saveAs: false,
        });
    }
});
