if (!document.getElementById("clockWindow")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("styles/clock.css");
    document.head.appendChild(link);

    const clockDiv = document.createElement("div");
    clockDiv.id = "clockWindow";
    clockDiv.classList.add("floating-window");
    clockDiv.innerHTML = `
        <div class="title-bar">
            <span class="title">🕒 Clock</span>
            <span class="minimize-btn ctrl" title="minimize">—</span>
            <span class="close-btn ctrl" title="Close">❌</span>
        </div>
        <div class="content">
            <div id="clockDisplay">--:--:--</div>
            <div id="clockDate">Loading date...</div>
        </div>
    `;
    document.body.appendChild(clockDiv);
    makeDraggable(clockDiv);

    let clockInterval;

    function updateClock() {
        const now = new Date();
        const time = now.toLocaleTimeString();
        document.getElementById("clockDisplay").textContent = time;

        const day = now.toLocaleDateString("en-US", { weekday: "long" });
        const date = now.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
        document.getElementById("clockDate").textContent = `${day}, ${date}`;
    }
    updateClock();

    clockInterval = setInterval(updateClock, 1000);

    minimizeWindow(clockDiv.querySelector(".minimize-btn"), clockDiv);
    closeWindow(clockDiv.querySelector(".close-btn"), clockDiv, clockInterval);
}
