if (!document.getElementById("timerWindow")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("styles/timer.css");
    document.head.appendChild(link);

    const timerDiv = document.createElement("div");
    timerDiv.id = "timerWindow";
    timerDiv.innerHTML = `
        <div>
            <span class="title">⏳ Timer</span>
            <span class="close-btn" title="Close">❌</span>
        </div>
        <input type="number" id="minutesInput" placeholder="Minutes" />
        <button id="startTimerBtn">Start</button>
        <div id="timerDisplay">00:00</div>
    `;
    document.body.appendChild(timerDiv);
    makeDraggable(timerDiv);

    timerDiv.querySelector(".close-btn").addEventListener("click", () => {
        timerDiv.remove();
    });

    const input = timerDiv.querySelector("#minutesInput");
    const display = timerDiv.querySelector("#timerDisplay");
    const startBtn = timerDiv.querySelector("#startTimerBtn");

    let countdown;

    startBtn.addEventListener("click", () => {
        let minutes = parseInt(input.value);
        if (isNaN(minutes) || minutes <= 0) return;
        let totalSeconds = minutes * 60;

        clearInterval(countdown);
        countdown = setInterval(() => {
            if (totalSeconds <= 0) {
                clearInterval(countdown);
                display.textContent = "⏰ Done!";
                return;
            }
            totalSeconds--;
            let min = Math.floor(totalSeconds / 60);
            let sec = totalSeconds % 60;
            display.textContent = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
        }, 1000);
    });

    timerDiv.querySelector(".close-btn").addEventListener("click", () => {
        timerDiv.remove();
        if (countdown) clearInterval(countdown);
    });
}
