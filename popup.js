const injectScript = (file) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["scripts/utilityFunctions.js", `scripts/${file}`],
        });
    });
};

document.getElementById("clockBtn").addEventListener("click", () => injectScript("clock.js"));
document.getElementById("timerBtn").addEventListener("click", () => injectScript("timer.js"));
document
    .getElementById("stopwatchBtn")
    .addEventListener("click", () => injectScript("stopwatch.js"));
