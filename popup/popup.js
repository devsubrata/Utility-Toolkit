const injectScript = (file) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["scripts/utilityFunctions.js", `scripts/${file}`],
        });
    });
};

document.getElementById("openClock").addEventListener("click", () => injectScript("clock.js"));
document.getElementById("openTimer").addEventListener("click", () => injectScript("timer.js"));
document.getElementById("openStopwatch").addEventListener("click", () => injectScript("stopwatch.js"));
document.getElementById("openWeather").addEventListener("click", () => injectScript("weather.js"));
document.getElementById("openSearchToolbar").addEventListener("click", () => injectScript("search.js"));
document.getElementById("openAnnotationToolbar").addEventListener("click", () => injectScript("annotate.js"));
document.getElementById("openPlayer").addEventListener("click", () => injectScript("MusicPlayer.js"));
document.getElementById("openYoutubePlayer").addEventListener("click", () => injectScript("YoutubePlayer.js"));
document.getElementById("openScriptScroller").addEventListener("click", () => injectScript("ScriptScroller.js"));
