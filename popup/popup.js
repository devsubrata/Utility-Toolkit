const injectScript = (...files) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const injectedScripts = ["scripts/utilityFunctions.js"];
        files.forEach((file) => injectedScripts.push(file));

        const tabId = tabs[0].id;
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: injectedScripts,
        });
    });
};

document.getElementById("openClock").addEventListener("click", () => injectScript("scripts/clock.js"));
document.getElementById("openTimer").addEventListener("click", () => injectScript("scripts/timer.js"));
document.getElementById("openStopwatch").addEventListener("click", () => injectScript("scripts/stopwatch.js"));
document.getElementById("openWeather").addEventListener("click", () => injectScript("scripts/weather.js"));
document.getElementById("openSearchToolbar").addEventListener("click", () => injectScript("scripts/search.js"));
document.getElementById("openAnnotationToolbar").addEventListener("click", () => injectScript("scripts/annotate.js"));
document.getElementById("openPlayer").addEventListener("click", () => injectScript("scripts/MusicPlayer.js"));
document.getElementById("openYoutubePlayer").addEventListener("click", () => injectScript("scripts/YoutubePlayer.js"));
document.getElementById("openScriptScroller").addEventListener("click", () => injectScript("scripts/ScriptScroller.js"));
document.getElementById("openToDoList").addEventListener("click", () => injectScript("scripts/ToDoList.js"));
document.getElementById("openStickyNote").addEventListener("click", () => injectScript("scripts/StickyNote.js", "scripts/libs/marked.min.js"));
