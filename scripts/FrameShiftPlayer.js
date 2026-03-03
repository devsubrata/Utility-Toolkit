if (!document.getElementById("frameShiftPlayer")) {
    let windowState = {
        width: "640px",
        height: "420px",
        left: "120px",
        top: "80px",
    };

    let isFullscreen = false;
    let isMinimized = false;
    let currentFileBaseName = "";

    /* Load CSS */
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("styles/FrameShiftPlayer.css");
    document.head.appendChild(link);

    const link2 = document.createElement("link");
    link2.rel = "stylesheet";
    link2.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css";
    document.head.appendChild(link2);

    /* Create Player Window */
    const framePlayer = document.createElement("div");
    framePlayer.id = "frameShiftPlayer";

    framePlayer.innerHTML = `
        <div class="title-bar">
            <span class="title">🎞️ FrameShift Player</span>
            <div class="options-menu">
                <button id="loadVideoBtn" title="Open video">📂</button>
                <div class="more-tools">
                    <button id="moreOptionBtn" title="More options"><i class="fa-solid fa-bars"></i></button>
                    <div class="more-menu-div">
                        <button id="A" title="Button A">A</button>
                        <button id="B" title="Button B">B</button>
                        <button id="C" title="Button C">C</button>
                        <button id="D" title="Button D">D</button>
                        <button id="E" title="Button E">E</button>
                        <button id="F" title="Button F">F</button>
                    </div>
                </div>
            </div>
            <div>
                <span class="maxminFramePlayer" title="minimize">—</span>
                <span class="maxFramePlayer" title="Maximuze and Restore Screen">⿻</span>
                <span class="fullscreenFramePlayer" title="full screen">⛶</span>
                <span class="closeFramePlayer" title="Close">❌</span>
            </div>
        </div>

        <div class="player-content" id="dropArea">
            <div class="dropZone">Drag & Drop Video Here</div>
            <video id="fsVideo"></video>
        </div>

        <div class="controls">
            <button id="fastBackward">⏪</button>
            <button id="playBtn">▶</button>
            <button id="fastForward">⏩</button>
            <span id="elapsedTime">00:00</span>
            <input type="range" id="progress" min="0" max="100" value="0" style="cursor: pointer;">
            <div id="hoverTime"></div>
            <span id="timeDisplay">00:00 / 00:00</span>
            <input type="file" id="videoFileInput" accept=".mp4,.mkv" style="display: none;" />
            <button id="captureBtn">📸</button>
        </div>
    `;

    document.body.appendChild(framePlayer);

    /* Enable drag + resize (Already provided by user) */
    makeDraggable(framePlayer);
    makeResizable(framePlayer);

    /* -----------------------------
    Player Logic
    ----------------------------- */

    const video = framePlayer.querySelector("#fsVideo");
    const dropArea = framePlayer.querySelector("#dropArea");

    const playBtn = framePlayer.querySelector("#playBtn");
    const forwardBtn = framePlayer.querySelector("#fastForward");
    const backwardBtn = framePlayer.querySelector("#fastBackward");
    const captureBtn = framePlayer.querySelector("#captureBtn");

    const progress = framePlayer.querySelector("#progress");
    const hoverTime = document.getElementById("hoverTime");
    const elapsedTime = framePlayer.querySelector("#elapsedTime");
    const timeDisplay = framePlayer.querySelector("#timeDisplay");

    document.getElementById("loadVideoBtn").onclick = () => {
        document.getElementById("videoFileInput").click();
    };

    document.getElementById("videoFileInput").onchange = (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith("video/")) return;
        currentFileBaseName = file.name.replace(/\.[^/.]+$/, "");
        video.src = URL.createObjectURL(file);
    };

    /* Drag & Drop Video */
    dropArea.addEventListener("dragover", (e) => e.preventDefault());

    dropArea.addEventListener("drop", (e) => {
        e.preventDefault();

        const file = e.dataTransfer.files[0];
        if (!file || !file.type.startsWith("video/")) return;

        currentFileBaseName = file.name.replace(/\.[^/.]+$/, "");

        video.src = URL.createObjectURL(file);
    });

    function togglePlay() {
        if (video.paused) {
            video.play();
            playBtn.textContent = "⏸";
        } else {
            video.pause();
            playBtn.textContent = "▶";
        }
    }
    /* Play Pause */
    playBtn.onclick = togglePlay;

    /* Skip Controls */
    forwardBtn.onclick = () => {
        video.currentTime = Math.min(video.currentTime + 5, video.duration);
    };

    backwardBtn.onclick = () => {
        video.currentTime = Math.max(video.currentTime - 5, 0);
    };

    const format = (seconds) => {
        if (!seconds || isNaN(seconds)) return "00:00";

        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        const hh = h > 0 ? h.toString().padStart(2, "0") + ":" : "";
        const mm = m.toString().padStart(2, "0") + ":";
        const ss = s.toString().padStart(2, "0");

        return hh + mm + ss;
    };

    /* Progress */
    video.addEventListener("timeupdate", () => {
        progress.value = (video.currentTime / video.duration) * 100 || 0;
        elapsedTime.textContent = `${format(video.currentTime)}`;
        timeDisplay.textContent = `${format(video.duration - video.currentTime)} / ${format(video.duration || 0)}`;
    });

    progress.addEventListener("input", () => {
        video.currentTime = (progress.value / 100) * video.duration;
    });

    progress.addEventListener("mousemove", (e) => {
        if (!video.duration) return;

        const rect = progress.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;

        const hoverSeconds = percent * video.duration;

        hoverTime.textContent = format(hoverSeconds);

        hoverTime.style.left = e.clientX - rect.left + 150 + "px";
        hoverTime.style.display = "block";
    });

    progress.addEventListener("mouseleave", () => {
        hoverTime.style.display = "none";
    });

    /* Volume Control (Mouse Wheel) */
    framePlayer.addEventListener("wheel", (e) => {
        video.volume = Math.min(1, Math.max(0, video.volume - e.deltaY * 0.001));
    });

    /* Capture Frame */
    captureBtn.onclick = async () => {
        if (video.readyState < 2) return;

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        /* Convert canvas → blob (IMPORTANT ⭐) */
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

        const now = new Date();
        const pad = (n) => n.toString().padStart(2, "0");

        const filename =
            now.getFullYear().toString() +
            pad(now.getMonth() + 1) +
            pad(now.getDate()) +
            "-" +
            pad(now.getHours()) +
            pad(now.getMinutes()) +
            pad(now.getSeconds()) +
            ".png";

        chrome.runtime.sendMessage({
            action: "saveFrame",
            filename: `${currentFileBaseName}/${filename}`,
            url: URL.createObjectURL(blob),
        });
    };

    /* Keyboard Shortcuts */
    framePlayer.tabIndex = 0;
    framePlayer.focus();

    framePlayer.addEventListener("keydown", (e) => {
        if (document.activeElement !== framePlayer) return;

        switch (e.key) {
            case "ArrowRight":
                video.currentTime = Math.min(video.currentTime + 5, video.duration);
                break;

            case "ArrowLeft":
                video.currentTime = Math.max(video.currentTime - 5, 0);
                break;

            case "ArrowUp":
                video.volume = Math.min(video.volume + 0.05, 1);
                break;

            case "ArrowDown":
                video.volume = Math.max(video.volume - 0.05, 0);
                break;

            case " ":
                e.preventDefault();
                playBtn.click();
                break;

            case "c":
            case "C":
                captureBtn.click();
                break;
        }
    });

    const closeBtn = framePlayer.querySelector(".closeFramePlayer");
    const fullscreenBtn = framePlayer.querySelector(".fullscreenFramePlayer");
    const minmaxBtn = framePlayer.querySelector(".maxminFramePlayer");

    closeBtn.onclick = () => framePlayer.remove();

    const resizeObserver = new ResizeObserver(() => {
        if (!isFullscreen && !isMinimized) {
            windowState.width = framePlayer.style.width;
            windowState.height = framePlayer.style.height;
            windowState.left = framePlayer.style.left;
            windowState.top = framePlayer.style.top;
        }
    });

    resizeObserver.observe(framePlayer);

    fullscreenBtn.onclick = fullScreenControl;

    document.querySelector(".maxFramePlayer").onclick = () => {
        if (!isFullscreen) {
            // store current size before fullscreen
            isFullscreen = true;

            framePlayer.style.left = "0px";
            framePlayer.style.top = "0px";
            framePlayer.style.width = "100vw";
            framePlayer.style.height = "100vh";
        } else {
            framePlayer.style.width = windowState.width;
            framePlayer.style.height = windowState.height;
            framePlayer.style.left = windowState.left;
            framePlayer.style.top = windowState.top;

            isFullscreen = false;
        }
    };

    minmaxBtn.onclick = () => {
        const content = framePlayer.querySelector(".player-content");
        const controls = framePlayer.querySelector(".controls");

        if (!isMinimized) {
            content.style.display = "none";
            controls.style.display = "none";

            // shrink window to title bar only
            framePlayer.style.height = "40px";

            isMinimized = true;
        } else {
            content.style.display = "block";
            controls.style.display = "flex";

            // restore last height from windowState
            framePlayer.style.height = windowState.height;

            isMinimized = false;
        }
    };

    function fullScreenControl() {
        if (video.requestFullscreen) {
            video.requestFullscreen();
        } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
        } else if (video.msRequestFullscreen) {
            video.msRequestFullscreen();
        }
    }

    video.addEventListener("dblclick", fullScreenControl);
    video.addEventListener("click", togglePlay);
}
