if (!document.getElementById("timerWindow")) {
    const alarmAudio = new Audio(chrome.runtime.getURL("audio/timer_alarm.mp3"));

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("styles/timer.css");
    document.head.appendChild(link);

    const timerDiv = document.createElement("div");
    timerDiv.id = "timerWindow";
    timerDiv.classList.add("floating-window");
    timerDiv.innerHTML = `
        <div class="title-bar">
            <span class="title">⏳ Timer</span>
            <span class="minimize-btn ctrl" title="minimize">—</span>
            <span class="close-btn ctrl" title="Close">❌</span>
        </div>
        <div class="content">
            <input type="number" id="minutesInput" placeholder="Minutes" />
            <div>
                <button id="startTimerBtn">Start</button>
                <button id="pauseTimerBtn">Pause</button>
            </div>
            <div id="timerDisplay">00:00</div>
        </div>
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
                alarmAudio.play();
                return;
            }
            totalSeconds--;
            let min = Math.floor(totalSeconds / 60);
            let sec = totalSeconds % 60;
            display.textContent = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
        }, 1000);
    });

    minimizeWindow(timerDiv.querySelector(".minimize-btn"), timerDiv);
    closeWindow(timerDiv.querySelector(".close-btn"), timerDiv, countdown);
}
