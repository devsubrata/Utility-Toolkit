if (!document.getElementById("openYoutubePlayer")) {
    uploadSongList();

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("styles/YoutubePlayer.css");
    document.head.appendChild(link);

    const ytp = document.createElement("div");
    ytp.id = "openYoutubePlayer";
    ytp.classList.add("floating-window");
    ytp.innerHTML = `
        <div class="title-bar">
            <span class="title">▶ YoutubePlayer</span>
            <span class="minimize-btn ctrl" title="minimize">—</span>
            <span class="close-btn ctrl" title="Close">❌</span>
        </div>
        <div class="content">
            <div id="controls">
                <input id="videoInput" type="text" placeholder="Enter YouTube video ID or URL" />
                <input type="file" id="scriptInput" accept="image/*" style="display: none" />
                <button id="load-song">Load</button>
                <button id="load-script">LoadScript</button>
                <button id="showSongsBtn">DisplayList</button>
            </div>
            <iframe id="youtubePlayer" src="" allowfullscreen></iframe>
            <button id="popupBtn">Open in Popup</button>
        </div>
        <div id="storedSongsList"></div>
    `;
    document.body.appendChild(ytp);
    makeDraggable(ytp);

    const input = document.getElementById("videoInput");
    const scriptInput = document.getElementById("scriptInput");
    const loadBtn = document.getElementById("load-song");
    const loadScript = document.getElementById("load-script");
    const iframe = document.getElementById("youtubePlayer");
    const popupBtn = document.getElementById("popupBtn");

    //* load script
    loadScript.addEventListener("click", () => scriptInput.click());

    scriptInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith("image/")) {
            alert("Please select a valid image file.");
            return;
        }

        let fileName = file.name;
        fileName = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;

        const reader = new FileReader();
        reader.onload = function (e) {
            const imageDataUrl = e.target.result;
            const imageWindow = document.createElement("div");
            imageWindow.className = "image-window";
            imageWindow.innerHTML = `
                <div class="title-bar">
                    <span class="window-header title">Image Viewer</span>
                    <span id="song-title"></span>
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

            document.getElementById("song-title").textContent = fileName;

            closeWindow(imageWindow.querySelector(".img-close-btn"), imageWindow, null);
            minimizeWindow(imageWindow.querySelector(".img-minimize-btn"), imageWindow);

            const maximizeBtn = imageWindow.querySelector(".img-maximize-btn");
            let isMaximized = false;
            maximizeBtn.addEventListener("click", () => {
                if (!isMaximized) {
                    imageWindow.classList.add("maximized");
                    maximizeBtn.textContent = "🗗"; // Optional: Change icon to "restore" look
                } else {
                    imageWindow.classList.remove("maximized");
                    maximizeBtn.textContent = "▭"; // Optional: Change icon back to "maximize"
                }
                isMaximized = !isMaximized;
            });
        };

        reader.readAsDataURL(file);
    });

    let currentVideoId = "";

    function extractVideoId(input) {
        // Extract 11-character YouTube ID from URL or use input as ID directly
        const regex = /(?:v=|\/)([0-9A-Za-z_-]{11})/;
        const match = input.match(regex);
        return match ? match[1] : input.trim();
    }

    function loadVideo() {
        const val = input.value.trim();
        if (!val) return alert("Please enter a YouTube video ID or URL.");
        currentVideoId = extractVideoId(val);
        iframe.src = `https://www.youtube.com/embed/${currentVideoId}`;
    }

    function openPopup() {
        if (!currentVideoId) return alert("Load a video first!");
        const url = `https://www.youtube.com/watch?v=${currentVideoId}`;

        const width = 800;
        const height = 600;
        const left = screen.width / 2 - width / 2;
        const top = screen.height / 2 - height / 2;

        const features = `
                    width=${width},
                    height=${height},
                    top=${top},
                    left=${left},
                    resizable=yes,
                    scrollbars=yes,
                    toolbar=no,
                    menubar=no,
                    location=no,
                    status=no
                `.replace(/\s+/g, "");
        window.open(url, "ytpopup", features);
    }

    loadBtn.addEventListener("click", loadVideo);
    popupBtn.addEventListener("click", openPopup);

    minimizeWindow(ytp.querySelector(".minimize-btn"), ytp);
    closeWindow(ytp.querySelector(".close-btn"), ytp, null);

    //* load songs
    function getAllSongs() {
        return JSON.parse(localStorage.getItem("EnglishSongs") || "[]");
    }

    document.getElementById("showSongsBtn").addEventListener("click", () => {
        const listDiv = document.getElementById("storedSongsList");
        listDiv.style.display = "block";

        listDiv.innerHTML = `
            <div class="title-bar">
                <span class="title">📋 Display List</span>
                <span class="list-minimize-btn ctrl" title="minimize">—</span>
                <span class="list-close-btn ctrl" title="Close">❌</span>
            </div>
            <div class="song-display">
                <table id="songsTable">
                    <thead>
                        <tr>
                            <th>SL</th>
                            <th>Song Title</th>
                            <th>Artists</th>
                            <th>YouTube ID</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
        `;

        const songs = getAllSongs();

        if (songs.length === 0) {
            listDiv.textContent = "No songs found in localStorage.";
            return;
        }

        const songDisplay = listDiv.querySelector(".song-display");
        const tbody = songDisplay.querySelector("#songsTable tbody");

        songs.forEach(({ song_name, artists, video_id }, index) => {
            const row = document.createElement("tr");

            const idBtnContainer = document.createElement("span");
            const ids = `${video_id}`.split(", ");

            ids.forEach((id) => {
                const btn = document.createElement("button");
                btn.textContent = id;
                btn.classList.add("id-btn");
                btn.onclick = () => {
                    // Load video in iframe or however you wish
                    const iframe = document.getElementById("youtubePlayer");
                    const input = document.getElementById("videoInput");

                    if (iframe && input) {
                        input.value = id;
                        iframe.src = `https://www.youtube.com/embed/${id}`;
                    } else {
                        alert(`Video ID: ${id}`);
                    }
                };
                idBtnContainer.appendChild(btn);
            });

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${song_name}</td>
                <td>${artists}</td>
                <td></td>
            `;

            row.querySelector("td:last-child").appendChild(idBtnContainer);
            tbody.appendChild(row);
        });

        makeDraggable(listDiv);
        minimizeWindow(listDiv.querySelector(".list-minimize-btn"), listDiv);
        closeWindow(listDiv.querySelector(".list-close-btn"), listDiv, null, { hideInstead: true });
    });
}
