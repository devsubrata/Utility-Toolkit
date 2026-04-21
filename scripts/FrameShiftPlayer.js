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
                <button id="uploadSubtitleBtn">📜</button>
                <input type="file" id="subtitleInput" accept=".srt,.vtt,.json" hidden>
                <button id="addBookmarkBtn" title="Add bookmark">🔖</button>
                <div class="more-tools">
                    <button id="moreOptionBtn" title="More options"><i class="fa-solid fa-bars"></i></button>
                    <div class="more-menu-div">
                        <button id="placeFpLeftBtn" title="Place left">⬅️</button>
                        <button id="placeFpRightBtn" title="Place Right">➡️</button>
                        <button id="displayBookmarkWindomBtn" title="Show Bookmarks window">📑</button>
                        <button id="toggleSubtitle" title="Toggle Subtitle">🇨🇨</button>
                        <button id="toggleTranscript" title="Toggle Transcript">📝</button>
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
            <div id="playerHUD"></div>
            <!-- Subtitle overlay -->
            <div id="subtitleOverlay" class="subtitle"></div>
        </div>

        <div class="controls">
            <button id="fastBackward">⏪</button>
            <button id="playBtn">▶</button>
            <button id="fastForward">⏩</button>
            <span id="elapsedTime">00:00</span>
            <input type="range" id="progress" min="0" max="100" value="0" style="cursor: pointer;">
            <div id="hoverTime"></div>
            <span id="timeDisplay">00:00 / 00:00</span>
            <input type="file" id="videoFileInput" accept=".mp4,.mkv,.mp3" style="display: none;" />
            <button id="captureBtn">📸</button>
        </div>

        <!-- Transcript Window -->
        <div id="transcriptWindow" class="transcript">   
            <div class="title-bar">
                <span class="title">🎞️ Transcript Viewer</span>
                <div class="transcript-font">
                    <button id="increase-transcript-font" title="increase text size">➕</button>
                    <button id="decrease-transcript-font" title="decrease text size">➖</button>
                </div>
            </div>
            <div class="transcript-content">
            </div>
        </div>
    `;

    document.body.appendChild(framePlayer);

    /* Enable drag + resize (Already provided by user) */
    makeDraggable(framePlayer);
    makeResizable(framePlayer);

    framePlayer.querySelector("#placeFpLeftBtn").onclick = () => resizeLeftHalf(framePlayer);
    framePlayer.querySelector("#placeFpRightBtn").onclick = () => resizeRightHalf(framePlayer);

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
        if (!file || !(file.type.startsWith("video/") || file.type.startsWith("audio/"))) return;
        currentFileBaseName = file.name.replace(/\.[^/.]+$/, "");
        video.src = URL.createObjectURL(file);
    };

    /* Drag & Drop Video */
    dropArea.addEventListener("dragover", (e) => e.preventDefault());

    dropArea.addEventListener("drop", (e) => {
        e.preventDefault();

        const file = e.dataTransfer.files[0];
        if (!file) return;
        /* =========================
                VIDEO / AUDIO FILE
        ========================= */
        if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
            currentFileBaseName = file.name.replace(/\.[^/.]+$/, "");
            video.src = URL.createObjectURL(file);
            return;
        }
        /* =========================
                srt / vtt / json FILE
        ========================= */
        if (file.name.endsWith(".srt") || file.name.endsWith(".vtt") || file.name.endsWith(".json")) {
            getTranscript(file);
            return;
        }
        /* =========================
            CSV BOOKMARK FILE
        ========================= */
        if (file.name.toLowerCase().endsWith(".csv")) {
            importCSV(file);
            return;
        }
    });

    function togglePlay() {
        if (!video.duration) return;
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
        if (!video.duration) return;
        video.currentTime = Math.min(video.currentTime + 5, video.duration);
        showHUD("⏩ +5s");
    };

    backwardBtn.onclick = () => {
        if (!video.duration) return;
        video.currentTime = Math.max(video.currentTime - 5, 0);
        showHUD("⏪ -5s");
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
        showHUD("📸");
    };

    /* Keyboard Shortcuts */
    framePlayer.tabIndex = 0;
    framePlayer.focus();

    framePlayer.addEventListener("keydown", (e) => {
        if (document.activeElement !== framePlayer) return;

        switch (e.key) {
            case "ArrowRight":
                video.currentTime = Math.min(video.currentTime + 5, video.duration);
                showHUD("⏩ +5s");
                break;

            case "ArrowLeft":
                video.currentTime = Math.max(video.currentTime - 5, 0);
                showHUD("⏪ -5s");
                break;

            case "ArrowUp":
                video.volume = Math.min(video.volume + 0.05, 1);
                showHUD(`🔊${(video.volume * 100).toFixed(0)}%`);
                break;

            case "ArrowDown":
                video.volume = Math.max(video.volume - 0.05, 0);
                showHUD(`🔊${(video.volume * 100).toFixed(0)}%`);
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

    closeBtn.onclick = () => {
        ["frameShiftPlayer", "bookmarkWindow"].forEach((id) => {
            document.getElementById(id)?.remove();
        });
    };

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

    //TODO:----------------------Bookmark Time stamp-------------------------
    let bookmarks = [];
    // [
    //     { id: 1, time: 15.32, name: "bookmark1" },
    //     { id: 2, time: 45.11, name: "Important scene" },
    //     { id: 3, time: 120.52, name: "bookmark3" },
    // ];
    let selectedBookmarks = new Set();
    let lastSelectedIndex = null;

    const displayBookmarkWindomBtn = document.getElementById("displayBookmarkWindomBtn");
    const addBookmarkBtn = document.getElementById("addBookmarkBtn");

    addBookmarkBtn.onclick = addBookmark;
    displayBookmarkWindomBtn.onclick = createBookmarkDisplay;

    document.addEventListener("keydown", (e) => {
        /* =========================
        Prevent multiline bookmark name
        ========================= */
        if (e.target.closest("#bookmarkTable") && e.key === "Enter") {
            e.preventDefault();
            e.target.blur();
            framePlayer.focus();
            return;
        }
        /* =========================
            Player shortcuts
        ========================= */
        if (document.activeElement !== framePlayer) return;
        if (e.key.toLowerCase() === "b") {
            addBookmark();
        }
    });

    function addBookmark() {
        if (!video.duration) return;

        const time = video.currentTime;

        const bookmark = {
            id: bookmarks.length + 1,
            time: time,
            name: `bookmark${bookmarks.length + 1}`,
        };
        bookmarks.push(bookmark);
        showHUD("🔖");
        createBookmarkDisplay();
        renderBookmarkTable();
        requestAnimationFrame(() => {
            const table = document.querySelector(".bookmark-content");
            table.scrollTo({ top: table.scrollHeight, behavior: "smooth" });
        });
    }

    function createBookmarkDisplay() {
        if (document.getElementById("bookmarkWindow")) return;

        const bookmarkWindow = document.createElement("div");
        bookmarkWindow.id = "bookmarkWindow";
        bookmarkWindow.innerHTML = `
            <div class="title-bar">
                <span class="title">📑 Bookmarks</span>
                <div>
                    <button id="closeBookmarkWindow">❌</button>
                </div>
            </div>
            <div class="bookmark-content">
                <table id="bookmarkTable">
                    <thead>
                        <tr>
                            <th>SL</th>
                            <th>Timestamp</th>
                            <th>Name</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
            <div class="bookmark-controls">
                <div>
                    <button id="exportBookmarks" title="Export bookmarks">EXP</button>
                    <button id="importBookmarks" title="Import bookmarks">IMP</button>
                </div>
                <div>
                    <button id="moveUpBookmark" title="Move up selected bookmarks">🔼</button>
                    <button id="moveDownBookmark" title="Move down selected bookmarks">🔽</button>
                </div>
            </div>
        `;
        document.body.appendChild(bookmarkWindow);

        makeDraggable(bookmarkWindow);
        makeResizable(bookmarkWindow);

        document.getElementById("exportBookmarks").onclick = exportCSV;
        document.getElementById("importBookmarks").onclick = () => importCSV(null);
        document.getElementById("closeBookmarkWindow").onclick = () => bookmarkWindow.remove();

        renderBookmarkTable();

        document.getElementById("moveUpBookmark").onclick = () => {
            const sorted = [...selectedBookmarks].sort((a, b) => a - b);
            sorted.forEach((i) => {
                if (i === 0) return;
                [bookmarks[i - 1], bookmarks[i]] = [bookmarks[i], bookmarks[i - 1]];
                selectedBookmarks.delete(i);
                selectedBookmarks.add(i - 1);
            });
            renderBookmarkTable();
        };

        document.getElementById("moveDownBookmark").onclick = () => {
            const sorted = [...selectedBookmarks].sort((a, b) => b - a);
            sorted.forEach((i) => {
                if (i >= bookmarks.length - 1) return;
                [bookmarks[i], bookmarks[i + 1]] = [bookmarks[i + 1], bookmarks[i]];
                selectedBookmarks.delete(i);
                selectedBookmarks.add(i + 1);
            });
            renderBookmarkTable();
        };
    }

    function renderBookmarkTable() {
        const tbody = document.querySelector("#bookmarkTable tbody");
        tbody.innerHTML = "";

        bookmarks.forEach((b, i) => {
            const tr = document.createElement("tr");
            tr.dataset.index = i;

            if (selectedBookmarks.has(i)) tr.classList.add("selected");

            tr.innerHTML = `
                <td>${i + 1}</td>
                <td>
                    <span class="timestamp" data-time="${b.time}">
                        ${format(b.time)}
                    </span>
                </td>
                <td contenteditable="true">${b.name}</td>
                <td class="deleteBookmark" data-index="${i}">⛔</td>
            `;
            tbody.appendChild(tr);
        });

        // Row Selection Logic (Ctrl / Shift)
        tbody.onclick = (e) => {
            /* Ignore clicks inside editable name cell */
            if (e.target.hasAttribute("contenteditable")) return;

            const row = e.target.closest("tr");
            if (!row) return;

            const index = Number(row.dataset.index);

            /* SHIFT selection (range) */
            if (e.shiftKey && lastSelectedIndex !== null) {
                const start = Math.min(index, lastSelectedIndex);
                const end = Math.max(index, lastSelectedIndex);
                for (let i = start; i <= end; i++) selectedBookmarks.add(i);
                /* CTRL toggle */
            } else if (e.ctrlKey) {
                if (selectedBookmarks.has(index)) selectedBookmarks.delete(index);
                else selectedBookmarks.add(index);
                lastSelectedIndex = index;
                /* NORMAL CLICK (toggle) */
            } else {
                if (selectedBookmarks.size === 1 && selectedBookmarks.has(index)) {
                    selectedBookmarks.clear(); // unselect
                    lastSelectedIndex = null;
                } else {
                    selectedBookmarks.clear();
                    selectedBookmarks.add(index);
                    lastSelectedIndex = index;
                }
            }
            renderBookmarkTable();
        };
    }

    document.addEventListener("click", (e) => {
        if (!e.target.classList.contains("deleteBookmark")) return;
        const index = Number(e.target.dataset.index);
        bookmarks.splice(index, 1);
        renderBookmarkTable();
    });

    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("timestamp")) {
            const time = parseFloat(e.target.dataset.time);
            video.currentTime = time;
            video.play();
            framePlayer.focus();
        }
    });

    document.addEventListener("input", (e) => {
        const cell = e.target;
        if (!cell.closest("#bookmarkTable")) return;
        if (!cell.hasAttribute("contenteditable")) return;

        const row = cell.parentElement;
        const index = row.rowIndex - 1;
        bookmarks[index].name = cell.textContent.trim();
    });

    async function exportCSV() {
        if (bookmarks.length === 0) return alert("No bookmarks to export!");

        // Generate CSV content
        let csv = "sl,timestamp,bookmark_name\n";
        bookmarks.forEach((b, i) => {
            csv += `${i + 1},${b.time},${b.name}\n`;
        });

        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: `${currentFileBaseName}__bookmarks`,
                types: [
                    {
                        description: "CSV File",
                        accept: { "text/csv": [".csv"] },
                    },
                ],
            });

            const writable = await handle.createWritable();
            await writable.write(csv);
            await writable.close();
            alert("✅ Bookmarks exported successfully!");
        } catch (err) {
            if (err.name !== "AbortError") console.error(err);
            // User canceled, do nothing
        }
    }

    async function importCSV(dropFile) {
        try {
            let file;
            if (!dropFile) {
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [
                        {
                            description: "CSV file",
                            accept: { "text/csv": [".csv", ".CSV"] },
                        },
                    ],
                    multiple: false,
                });
                file = await fileHandle.getFile();
            } else {
                file = dropFile;
            }

            const reader = new FileReader();

            reader.onload = function () {
                const lines = reader.result.split("\n").slice(1);

                bookmarks = [];

                lines.forEach((line) => {
                    if (!line.trim()) return;

                    const [sl, time, name] = line.split(",");

                    bookmarks.push({
                        id: Number(sl),
                        time: Number(time),
                        name: name,
                    });
                });
                if (dropFile) createBookmarkDisplay();
                else renderBookmarkTable();
            };

            reader.readAsText(file);
        } catch (err) {
            console.log("Import cancelled or failed:", err);
        }
    }

    // TODO:----------notification timer---------------
    let hudTimer = null;
    function showHUD(text, duration = 800) {
        const hud = document.getElementById("playerHUD");
        if (!hud) return;

        hud.textContent = text;
        hud.classList.add("show");

        clearTimeout(hudTimer);

        hudTimer = setTimeout(() => {
            hud.classList.remove("show");
        }, duration);
    }

    // TODO:----------subtitle/transcript feature---------------
    const subtitleInput = document.getElementById("subtitleInput");

    document.getElementById("uploadSubtitleBtn").onclick = () => {
        subtitleInput.click();
    };

    subtitleInput.addEventListener("change", handleSubtitleFile);

    let transcript = null;
    async function handleSubtitleFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        getTranscript(file);
    }

    async function getTranscript(file) {
        const text = await file.text();
        if (file.name.endsWith(".srt")) {
            transcript = parseSRT(text);
            console.log(transcript);
        } else if (file.name.endsWith(".vtt")) {
            transcript = parseVTT(text);
        } else if (file.name.endsWith(".json")) {
            transcript = JSON.parse(text);
        }
        renderTranscript();
    }

    function parseSRT(srt) {
        const lines = srt
            .replace(/\r/g, "")
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l !== "");

        const filtered = lines.filter((line) => !/^\d+$/.test(line));

        const result = [];

        for (let i = 0; i < filtered.length; i += 2) {
            const timeLine = filtered[i];
            const textLine = filtered[i + 1];

            if (!timeLine || !textLine) continue;

            const [start, end] = timeLine.split("-->").map((s) => s.trim());

            result.push({
                start: toSec(start),
                end: toSec(end),
                text: textLine,
            });
        }

        return result;
    }

    function toSec(t) {
        const [hms, ms] = t.split(",");
        const [h, m, s] = hms.split(":").map(Number);
        return h * 3600 + m * 60 + s + ms / 1000;
    }

    const transcriptWindow = document.getElementById("transcriptWindow");
    const transcriptContent = transcriptWindow.querySelector(".transcript-content");

    function renderTranscript() {
        transcriptContent.innerHTML = "";
        transcript.forEach((item, i) => {
            const span = document.createElement("span");
            span.textContent = item.text + " ";
            span.dataset.index = i;

            span.onclick = () => {
                video.currentTime = item.start;
                video.play();
            };
            transcriptContent.appendChild(span);
        });
    }

    const overlay = document.getElementById("subtitleOverlay");

    let currentIndex = -1;
    video.addEventListener("timeupdate", () => {
        if (!transcript) return;

        const t = video.currentTime;

        const index = transcript.findIndex((item) => t >= item.start && t < item.end);

        if (index !== currentIndex) {
            currentIndex = index;
            overlay.textContent = index !== -1 ? transcript[index].text : "";
            // Highlight transcript
            document.querySelectorAll("#transcriptWindow span").forEach((span) => span.classList.remove("active"));
            const el = document.querySelector(`.transcript-content span[data-index="${index}"]`);
            if (el) {
                el.classList.add("active");
                el.scrollIntoView({ block: "center", behavior: "smooth" });
            }
        }
    });

    // subtitle on/off
    document.getElementById("toggleSubtitle").onclick = () => {
        overlay.style.display = overlay.style.display === "none" ? "block" : "none";
        document.getElementById("toggleSubtitle").style.background = "blue";
    };

    // transcript on/off
    document.getElementById("toggleTranscript").onclick = () => {
        transcriptWindow.style.display = transcriptWindow.style.display === "none" ? "block" : "none";
    };

    document.getElementById("increase-transcript-font").onclick = () => {
        const currentSize = getFontSize(transcriptContent);
        transcriptContent.style.fontSize = currentSize + 2 + "px";
    };
    document.getElementById("decrease-transcript-font").onclick = () => {
        const currentSize = getFontSize(transcriptContent);
        transcriptContent.style.fontSize = currentSize - 2 + "px";
    };

    makeDraggable(transcriptWindow);
    makeResizable(transcriptWindow);
}
