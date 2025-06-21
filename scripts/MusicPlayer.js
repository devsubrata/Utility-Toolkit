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
            <span class="minimize-btn ctrl" title="minimize">—</span>
            <span class="close-btn ctrl" title="Close">❌</span>
        </div>
        <div class="content">
            <input type="file" id="fileInput" accept="audio/mpeg" multiple style="display: none" />
            <input type="file" id="imageFileInput" accept="image/*" style="display: none" />
            <div class="load-div">
                <button id="loadBtn">Load Musics</button>
                <button id="loadScript">Load Lyric</button>
            </div>
            <audio id="audioPlayer" controls style="width: 100%"></audio>
            <ul id="playlist" class="list-group"></ul>
        </div>
    `;
    document.body.appendChild(player);
    makeDraggable(player);

    const DB_NAME = "MP3PlayerDB";
    const DB_VERSION = 1;
    const STORE_NAME = "songs";
    const fileInput = document.getElementById("fileInput");
    const audioPlayer = document.getElementById("audioPlayer");
    const playlistEl = document.getElementById("playlist");
    const loadSongs = document.getElementById("loadBtn");
    let db;

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
                const reversedQueue = metadata.slice(index); // From clicked to the first song
                let current = 0;
                const playSong = async () => {
                    if (current >= reversedQueue.length) return;

                    const currentSong = reversedQueue[current];
                    const result = await getSong(currentSong.id);
                    const url = URL.createObjectURL(result.file);
                    audioPlayer.src = url;
                    audioPlayer.play();

                    current++;

                    audioPlayer.onended = playSong; // Chain to next song in reverse order
                };
                playSong();
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

    loadSongs.onclick = () => {
        fileInput.click();
    };

    fileInput.onchange = async (e) => {
        const files = Array.from(e.target.files);
        const metadata = JSON.parse(localStorage.getItem("playlist") || "[]");

        for (const file of files) {
            const id = await addSong(file.name, file);
            metadata.push({ id, name: file.name });
        }

        localStorage.setItem("playlist", JSON.stringify(metadata));
        renderPlaylist();
    };

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
