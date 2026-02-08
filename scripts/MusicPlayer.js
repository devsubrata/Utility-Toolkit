if (!document.getElementById("openPlayer")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("styles/MusicPlayer.css");
    document.head.appendChild(link);

    const player = document.createElement("div");
    player.id = "openPlayer";
    player.classList.add("floating-window");
    player.innerHTML = `
        <div class="title-bar">
            <span class="title">▶ MusicPlayer</span>
            <div class="player-ctrls">
                <span class="current-time" style="cursor:pointer;" title="Copy Timestamp">0:00</span>
                <div class='title-play-controls'>
                    <button id="titleRewindBtn">⏪</button>
                    <button id="titlePlayPauseBtn">⏯️</button>
                    <button id="titleForwardBtn">⏩</button>
                    <button id="titlePlayStopBtn">⏹️</button>
                </div>
                <span class="left-time">0:00</span>
            </div>
            <div>
                <span class="minimize-btn ctrl" title="minimize">—</span>
                <span class="close-btn ctrl" title="Close">❌</span>
            </div>
        </div>
        <div class="content drop-area">
            <input type="file" id="fileInput" accept="audio/mpeg" multiple style="display: none" />
            <input type="file" id="imageFileInput" accept="image/*" style="display: none" />
            <div class="load-div">
                <button id="loadBtn">Load Musics</button>
                <button id="loadScript">Load Lyric</button>
            </div>

            <!-- Audio without default controls -->
            <audio id="audioPlayer"></audio>

            <!-- Custom progress bar -->
            <div class="progress-container" style="display:flex; align-items:center; margin:5px 0;">
                <span id="currentTime" style="cursor:pointer;" title="Copy Timestamp">0:00</span>
                <input type="range" id="progressBar" value="0" min="0" max="100" step="0.1" style="flex:1; margin:0 5px;">–&nbsp;
                <span id="leftTime">0:00</span>&nbsp;/&nbsp;<span id="duration">0:00</span>
            </div>

            <!-- Control panel -->
            <div class="player-controls">
                <label for="volumeSlider" id="volumeLabel">🔊</label>
                <input type="range" id="volumeSlider" min="0" max="1" step="0.01" value="1">
                <input type="number" id="timeInput" placeholder="5s" min="0" style="width: 55px"/>
                <button id="rewindBtn">⏪</button>
                <button id="playPauseBtn">⏯️</button>
                <button id="forwardBtn">⏩</button>
                <button id="loopToggle" title="repeat playlist">⇄</button>
            </div>
            <ul id="playlist" class="list-group"></ul>
        </div>
    `;
    document.body.appendChild(player);
    makeDraggable(player);

    // ======= JS Logic =======
    const audioPlayer = document.getElementById("audioPlayer");
    const volumeSlider = document.getElementById("volumeSlider");
    const volumeLabel = document.getElementById("volumeLabel");
    const playPauseBtn = document.getElementById("playPauseBtn");
    const timeInput = document.getElementById("timeInput");
    const rewindBtn = document.getElementById("rewindBtn");
    const forwardBtn = document.getElementById("forwardBtn");
    const progressBar = document.getElementById("progressBar");
    const currentTimeSpan = document.getElementById("currentTime");
    const leftTime = document.getElementById("leftTime");
    const durationSpan = document.getElementById("duration");

    function formatTime(sec) {
        const minutes = Math.floor(sec / 60);
        const seconds = Math.floor(sec % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    currentTimeSpan.onclick = () => copyId(currentTimeSpan.textContent, currentTimeSpan);
    document.querySelector(".current-time").onclick = () => copyId(currentTimeSpan.textContent, currentTimeSpan);

    volumeSlider.addEventListener("input", () => {
        audioPlayer.volume = volumeSlider.value;
    });

    // Store last volume before muting
    let lastVolume = audioPlayer.volume;

    // Volume slider change
    volumeSlider.addEventListener("input", () => {
        audioPlayer.volume = volumeSlider.value;
        if (audioPlayer.volume === 0) {
            volumeLabel.textContent = "🔇";
        } else {
            volumeLabel.textContent = "🔊";
            lastVolume = audioPlayer.volume;
        }
    });

    // Click on label to mute/unmute
    volumeLabel.addEventListener("click", () => {
        if (audioPlayer.volume > 0) {
            lastVolume = audioPlayer.volume;
            audioPlayer.volume = 0;
            volumeSlider.value = 0;
            volumeLabel.textContent = "🔇";
        } else {
            audioPlayer.volume = lastVolume || 1;
            volumeSlider.value = lastVolume || 1;
            volumeLabel.textContent = "🔊";
        }
    });

    function togglePlayPause() {
        if (audioPlayer.paused) audioPlayer.play();
        else audioPlayer.pause();
    }
    function rewindPlay() {
        const seconds = parseInt(timeInput.value) || 5;
        audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - seconds);
    }
    function forwardPlay() {
        const seconds = parseInt(timeInput.value) || 5;
        audioPlayer.currentTime = Math.min(audioPlayer.duration, audioPlayer.currentTime + seconds);
    }
    function stopResetPlay() {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    }
    document.getElementById("titlePlayStopBtn").onclick = stopResetPlay;

    playPauseBtn.onclick = togglePlayPause;
    document.getElementById("titlePlayPauseBtn").onclick = togglePlayPause;

    rewindBtn.onclick = rewindPlay;
    document.getElementById("titleRewindBtn").onclick = rewindPlay;

    forwardBtn.onclick = forwardPlay;
    document.getElementById("titleForwardBtn").onclick = forwardPlay;

    // Update progress bar while playing
    audioPlayer.addEventListener("timeupdate", () => {
        const value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.value = value || 0;

        currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
        document.querySelector(".current-time").textContent = formatTime(audioPlayer.currentTime);

        leftTime.textContent = formatTime(audioPlayer.duration - audioPlayer.currentTime);
        document.querySelector(".left-time").textContent = formatTime(audioPlayer.duration - audioPlayer.currentTime);

        durationSpan.textContent = formatTime(audioPlayer.duration || 0);
    });

    // Seek audio when user drags the slider
    progressBar.addEventListener("input", () => {
        let currentTime = (progressBar.value / 100) * audioPlayer.duration;
        if (!currentTime) return;
        audioPlayer.currentTime = currentTime;
    });

    //TODO:------------------------------------------------------------------------------ */
    const DB_NAME = "MP3PlayerDB";
    const DB_VERSION = 1;
    const STORE_NAME = "songs";
    const fileInput = document.getElementById("fileInput");
    const playlistEl = document.getElementById("playlist");
    const loadSongs = document.getElementById("loadBtn");
    const dropZone = document.querySelector(".content");
    const loopToggle = document.getElementById("loopToggle");

    let files;
    let db;
    let currentIndex = null;
    let loopPlaylist = JSON.parse(localStorage.getItem("loopPlaylist") || "false");
    if (loopPlaylist) loopToggle.classList.add("active-loop");

    // Open IndexedDB
    const openDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
                }
            };
        });
    };

    const addSong = (name, file) => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const request = store.add({ name, file });
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    const getSong = (id) => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    const deleteSong = (id) => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    };

    loopToggle.addEventListener("click", () => {
        loopPlaylist = !loopPlaylist;
        localStorage.setItem("loopPlaylist", loopPlaylist);
        loopToggle.classList.toggle("active-loop");
    });

    const updatePlayingUI = (index) => {
        const listItems = document.querySelectorAll(".list-group-item");
        listItems.forEach((item) => item.classList.remove("playing"));

        if (listItems[index]) listItems[index].classList.add("playing");
    };

    const renderPlaylist = async () => {
        playlistEl.innerHTML = "";
        const metadata = JSON.parse(localStorage.getItem("playlist") || "[]");

        metadata.forEach((song, index) => {
            const li = document.createElement("li");
            let name = `${song.name}`.slice(0, -4);

            li.innerHTML = `
                <div class="list-item">
                    <span>${index + 1}.&nbsp;</span>
                    <span>${name}</span>
                </div>
            `;

            li.classList.add("list-group-item");

            li.onclick = async () => {
                currentIndex = index;
                playSongFromIndex(currentIndex);
            };

            const remove = document.createElement("span");
            remove.textContent = "❌";
            remove.className = "remove-btn";

            remove.onclick = async (e) => {
                e.stopPropagation();

                await deleteSong(song.id);

                const newList = metadata.filter((s) => s.id !== song.id);
                localStorage.setItem("playlist", JSON.stringify(newList));

                renderPlaylist();
            };

            li.appendChild(remove);
            playlistEl.appendChild(li);
        });
    };

    const playSongFromIndex = async (index) => {
        const metadata = JSON.parse(localStorage.getItem("playlist") || "[]");

        if (metadata.length === 0) return;
        // Stop if reached end and loop disabled
        if (index >= metadata.length) {
            if (!loopPlaylist) return;
            index = 0; // Loop back to first song
        }
        currentIndex = index;
        updatePlayingUI(currentIndex);
        const song = metadata[currentIndex];
        // Clean previous URL
        if (audioPlayer.src) {
            URL.revokeObjectURL(audioPlayer.src);
        }
        const result = await getSong(song.id);
        const url = URL.createObjectURL(result.file);

        audioPlayer.src = url;
        audioPlayer.play();

        audioPlayer.onended = () => {
            playSongFromIndex(currentIndex + 1);
        };
    };

    loadSongs.onclick = () => {
        fileInput.click();
    };

    fileInput.onchange = async (e) => {
        files = Array.from(e.target.files);
        handleFiles(files);
    };

    // Handle files dropped onto the drop zone
    dropZone.addEventListener("dragover", async (e) => {
        e.preventDefault(); // ✅ Necessary! Otherwise "drop" won't fire
        dropZone.style.border = "5px dashed #00f";
    });
    dropZone.addEventListener("drop", async (e) => {
        e.preventDefault();
        files = Array.from(e.dataTransfer.files); // Get the dropped files
        handleFiles(files); // Handle them
        dropZone.style.border = "none";
    });

    async function handleFiles(files) {
        const metadata = JSON.parse(localStorage.getItem("playlist") || "[]");

        for (const file of files) {
            const id = await addSong(file.name, file);
            metadata.push({ id, name: file.name });
        }

        localStorage.setItem("playlist", JSON.stringify(metadata));
        renderPlaylist();
    }

    openDB().then((database) => {
        db = database;
        renderPlaylist();
    });

    minimizeWindow(player.querySelector(".minimize-btn"), player);
    closeWindow(player.querySelector(".close-btn"), player, null);

    //* For script loading
    const loadScript = document.getElementById("loadScript");
    const imageFileInput = document.getElementById("imageFileInput");

    loadScript.addEventListener("click", () => imageFileInput.click());

    imageFileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith("image/")) {
            alert("Please select a valid image file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const imageDataUrl = e.target.result;
            const imageWindow = document.createElement("div");
            imageWindow.className = "image-window";
            imageWindow.innerHTML = `
                <div class="title-bar">
                    <span class="window-header title">Lyric Viewer</span>
                    <div class="img-title-bar">
                        <span class="img-minimize-btn ctrl" title="minimize">—</span>
                        <span class="img-maximize-btn ctrl" title="maximize">🗗</span>
                        <span class="img-close-btn ctrl" title="Close">❌</span>
                    </div>
                </div>
                <div class="image-content">
                    <img src="${imageDataUrl}" alt="Loaded Image" />
                </div>
            `;

            document.body.appendChild(imageWindow);
            makeDraggable(imageWindow);

            closeWindow(imageWindow.querySelector(".img-close-btn"), imageWindow, null);
            minimizeWindow(imageWindow.querySelector(".img-minimize-btn"), imageWindow);

            const maximizeBtn = imageWindow.querySelector(".img-maximize-btn");
            let isMaximized = false;
            maximizeBtn.onclick = () => {
                if (!isMaximized) {
                    imageWindow.classList.add("maximized");
                    maximizeBtn.textContent = "🗗"; // Optional: Change icon to "restore" look
                } else {
                    imageWindow.classList.remove("maximized");
                    maximizeBtn.textContent = "▭"; // Optional: Change icon back to "maximize"
                }
                isMaximized = !isMaximized;
            };
        };

        reader.readAsDataURL(file);
    });
}
