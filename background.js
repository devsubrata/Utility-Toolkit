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
        return true;
    }
});

chrome.commands.onCommand.addListener(async (command) => {
    const [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
    });

    if (!tab?.id) return;

    switch (command) {
        case "look-up-bar":
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["scripts/utilityFunctions.js", "scripts/search.js"],
            });
            break;
        case "annotation-bar":
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["scripts/utilityFunctions.js", "scripts/annotate.js"],
            });
            break;
        case "frame-shift-player":
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["scripts/utilityFunctions.js", "scripts/FrameShiftPlayer.js"],
            });
            break;
    }
});

// async function injectModule(tabId, file) {
//     try {
//         await chrome.scripting.executeScript({
//             target: { tabId },
//             files: [file],
//         });
//     } catch (error) {
//         console.error(`Failed to inject ${file}:`, error);
//     }
// }

// chrome.commands.onCommand.addListener(async (command) => {
//     const [tab] = await chrome.tabs.query({
//         active: true,
//         lastFocusedWindow: true,
//     });

//     if (!tab?.id) return;

//     const modules = {
//         "open-clock": "scripts/clock.js",
//         "open-timer": "scripts/timer.js",
//         "open-search": "scripts/search.js",
//     };

//     const file = modules[command];

//     if (file) {
//         await injectModule(tab.id, file);
//     }
// });
