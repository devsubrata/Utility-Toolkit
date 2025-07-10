if (!document.getElementById("openYoutubePlayer")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("styles/YoutubePlayer.css");
    document.head.appendChild(link);

    const link2 = document.createElement("link");
    link2.rel = "stylesheet";
    link2.href = chrome.runtime.getURL("styles/yt.output.css");
    document.head.appendChild(link2);

    const ytp = document.createElement("div");
    ytp.id = "openYoutubePlayer";
    ytp.classList.add("floating-window");
    ytp.innerHTML = `
        <div class="title-bar">
            <span class="title">▶ YoutubePlayer</span>
            <span class="video-title text-indigo-700"></span>
            <div>
                <span class="minimize-btn ctrl" title="minimize" style="margin-right: 5px;">—</span>
                <span class="close-btn ctrl" title="Close">❌</span>
            </div>
        </div>
        <div class="content">
            <div id="controls">
                <input id="videoInput" type="text" placeholder="Enter YouTube video ID or URL" />
                <input type="file" id="scriptInput" accept="image/*" style="display: none" />
                <button id="load-song">Load</button>
                <div id="play-list-container">
                    <button id="showSongsBtn" title="Display Music List">🎵</button>
                    <div id="generatePlaylist">
                        <button id="displayDevotionalSongList" class="song-list-btn">Devotional Music</button>
                        <button id="displayMantraList" class="song-list-btn">Devotional Mantras</button>
                        <button id="displayDesherSongs" class="song-list-btn">Desher Gaan</button>
                        <button id="displayEnglishSongList" class="song-list-btn">English Songs</button>
                        <button id="displayModernBanglaSong" class="song-list-btn">Adunik Bangla Gaan</button>
                        <button id="displayBanglaBandSongList" class="song-list-btn">Bangla Band Songs</button>
                        <button id="displayBanglaRommanticSongs" class="song-list-btn">Romantic Bangla songs</button>
                        <button id="displayHindiMovieSongs" class="song-list-btn">Hindi Movie Songs</button>
                    </div>
                </div>
                <button id="load-script">LoadScript</button>
                <button id="generalSearchBtn" title="Youtube general search">🔎</button>
                <button id="channelListBtn" title="Display Channel List">📺</button>
                <select id="search-type">
                    <option value="playlist" selected>By Playlist</option>
                    <option value="upload">By Uploads</option>
                </select>
                <button id="searchBtn" title="Search in a youtube channel">🔍</button>
            </div>
            <iframe id="youtubePlayer" src="" allowfullscreen></iframe>
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

    //Show Channel List (its a draggable modal)
    const channelListContainer = document.createElement("div");
    channelListContainer.id = "channelModal";
    channelListContainer.className = "fixed top-0 left-78 bg-white shadow-2xl rounded-xl !p-4 hidden z-30000";
    channelListContainer.innerHTML = `  
        <div id="channelModalHeader" class="text-2xl text-pink-800 font-bold border-b !pb-2 !mb-4 flex justify-between items-center">
            <span class="title">📺 Select a Channel</span>
            <span id="closeChList" class="text-lg cursor-pointer">❌</span>
        </div>
        <div id="channelListContent"></div>
    `;
    document.body.appendChild(channelListContainer);
    makeDraggable(channelListContainer);

    //TODO: -----------------Render Channel List in Modal------------------
    document.getElementById("channelListBtn").addEventListener("click", async () => {
        const channelModal = document.getElementById("channelModal");
        if (channelModal) channelModal.classList.remove("hidden");

        const response = await fetch(chrome.runtime.getURL("scripts/Data/channel-list.json"));
        const channelJson = await response.json();
        renderChannelList(channelJson);
    });

    document.getElementById("closeChList").onclick = function () {
        const channelModal = document.getElementById("channelModal");
        if (channelModal) channelModal.classList.add("hidden");
    };

    function renderChannelList(json) {
        const container = document.getElementById("channelListContent");
        // Responsive grid layout
        container.className = "grid gap-3 w-[725px] h-[700px] overflow-y-auto !pb-3 !pr-2 resize";
        container.style.gridTemplateColumns = "repeat(auto-fit, minmax(260px, 1fr))";
        container.style.gridAutoRows = "1fr"; // ← this is key!

        container.innerHTML = "";

        for (const category in json) {
            const channels = json[category];

            const card = document.createElement("div");
            card.className = `
                bg-white border border-gray-400 
                rounded-2xl shadow-md !p-3 
                hover:shadow-lg transition 
                h-full flex flex-col justify-start
            `;
            const title = document.createElement("h3");
            title.className = "text-xl font-semibold text-indigo-700 !mb-1";
            title.textContent = category;
            card.appendChild(title);

            channels.forEach((entry) => {
                const [name, id] = Object.entries(entry)[0];

                const btn = document.createElement("button");
                btn.textContent = `\u00A0\u00A0❀ ${name}`;
                btn.className = "block text-left w-full text-base !px-2 rounded hover:bg-gray-100 transition cursor-pointer";
                btn.addEventListener("click", () => {
                    const channelIdInput = document.getElementById("channelIdInput");
                    if (channelIdInput) channelIdInput.value = id;
                });
                card.appendChild(btn);
            });
            container.appendChild(card);
        }
    }

    //TODO: ------- load script--------------------------------
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

    loadBtn.addEventListener("click", loadVideo);

    minimizeWindow(ytp.querySelector(".minimize-btn"), ytp);
    closeWindow(ytp.querySelector(".close-btn"), ytp, null);

    //TODO: Generate saved song list
    document.getElementById("showSongsBtn").addEventListener("click", () => {
        const generatePlaylist = document.getElementById("generatePlaylist");
        generatePlaylist.style.display = generatePlaylist.style.display === "none" || generatePlaylist.style.display === "" ? "block" : "none";

        document.getElementById("displayEnglishSongList").onclick = () => loadSongList("English Songs", "EnglishSongs");
        document.getElementById("displayBanglaBandSongList").onclick = () => loadSongList("Bangla Band Songs", "BanglaBandSongs");
        document.getElementById("displayDevotionalSongList").onclick = () => loadSongList("Devotional Music", "DevotionalMusic");
        document.getElementById("displayMantraList").onclick = () => loadSongList("Mantra Bhajan", "MantraBhajan");
        document.getElementById("displayHindiMovieSongs").onclick = () => loadSongList("Hindi Movie Songs", "HindiMovieSongs");
        document.getElementById("displayDesherSongs").onclick = () => loadSongList("Desher Gaan", "DesherGaan");
        document.getElementById("displayModernBanglaSong").onclick = () => loadSongList("Modern Bangla Song", "ModernBanglaSong");
        document.getElementById("displayBanglaRommanticSongs").onclick = () => loadSongList("Bangla Rommantic Songs", "BanglaRommanticSongs");

        async function loadSongList(song_list_name, song_list_type) {
            generatePlaylist.style.display = "none";

            const response = await fetch(chrome.runtime.getURL("scripts/Data/saved-song-list.json"));
            const songList = await response.json();
            const allSongs = songList[song_list_type];

            const listDiv = document.getElementById("storedSongsList");
            listDiv.style.display = "block";

            listDiv.innerHTML = `
                <div class="playlist-title-bar">
                    <span class="title">📋 Display List</span>
                    <span id="playlist-name" style="color: darkgreen;">${song_list_name}</span>
                    <div>
                        <span class="list-minimize-btn ctrl" title="minimize">—</span>
                        <span class="list-close-btn ctrl" title="Close" style="margin-left: 5px;">❌</span>
                    </div>
                </div>
                <div class="song-display">
                    <div style="text-align: center; margin: 0 0 20px 0;">
                        <label>Filter By: 
                            <select id="selectVideos" style="background: #fff; padding: 6px 10px; margin-left: 10px; border-radius: 5px; border: 2px solid #aaa; outline: none;">
                                <option value="">All Songs</option>
                            </select>
                        </label>
                    </div>
                    <table id="songsTable">
                        <thead>
                            <tr>
                                <th>SL</th>
                                <th>Title</th>
                                <th>Artists/Channel</th>
                                <th>YouTube Links</th>
                                <th>Lyrics</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>
            `;

            if (allSongs.length === 0) {
                listDiv.textContent = "No songs found in localStorage.";
                return;
            }

            let tags = new Set();
            const filteredVideos = document.getElementById("selectVideos");
            allSongs.forEach((song) => {
                if (song.tags) song.tags.forEach((tag) => tags.add(tag));
            });
            tags.forEach((tag) => {
                const option = document.createElement("option");
                option.value = tag;
                option.textContent = tag;
                filteredVideos.appendChild(option);
            });

            function loadSongToList(songs) {
                const songDisplay = listDiv.querySelector(".song-display");
                const tbody = songDisplay.querySelector("#songsTable tbody");
                tbody.innerHTML = ``;

                songs.forEach(({ song_name, artists, video_id, lyrics = "#" }, index) => {
                    const row = document.createElement("tr");

                    const idBtnContainer = document.createElement("span");
                    const ids = `${video_id}`.split(", ");

                    ids.forEach((id, i) => {
                        const btn = document.createElement("button");
                        btn.textContent = `Link${i + 1}`;
                        btn.classList.add("id-btn");
                        btn.onclick = () => {
                            const iframe = document.getElementById("youtubePlayer");
                            const input = document.getElementById("videoInput");
                            const playerTitle = document.querySelector("#openYoutubePlayer .video-title");

                            if (iframe && input) {
                                input.value = id;
                                iframe.src = `https://www.youtube.com/embed/${id}`;
                                playerTitle.textContent = `"${i + 1}. ${song_name}"`;
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
                        <td>
                            <a href="${lyrics}" target="_blank" rel="noopener noreferrer">🎶</a>
                        </td>
                    `;

                    row.querySelector("td:nth-child(4)").appendChild(idBtnContainer);
                    tbody.appendChild(row);
                });
            }
            loadSongToList(allSongs);

            filteredVideos.addEventListener("change", () => {
                if (filteredVideos.value === "") {
                    loadSongToList(allSongs);
                    return;
                }
                let filteredSongs = allSongs.filter((song) => {
                    if (song.tags) return song.tags.includes(filteredVideos.value);
                    return false;
                });
                loadSongToList(filteredSongs);
            });

            makeDraggable(listDiv);
            minimizeWindow(listDiv.querySelector(".list-minimize-btn"), listDiv);
            closeWindow(listDiv.querySelector(".list-close-btn"), listDiv, null, { hideInstead: true });
        }
    });

    //TODO: Youtube Search
    const searchBtn = document.getElementById("searchBtn");

    searchBtn.onclick = function () {
        if (document.getElementById("search-type").value === "playlist") search_by_playlist();
        else search_by_latest_uploads();
    };

    function search_by_latest_uploads() {
        if (document.getElementById("searchWindow")) return;

        const searchLoader = document.createElement("div");
        searchLoader.id = "searchWindow";
        searchLoader.innerHTML = `
            <div class="bg-blue-50 min-h-screen !p-6 border border-gray-300 hover:border-blue-500 md:border-3 lg:rounded-lg">
                <div class="max-w-6xl mx-auto mb-6">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 flex-wrap">
                        <input
                            type="text"
                            id="channelIdInput"
                            placeholder="Enter Channel ID"
                            class="bg-white max-w-[400px] !text-xl flex-1 !p-3 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
                        />
                        <button id="openChannelList" title="Show channels" class="w-12 h-12 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 cursor-pointer text-xl shadow">
                            📺
                        </button>
                        <button id="fetchBtn" class="bg-blue-600 text-white !px-6 !py-3 rounded-xl shadow hover:bg-blue-700 transition text-xl cursor-pointer">
                            Fetch Videos
                        </button>
                        <button id="resetBtn" class="bg-blue-600 text-white !px-6 !py-3 rounded-xl shadow hover:bg-blue-700 transition text-xl cursor-pointer">reset</button>
                        <p id="goOnYt" class="goOnYt text-lg text-orange-900 font-medium !my-1 cursor-pointer" title="Navigate to Youtube">YT</p>
                        <button class="closeSearchWindowBtn cursor-pointer">❌</button>
                    </div>
                </div>
                <!-- Duration Range Filter -->
                <div class="flex gap-4 items-center justify-center !m-4">
                    <label class="flex items-center gap-1 text-xl">
                        Min Duration (min):
                        <input type="number" id="minDuration" min="0" value="0" class="bg-white w-20 !px-2 !py-1 border rounded text-xl" />
                    </label>

                    <label class="flex items-center gap-1 text-xl">
                        Max Duration (min):
                        <input type="number" id="maxDuration" min="0" value="0" class="bg-white w-20 !px-2 !py-1 border rounded text-xl" />
                    </label>
                    <!-- Max Videos to Load -->
                    <label class="flex items-center gap-1 text-xl">
                        Max Videos to Load:
                        <input type="number" id="maxVideos" class="bg-white w-20 !px-2 !py-1 text-xl border rounded" min="1" max="500" value="50" />
                    </label>
                    <!-- Filter to specific search -->
                    <label class="flex items-center gap-1 text-xl">
                        🔍
                        <input type="text" id="text-filter" class="bg-white w-20 !px-2 !py-1 text-xl border rounded" />
                    </label>
                </div>

                <div class="flex justify-center items-center gap-4 !mt-3 !mb-6 border-2 border-violet-400 rounded-xl !p-2 shadow-md bg-white">
                    <p id="channel-name" class="text-2xl font-bold text-violet-800">Channel Info.</p>
                    <p id="subscriber" class="text-2xl font-bold text-blue-800"></p>
                    <p id="video-count" class="text-2xl font-bold text-green-800"></p>
                </div>

                <!-- Video Grid & pagination div -->
                <div id="videoContainer" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"></div>
                <div class="flex justify-between items-center !mt-6 text-sm !px-2">
                    <div id="video-count-display" class="text-gray-600 font-medium"></div>
                    <div id="pagination" class="flex gap-2"></div>
                </div>
            </div>
        `;
        document.body.appendChild(searchLoader);

        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("closeSearchWindowBtn")) {
                searchLoader.remove();
            }
        });

        const fetchBtn = document.getElementById("fetchBtn");
        const resetBtn = document.getElementById("resetBtn");
        const videoContainer = document.getElementById("videoContainer");
        let allFetchedVideos = []; // Store all fetched videos
        const videosPerPage = 20;

        resetBtn.addEventListener("click", () => {
            document.getElementById("channelIdInput").value = "";

            document.getElementById("minDuration").value = 0;
            document.getElementById("maxDuration").value = 0;
            document.getElementById("maxVideos").value = 50;
            document.getElementById("text-filter").value = "";

            document.getElementById("channel-name").innerHTML = "Channel Info";
            document.getElementById("subscriber").textContent = "";
            document.getElementById("video-count").textContent = "";

            videoContainer.innerHTML = "";

            document.getElementById("video-count-display").textContent = "";
            document.getElementById("pagination").innerHTML = "";
        });

        document.getElementById("openChannelList").addEventListener("click", async () => {
            if (channelModal) channelModal.classList.toggle("hidden");
            const response = await fetch(chrome.runtime.getURL("scripts/Data/channel-list.json"));
            const channelJson = await response.json();
            renderChannelList(channelJson);
        });

        fetchBtn.addEventListener("click", async () => {
            const response = await fetch(chrome.runtime.getURL("scripts/API/api_key.json"));
            const data = await response.json();
            const apiKey = data.YT_API_KEY;

            const inputId = document.getElementById("channelIdInput").value.trim();
            const channelId = inputId;
            if (!channelId) return alert("Please enter or select a channel ID!");

            const maxVideos = parseInt(document.getElementById("maxVideos").value) || 50;

            const paginationContainer = document.getElementById("pagination");
            let currentPage = 1;

            videoContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center !py-10 space-y-2">
                    <div class="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p class="text-2xl text-gray-500 font-medium">Loading videos...</p>
                </div>
            `;

            function channelStats(response) {
                const rawSubscribers = parseInt(response?.items?.[0]?.statistics?.subscriberCount || "0", 10);
                const rawVideos = parseInt(response?.items?.[0]?.statistics?.videoCount || "0", 10);
                const channelName = response?.items?.[0]?.snippet?.title || "Unknown Channel";
                // Formatted
                const subscribers = formatNumber(rawSubscribers);
                const videos = rawVideos.toLocaleString();

                function formatNumber(num) {
                    if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
                    if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
                    if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
                    return num.toString();
                }
                return { channelName, subscribers, videos };
            }

            try {
                // Step 1: Get Uploads Playlist ID
                const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`);

                if (await handleYouTubeApiError(channelRes)) return; // Stop if error handled

                const channelData = await channelRes.json();
                const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

                const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`);

                if (await handleYouTubeApiError(statsRes)) return; // Stop if error handled

                const statsData = await statsRes.json();
                const { channelName, subscribers, videos } = channelStats(statsData);

                document.getElementById("channel-name").innerHTML = `Channel Name: "<span class="text-pink-800">${channelName}</span>"`;
                document.getElementById("subscriber").textContent = ` | Subscribers: ${subscribers}`;
                document.getElementById("video-count").textContent = ` | Total Videos: ${videos}`;

                // Step 2: Get all videos from uploads playlist with pagination
                async function fetchAllPlaylistItems(playlistId, maxVideos = 50) {
                    const allItems = [];
                    let nextPageToken = "";
                    while (nextPageToken !== undefined && allItems.length < maxVideos) {
                        const res = await fetch(
                            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&pageToken=${nextPageToken}&key=${apiKey}`
                        );

                        if (await handleYouTubeApiError(res)) return; // Stop if error handled

                        const data = await res.json();
                        allItems.push(...data.items);
                        nextPageToken = data.nextPageToken;

                        // Stop if we've fetched enough
                        if (allItems.length >= maxVideos) break;
                    }
                    return allItems.slice(0, maxVideos);
                }
                const playlistItems = await fetchAllPlaylistItems(uploadsPlaylistId, maxVideos);
                const videoIds = playlistItems.map((item) => item.snippet.resourceId.videoId);

                // Step 3: Get video details
                async function fetchVideoDetailsInBatches(videoIds) {
                    const allDetails = [];

                    for (let i = 0; i < videoIds.length; i += 50) {
                        const batch = videoIds.slice(i, i + 50).join(",");
                        const res = await fetch(
                            `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${batch}&key=${apiKey}`
                        );

                        if (await handleYouTubeApiError(res)) return; // Stop if error handled

                        const data = await res.json();
                        allDetails.push(...data.items);
                    }

                    return allDetails;
                }
                const videosData = await fetchVideoDetailsInBatches(videoIds);

                function getFilteredVideos() {
                    const minMinutes = parseInt(document.getElementById("minDuration").value) || 0;
                    const maxMinutes = parseInt(document.getElementById("maxDuration").value) || 0;
                    const textFilter = document.getElementById("text-filter").value.trim();
                    const minDuration = minMinutes * 60;
                    const maxDuration = maxMinutes > 0 ? maxMinutes * 60 : Infinity;

                    return allFetchedVideos
                        .filter((v) => v.contentDetails && v.snippet)
                        .filter((v) => {
                            const durationSeconds = parseISODurationToSeconds(v.contentDetails.duration);
                            return durationSeconds >= minDuration && durationSeconds <= maxDuration;
                        })
                        .filter((v) => {
                            if (textFilter === "") return true;
                            return v.snippet.title.toLowerCase().includes(textFilter.toLowerCase());
                        });
                }

                // Step 4: Render
                allFetchedVideos = videosData; // Store globally for pagination
                currentPage = 1;

                function renderPagination(videosPerPage = 20) {
                    const filteredVideos = getFilteredVideos();
                    const totalPages = Math.ceil(filteredVideos.length / videosPerPage);
                    paginationContainer.innerHTML = "";

                    const videoCountDisplay = document.getElementById("video-count-display");
                    const start = (currentPage - 1) * videosPerPage + 1;
                    const end = Math.min(currentPage * videosPerPage, filteredVideos.length);
                    videoCountDisplay.textContent = `Showing ${start}-${end} of ${filteredVideos.length} videos`;

                    const createPageButton = (i) => {
                        const btn = document.createElement("button");
                        btn.textContent = i;
                        btn.className = `w-10 h-10 rounded border-2 border-blue-500 mx-1 ${
                            i === currentPage ? "bg-blue-600 text-white" : "text-blue-600 hover:bg-blue-100"
                        }`;
                        btn.addEventListener("click", () => {
                            currentPage = i;
                            renderVideosPage();
                            renderPagination(videosPerPage);
                        });
                        return btn;
                    };

                    // Prev button
                    const prevBtn = document.createElement("button");
                    prevBtn.textContent = "⏪";
                    prevBtn.className = "w-10 h-10 rounded border-2 border-blue-500 text-blue-600 hover:bg-blue-100 mx-1";
                    prevBtn.disabled = currentPage === 1;
                    prevBtn.addEventListener("click", () => {
                        if (currentPage > 1) {
                            currentPage--;
                            renderVideosPage();
                            renderPagination(videosPerPage);
                        }
                    });
                    paginationContainer.appendChild(prevBtn);

                    // Pages logic
                    if (totalPages <= 12) {
                        for (let i = 1; i <= totalPages; i++) {
                            paginationContainer.appendChild(createPageButton(i));
                        }
                    } else {
                        if (currentPage <= 6) {
                            for (let i = 1; i <= 6; i++) {
                                paginationContainer.appendChild(createPageButton(i));
                            }
                            paginationContainer.appendChild(createEllipsis());
                            for (let i = totalPages - 5; i <= totalPages; i++) {
                                paginationContainer.appendChild(createPageButton(i));
                            }
                        } else if (currentPage > 6 && currentPage < totalPages - 5) {
                            paginationContainer.appendChild(createPageButton(1));
                            paginationContainer.appendChild(createEllipsis());

                            for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                                paginationContainer.appendChild(createPageButton(i));
                            }

                            paginationContainer.appendChild(createEllipsis());
                            paginationContainer.appendChild(createPageButton(totalPages));
                        } else {
                            for (let i = 1; i <= 3; i++) {
                                paginationContainer.appendChild(createPageButton(i));
                            }
                            paginationContainer.appendChild(createEllipsis());
                            for (let i = totalPages - 5; i <= totalPages; i++) {
                                paginationContainer.appendChild(createPageButton(i));
                            }
                        }
                    }
                    // Next button
                    const nextBtn = document.createElement("button");
                    nextBtn.textContent = "⏩";
                    nextBtn.className = "w-10 h-10 rounded border-2 border-blue-500 text-blue-600 hover:bg-blue-100 mx-1";
                    nextBtn.disabled = currentPage === totalPages;
                    nextBtn.addEventListener("click", () => {
                        if (currentPage < totalPages) {
                            currentPage++;
                            renderVideosPage();
                            renderPagination(videosPerPage);
                        }
                    });
                    paginationContainer.appendChild(nextBtn);

                    function createEllipsis() {
                        const span = document.createElement("span");
                        span.textContent = "...";
                        span.className = "text-gray-500 px-2";
                        return span;
                    }
                }

                function renderVideosPage() {
                    const filteredVideos = getFilteredVideos();
                    const start = (currentPage - 1) * videosPerPage;
                    const end = start + videosPerPage;
                    const pageVideos = filteredVideos.slice(start, end);

                    videoContainer.innerHTML = pageVideos
                        .map((v, index) => {
                            const durationStr = formatISODuration(v.contentDetails.duration);
                            const durationSeconds = parseISODurationToSeconds(v.contentDetails.duration);
                            const isShort = durationSeconds <= 120;
                            const videoId = v.id;

                            return `
                                <div class="bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition border border-gray-400">
                                    <div class="relative">
                                        <img src="${v.snippet.thumbnails.high.url}" alt="${v.snippet.title}" class="w-full h-40 object-cover">
                                        <div class="absolute bottom-2 right-2 flex items-center gap-2">
                                            <span class="bg-black text-white text-sm font-bold !px-2 !py-0.5 rounded">${durationStr}</span>
                                            ${isShort ? `<span class="bg-red-600 text-white text-sm !px-2 !py-0.5 rounded shadow">Short</span>` : ""}
                                        </div>
                                    </div>
                                    <div class="!p-4">
                                        <h3 class="font-semibold text-gray-800 mb-2 text-sm">${index + 1}. ${v.snippet.title}</h3>
                                        <p class="text-gray-500 text-sm !mb-3">
                                            ⭐${formatViews(v.statistics.viewCount)} views • ${formatDate(v.snippet.publishedAt)}<br>
                                            ⭐${getRelativeDate(v.snippet.publishedAt)}
                                        </p>
                                        <button data-id="${videoId}" class="copy-btn cursor-pointer !px-2 !py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded">Copy ID</button>
                                        <button data-id="https://www.youtube.com/watch?v=${videoId}" class="copy-btn !px-2 !py-1 cursor-pointer text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded">Copy Link</button>
                                        <button data-id="${videoId}" data-title="${index + 1}. ${v.snippet.title}"
                                                        class="load-media-btn cursor-pointer text-sm !px-2 !py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded">LoadOnPlayer</button>
                                    </div>
                                </div>`;
                        })
                        .join("");

                    // ✅ Bind event listeners for buttons
                    document.querySelectorAll(".copy-btn").forEach((btn) => {
                        btn.addEventListener("click", () => {
                            const id = btn.dataset.id;
                            copyId(id, btn);
                        });
                    });

                    document.querySelectorAll(".load-media-btn").forEach((btn) => {
                        btn.addEventListener("click", () => {
                            const { id, title } = btn.dataset;
                            load_media_into_player(id, title);
                        });
                    });
                }

                renderVideosPage();
                renderPagination(videosPerPage);

                [document.getElementById("minDuration"), document.getElementById("maxDuration"), document.getElementById("text-filter")].forEach(
                    (elm) => {
                        elm.addEventListener("input", () => {
                            currentPage = 1;
                            renderVideosPage();
                            renderPagination(videosPerPage);
                        });
                    }
                );
            } catch (err) {
                videoContainer.innerHTML = `<p class="text-red-600">Failed to fetch videos. Check the Channel ID or API key.</p>`;
            }
        });

        // ✅ Duration formatter: "PT1M30S" → "01:30" or "01:02:15" if hours present
        function formatISODuration(iso) {
            const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (!match) return "00:00";
            const h = parseInt(match[1] || "0", 10);
            const m = parseInt(match[2] || "0", 10);
            const s = parseInt(match[3] || "0", 10);

            const parts = h > 0 ? [h, m, s] : [m, s];
            return parts.map((n) => String(n).padStart(2, "0")).join(":");
        }

        // ✅ Convert ISO duration to total seconds (e.g., "PT1M30S" → 90)
        function parseISODurationToSeconds(iso) {
            const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (!match) return 0;
            const h = parseInt(match[1] || "0", 10);
            const m = parseInt(match[2] || "0", 10);
            const s = parseInt(match[3] || "0", 10);
            return h * 3600 + m * 60 + s;
        }
        function getRelativeDate(publishedAt) {
            const publishedDate = new Date(publishedAt);
            const now = new Date();

            const diffInMs = now - publishedDate;
            const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

            if (diffInDays === 0) return "today";
            if (diffInDays === 1) return "yesterday";
            if (diffInDays < 30) return `${diffInDays} days ago`;

            const diffInMonths = Math.floor(diffInDays / 30);
            if (diffInMonths < 12) {
                return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
            }

            const diffInYears = Math.floor(diffInMonths / 12);
            return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
        }
    }

    function load_media_into_player(id, title = "") {
        const iframe = document.getElementById("youtubePlayer");
        const input = document.getElementById("videoInput");
        if (title.length > 40) title = title.slice(0, 40) + "...";

        if (iframe && input) {
            document.querySelector(".video-title").textContent = `"${title}"`;
            input.value = id;
            iframe.src = `https://www.youtube.com/embed/${id}`;
        }
    }

    function search_by_playlist() {
        const container = document.createElement("main");
        container.className = `fixed top-0 right-0 w-3/5 h-screen overflow-y-auto bg-blue-50 border border-gray-300 hover:border-blue-500 md:border-3 lg:rounded-lg`;
        container.innerHTML = `
            <div class="!mt-3 max-w-4xl !mx-auto space-y-6">
                <div class="flex justify-center items-center gap-2 !my-6">
                    <input
                        id="channelIdInput"
                        type="text"
                        placeholder="Enter channel ID"
                        class="bg-white max-w-[400px] !text-xl flex-1 !p-3 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
                    />
                    <button id="fetch_btn" class="bg-blue-600 text-white !px-4 !py-3 rounded hover:bg-blue-700 cursor-pointer">Fetch</button>
                    
                    <p id="goOnYt" class="goOnYt text-lg text-orange-900 font-medium !my-1 cursor-pointer" title="Navigate to Youtube">YT</p>
                    
                    <button class="closePlaylistWindowBtn cursor-pointer">❌</button>
                </div>
                <div id="app"></div>
            </div>
        `;
        document.body.appendChild(container);

        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("closePlaylistWindowBtn")) {
                container.remove();
            }
        });

        fetch_result_by_playlist();
    }

    async function fetch_result_by_playlist() {
        const fetchBtn = document.getElementById("fetch_btn");
        const channelIdInput = document.getElementById("channelIdInput");
        const app = document.getElementById("app");

        fetchBtn.addEventListener("click", async () => {
            const response = await fetch(chrome.runtime.getURL("scripts/API/api_key.json"));
            const data = await response.json();
            const apiKey = data.YT_API_KEY;

            app.innerHTML = `
                <div class="flex flex-col items-center justify-center py-10 space-y-2">
                    <div class="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p class="text-4xl text-green-500">Loading playlists...</p>
                </div>
            `;
            const channelId = channelIdInput.value.trim();
            if (!channelId) return alert("Please enter a channel ID.");

            try {
                const channelInfo = await fetchChannelInfo(channelId, apiKey);
                const playlists = await fetchAllPlaylists(channelId, apiKey);
                const enriched = await Promise.all(
                    playlists.map((pl) => {
                        return enrichPlaylist(pl, apiKey);
                    })
                );
                renderPlaylists(enriched, channelInfo);
            } catch (err) {
                app.innerHTML = `<p class="text-red-600">Error: ${err.message}</p>`;
            }
        });
    }

    async function fetchChannelInfo(channelId, apiKey) {
        const url = new URL("https://www.googleapis.com/youtube/v3/channels");
        url.search = new URLSearchParams({
            key: apiKey,
            id: channelId,
            part: "snippet,statistics,contentDetails,brandingSettings",
        });

        const res = await fetch(url);
        if (await handleYouTubeApiError(res)) return; // Stop if error handled

        const data = await res.json();
        if (!data.items || !data.items.length) throw new Error("Channel not found");

        const ch = data.items[0];
        return {
            title: ch.snippet?.title || "No title",
            description: ch.snippet?.description || "",
            thumbnail: ch.snippet?.thumbnails?.default?.url || "default_thumbnail.jpg",
            banner: ch.brandingSettings?.image?.bannerExternalUrl || "",
            subscriberCount: formatViews(ch.statistics?.subscriberCount || "0"),
            videoCount: parseNumber(ch.statistics?.videoCount || "0"),
            handle: ch.snippet?.customUrl ? `@${ch.snippet.customUrl}` : "",
        };
    }
    async function fetchAllPlaylists(channelId, apiKey) {
        let items = [],
            pageToken = "";
        do {
            const url = new URL("https://www.googleapis.com/youtube/v3/playlists");
            url.search = new URLSearchParams({
                key: apiKey,
                channelId,
                part: "snippet,contentDetails",
                maxResults: "50",
                pageToken,
            });
            const res = await fetch(url);
            if (await handleYouTubeApiError(res)) return; // Stop if error handled

            const data = await res.json();
            if (data.error) throw new Error(data.error.message);

            // Filter out broken playlist items
            const validItems = (data.items || []).filter((pl) => pl?.snippet?.title && pl?.contentDetails);
            items = items.concat(validItems);

            pageToken = data.nextPageToken || "";
        } while (pageToken);

        return items;
    }
    async function enrichPlaylist(pl, apiKey) {
        const { id, snippet, contentDetails } = pl;
        const videoCount = contentDetails.itemCount;

        const videos = await fetchPlaylistVideos(id, apiKey);
        // Filter out broken/null videos before reducing/mapping
        const validVideos = (videos || []).filter((v) => v && v.snippet && v.contentDetails && v.statistics);
        const totalViews = validVideos.reduce((s, v) => s + parseNumber(v.statistics?.viewCount || "0"), 0);

        return {
            id,
            title: snippet?.title || "Untitled Playlist",
            description: snippet?.description || "",
            thumbnail: snippet?.thumbnails?.medium?.url || "default_thumbnail.jpg",
            videoCount,
            viewCount: totalViews.toLocaleString(),
            videos: validVideos.map((v) => ({
                title: v.snippet?.title || "Untitled",
                views: formatViews(v.statistics?.viewCount || "0"),
                publishedDate: formatDate(v.snippet?.publishedAt || ""),
                relativeDate: getRelativeDate(v.snippet?.publishedAt || ""),
                duration: formatDuration(v.contentDetails?.duration || "PT0M0S"),
                thumbnail: v.snippet?.thumbnails?.medium?.url || "default_thumbnail.jpg",
                videoId: v.id || "unknown",
            })),
        };
    }
    async function fetchPlaylistVideos(playlistId, apiKey) {
        let vids = [],
            pageToken = "";

        do {
            const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
            url.search = new URLSearchParams({
                key: apiKey,
                playlistId,
                part: "snippet,contentDetails",
                maxResults: "50",
                pageToken,
            });

            const res = await fetch(url);
            if (await handleYouTubeApiError(res)) return;

            const data = await res.json();
            const videoIds = (data.items || [])
                .filter((i) => i?.contentDetails?.videoId)
                .map((i) => i.contentDetails.videoId)
                .join(",");

            if (!videoIds) continue;

            const videos = await fetchVideosDetails(videoIds, apiKey);
            vids = vids.concat(videos || []);

            pageToken = data.nextPageToken || "";
        } while (pageToken);

        return vids;
    }
    async function fetchVideosDetails(ids, apiKey) {
        if (!ids || typeof ids !== "string" || ids.trim() === "") return [];

        const url = new URL("https://www.googleapis.com/youtube/v3/videos");
        url.search = new URLSearchParams({
            key: apiKey,
            id: ids,
            part: "snippet,contentDetails,statistics",
        });

        const res = await fetch(url);
        if (await handleYouTubeApiError(res)) return;

        const data = await res.json();
        return Array.isArray(data.items) ? data.items : [];
    }
    // === Helpers ===
    function formatDuration(iso) {
        if (!iso || typeof iso !== "string") return "0:00"; // fallback for null/invalid input

        const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return "0:00"; // fallback for non-matching string

        const h = parseInt(match[1] || 0);
        const m = parseInt(match[2] || 0);
        const s = parseInt(match[3] || 0);

        if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        return `${m}:${String(s).padStart(2, "0")}`;
    }

    function getRelativeDate(publishedAt) {
        const publishedDate = new Date(publishedAt);
        const now = new Date();
        const diffInMs = now - publishedDate;
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return "today";
        if (diffInDays === 1) return "yesterday";
        if (diffInDays < 30) return `${diffInDays} days ago`;

        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) {
            return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
        }

        const diffInYears = Math.floor(diffInMonths / 12);
        return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
    }

    // Truncate description to 50 words
    function truncateText(text, wordLimit = 50) {
        const words = text.split(" ");
        if (words.length <= wordLimit) return { shortText: text, showMore: false };
        return {
            shortText: words.slice(0, wordLimit).join(" ") + "...",
            showMore: true,
        };
    }

    function renderPlaylists(pls, channelInfo) {
        app.innerHTML = ""; // clear existing content

        // Create the container
        const channelHeader = document.createElement("div");
        channelHeader.className = "bg-white rounded-xl shadow !p-0 !mb-6 overflow-hidden";

        // Optional banner image (if available)
        if (channelInfo.banner) {
            const bannerImg = document.createElement("img");
            bannerImg.src = channelInfo.banner;
            bannerImg.className = "w-full h-40 sm:h-60 object-cover";
            channelHeader.appendChild(bannerImg);
        }

        // Info section (avatar, name, stats, description)
        const infoWrapper = document.createElement("div");
        infoWrapper.className = "!p-4 flex gap-4 items-start sm:items-center flex-col sm:flex-row";

        // Avatar
        const avatar = document.createElement("img");
        avatar.src = channelInfo.thumbnail;
        avatar.className = "w-16 h-16 rounded-full border";
        infoWrapper.appendChild(avatar);

        // Info Text Container
        const infoText = document.createElement("div");
        infoText.className = "flex-1";

        // Title
        infoText.innerHTML = `
            <h1 class="text-2xl font-bold text-indigo-900">${channelInfo.title}</h1>
            <div class="text-lg text-violet-800 !mt-0.5">
                ${channelInfo.handle} ✿ ${channelInfo.subscriberCount} subscribers ✿ ${channelInfo.videoCount} videos ✿ ${pls.length} playlists
            </div>
        `;

        // Description (with collapsible "show more")
        const desc = document.createElement("p");
        desc.className = "text-sm text-gray-700 mt-2";
        desc.id = "channelDesc";

        const short = channelInfo.description?.slice(0, 100) || "";
        const long = channelInfo.description || "";
        const needsToggle = long.length > 100;

        desc.textContent = needsToggle ? short + "…" : long;
        desc.dataset.expanded = "false";
        infoText.appendChild(desc);

        // Toggle button
        if (needsToggle) {
            const toggle = document.createElement("button");
            toggle.className = "text-blue-600 text-xs !mt-1";
            toggle.textContent = "Show more";
            toggle.addEventListener("click", () => {
                const isExpanded = desc.dataset.expanded === "true";
                desc.textContent = isExpanded ? short + "…" : long;
                desc.dataset.expanded = isExpanded ? "false" : "true";
                toggle.textContent = isExpanded ? "Show more" : "Show less";
            });
            infoText.appendChild(toggle);
        }

        infoWrapper.appendChild(infoText);
        channelHeader.appendChild(infoWrapper);
        app.appendChild(channelHeader);

        const overview = document.createElement("div");
        overview.id = "playlistOverview";
        overview.className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 !mb-6";

        pls.forEach((pl, i) => {
            // === Overview Card ===
            const miniCard = document.createElement("div");
            miniCard.className =
                "cursor-pointer bg-white shadow hover:shadow-md transition rounded-lg !p-3 border border-gray-200 hover:border-blue-900";
            miniCard.innerHTML = `
                <img src="${pl.thumbnail}" class="w-full h-28 object-cover rounded !mb-2">
                <h3 class="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">${i + 1 + ". " + pl.title}</h3>
                <div class="text-xs text-gray-500 !mt-1">${pl.videoCount} videos · ${pl.viewCount} views</div>
            `;
            miniCard.addEventListener("click", () => {
                document.getElementById(`section-${pl.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
            overview.appendChild(miniCard);
        });

        const playListTitle = document.createElement("div");
        playListTitle.className =
            "bg-white w-1/2 !text-violet-900 text-4xl rounded-xl shadow !p-3 !mb-6 !mx-auto overflow-hidden flex items-center justify-center";
        playListTitle.innerText = "PlayLists";
        app.appendChild(playListTitle);

        app.appendChild(overview);

        const videosTitle = document.createElement("div");
        videosTitle.className =
            "bg-white w-2/3 !text-violet-900 text-4xl rounded-xl shadow !p-3 !mb-6 !mx-auto overflow-hidden flex items-center justify-center";
        videosTitle.innerText = "Explore videos by playlists";
        app.appendChild(videosTitle);

        pls.forEach((pl, i) => {
            const section = document.createElement("section");
            section.id = `section-${pl.id}`;
            section.className = "bg-white rounded-xl shadow !p-4 !mb-6";

            section.innerHTML = `
                <div class="flex items-start gap-4 !mb-4">
                    <img src="${pl.thumbnail}" alt="" class="w-42 h-30 object-cover rounded">
                    <div class="flex-1 header-right">
                        <h2 class="text-xl font-bold text-gray-800">${i + 1 + ". " + pl.title}</h2>
                        <div class="text-sm text-indigo-600 !mt-0.5">
                            ✅<strong>Playlist ID:</strong> ${pl.id} <br/>✅${pl.videoCount} videos <br/>✅${pl.viewCount} views
                        </div>
                        <div class="desc-wrapper !mt-1"></div> <!-- 💡 Placeholder for dynamic description -->
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" id="playlist-${pl.id}"></div>
            `;

            const backTopWrapper = document.createElement("div");
            backTopWrapper.className = "flex justify-end !mt-4";

            const backTopBtn = document.createElement("button");
            backTopBtn.innerText = "⬆ Back to Playlists";
            backTopBtn.className = "text-sm text-blue-600 hover:text-blue-900 cursor-pointer";
            backTopBtn.addEventListener("click", () => {
                document.getElementById("playlistOverview")?.scrollIntoView({ behavior: "smooth", block: "start" });
            });

            backTopWrapper.appendChild(backTopBtn);
            section.appendChild(backTopWrapper);

            // Add video cards
            const grid = section.querySelector(`#playlist-${pl.id}`);
            pl.videos.forEach((v, i) => {
                const div = document.createElement("div");
                div.className =
                    "video-card bg-white border border-gray-400 hover:border-blue-500 rounded-2xl shadow-md !p-3 hover:shadow-lg transition h-full flex flex-col justify-start";
                div.innerHTML = `
                    <div class="relative">
                        <img class="rounded-lg w-full" src="${v.thumbnail}">
                        <span class="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs !px-1.5 !py-0.5 rounded">${v.duration}</span>
                    </div>
                    <h3 class="font-semibold !mt-2 text-sm leading-snug">${i + 1}. ${v.title}</h3>
                    <div class="text-gray-600 text-xs flex gap-2 !mt-1">
                        <span>⭐ ${v.views} views</span>
                        <span> ${v.publishedDate}</span>
                    </div>
                    <div class="text-xs text-yellow-600 !mt-0.5">⭐ ${v.relativeDate}</div>
                    <div class="flex gap-2 !mt-2">
                        <button class="cursor-pointer copy-btn bg-gray-100 hover:bg-gray-200 !px-2 !py-1 rounded text-xs" data-title="${i + 1}. ${
                    v.title
                }" data-id="${v.videoId}">LoadOnPlayer</button>
                        <button class="copy-link bg-gray-100 hover:bg-gray-200 !px-2 !py-1 rounded text-xs cursor-pointer" data-link="https://www.youtube.com/watch?v=${
                            v.videoId
                        }">Copy Link</button>
                        <button class="load-btn bg-gray-100 hover:bg-gray-200 !px-2 !py-1 rounded text-xs cursor-pointer" data-link="https://www.youtube.com/watch?v=${
                            v.videoId
                        }">PlayOnYt</button>
                    </div>
                `;
                grid.appendChild(div);
            });

            // Add description toggle
            const { shortText, showMore } = truncateText(pl.description, 50);

            const descWrapper = section.querySelector(".desc-wrapper");

            const descPara = document.createElement("p");
            descPara.className = "text-sm text-gray-700 desc whitespace-pre-wrap";
            descPara.innerText = shortText;
            descPara.dataset.full = pl.description;
            descPara.dataset.expanded = "false";

            const moreBtn = document.createElement("button");
            moreBtn.className = "text-blue-600 text-sm mt-1 more-btn";
            moreBtn.innerText = "...more";

            if (!showMore) moreBtn.style.display = "none"; // hide if not needed

            moreBtn.addEventListener("click", () => {
                const expanded = descPara.dataset.expanded === "true";
                if (!expanded) {
                    descPara.innerText = pl.description;
                    descPara.dataset.expanded = "true";
                    moreBtn.innerText = "...less";
                } else {
                    descPara.innerText = shortText;
                    descPara.dataset.expanded = "false";
                    moreBtn.innerText = "...more";
                }
            });

            descWrapper.appendChild(descPara);
            descWrapper.appendChild(moreBtn);

            // Handle Copy Buttons
            section.addEventListener("click", (e) => {
                if (e.target.matches(".copy-btn")) {
                    const { id, title } = e.target.dataset;
                    copyId(id, e.target);
                    load_media_into_player(id, title);
                } else if (e.target.matches(".copy-link")) {
                    copyId(e.target.dataset.link, e.target);
                } else if (e.target.matches(".load-btn")) {
                    window.open(e.target.dataset.link, "_blank", "top=100,left=100,width=600,height=400");
                }
            });
            app.appendChild(section);
        });
    }

    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("goOnYt")) {
            const channelIdInput = document.getElementById("channelIdInput");
            if (channelIdInput && channelIdInput.value !== "") {
                window.open(`https://www.youtube.com/channel/${channelIdInput.value}`);
            }
        }
    });

    //TODO: --------------------------Youtube General Search------------------
    //* create a window for search
    const generalSearchBtn = document.getElementById("generalSearchBtn");
    generalSearchBtn.onclick = function () {
        if (document.getElementById("generalSearchWindow")) return;

        //TODO:---------load general search window -------------
        const generalSearchLoader = document.createElement("div");
        let isGslMinimized = false;
        generalSearchLoader.id = "generalSearchWindow";
        generalSearchLoader.className = `
            absolute top-0 left-[40%] w-[800px] h-[900px] 
            bg-black text-white border-2 border-[#444] 
            shadow-[0_0_10px_rgba(0,0,0,0.5)] 
            resize overflow-hidden flex flex-col z-[25000]
        `;
        generalSearchLoader.innerHTML = `
            <div class="title-bar flex justify-between items-center !mx-4 !my-1">
                <span class="title">Youtube search</span>
                <div class="flex gap-4">
                    <span class="gsl-minimize-btn ctrl" title="minimize">—</span>
                    <span class="gsl-close-btn ctrl" title="Close">❌</span>
                </div>
            </div>
            <div id="search-content" class=" bg-amber-50 flex-1 overflow-y-auto"></div>
            <div class="bottom-nav flex justify-center items-center">
                <button id="scrollToTop">⏫</button>      
                <button id="scrollUp">🔼</button>        
                <button id="scrollDown">🔽</button>       
                <button id="scrollToBottom">⏬</button>   
            </div>
        `;
        document.body.appendChild(generalSearchLoader);
        makeDraggable(generalSearchLoader);

        closeWindow(document.querySelector(".gsl-close-btn"), generalSearchLoader, null);
        document.querySelector(".gsl-minimize-btn").addEventListener("click", () => {
            if (!isGslMinimized) {
                document.getElementById("search-content").style.display = "none";
                document.querySelector(".bottom-nav").style.display = "none";
                document.getElementById("generalSearchWindow").style.height = "35px";
            } else {
                document.getElementById("search-content").style.display = "block";
                document.querySelector(".bottom-nav").style.display = "flex";
                document.getElementById("generalSearchWindow").style.height = "900px";
            }
            isGslMinimized = !isGslMinimized;
        });

        // this function creates search form
        function loadContent() {
            const searchForm = document.createElement("div");
            searchForm.className = "w-full !p-6 !pt-3 flex flex-col items-center justify-center";
            // searchForm.className = "max-w-5xl mx-auto !p-6 flex flex-col items-center justify-center";
            searchForm.innerHTML = `
                <h1 class="text-3xl font-bold text-center text-indigo-700 !mb-3">Search Youtube Videos</h1>
                <div class="w-full min-w-[490px] !mb-6 bg-gray-100 rounded-2xl shadow-md !p-6">
                    <div class="flex gap-3 justify-center items-center">
                        <input id="generalSearchInput" type="text" placeholder="Search videos..." class="bg-white text-black !text-xl w-full max-w-xl border-3 border-indigo-700 rounded !px-4 !py-2" />
                        <button id="search-btn" class="bg-indigo-600 hover:bg-indigo-700 !text-xl text-white !px-4 !py-2 rounded cursor-pointer">Search</button>
                    </div>
                    <div id="sort-controls" class="flex flex-col sm:flex-row items-center justify-center gap-4 w-full !mt-4">
                        <div class="flex items-center justify-center gap-2 flex-wrap">
                            <label class="!text-xl text-black whitespace-nowrap">Max results: </label>
                            <input id="maxVideoResults" type="number" min="10" step="10" value="50" placeholder="Max results" class="bg-white text-black !text-xl w-[75px] border border-gray-300 rounded !px-2 !py-1" />
                        </div>
                        <div class="flex items-center justify-center gap-2 flex-wrap">
                            <label for="sortField" class="!text-xl font-medium text-gray-800">Sort By:</label>
                            <select id="sortField" class="!text-xl text-black bg-white border border-gray-300 rounded-md !px-3 !py-1 focus:outline-none focus:ring-2 focus:ring-blue-400">
                                <option value="default">Default</option>
                                <option value="views">Views</option>
                                <option value="publishedAt">Publish Date</option>
                            </select>
                        </div>
                        <div class="flex items-center justify-center gap-2 flex-wrap">
                            <label for="sortOrder" class="!text-xl font-medium text-gray-800">Order:</label>
                            <select id="sortOrder" class="!text-xl text-black bg-white border border-gray-300 rounded-md !px-3 !py-1 focus:outline-none focus:ring-2 focus:ring-blue-400">
                            <option value="dsc">Desc</option>
                                <option value="asc">Asc</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div id="globalSearchResults" class="space-y-6 !px-2"></div>
            `;
            const searchContent = document.getElementById("search-content");
            if (searchContent) searchContent.appendChild(searchForm);
        }
        loadContent();

        handleNavigation(document.getElementById("search-content"));

        const gsBtn = document.getElementById("search-btn");
        if (!gsBtn) return;

        const resultContainer = document.getElementById("globalSearchResults");

        gsBtn.addEventListener("click", async () => {
            const query = document.getElementById("generalSearchInput").value.trim();
            const maxCount = parseInt(document.getElementById("maxVideoResults").value || "50", 10);

            if (!query) return alert("Please enter a search term.");

            // Loading UI
            resultContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-10 space-y-2">
                    <div class="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p class="text-4xl text-green-500">Loading videos...</p>
                </div>
            `;

            try {
                const response = await fetch(chrome.runtime.getURL("scripts/API/api_key.json"));
                const data = await response.json();
                const apiKey = data.YT_API_KEY;

                loadResults(query, maxCount, apiKey);
            } catch (err) {
                resultContainer.innerHTML = `<div class='text-red-600'>Error: ${err.message}</div>`;
            }
        });

        let cachedSearchResults = [];
        let cachedStatsData = [];
        async function loadResults(query, maxCount, apiKey) {
            try {
                cachedSearchResults = await fetchGeneralSearchResults(query, maxCount, apiKey);
                const videoIds = cachedSearchResults.map((v) => v.id.videoId);
                cachedStatsData = await fetchVideoStats(videoIds, apiKey);

                applySortAndRender();
            } catch (err) {
                resultContainer.innerHTML = `<div class='text-red-600'>Error: ${err.message}</div>`;
            }
        }

        function applySortAndRender() {
            const sortField = document.getElementById("sortField").value;
            const sortOrder = document.getElementById("sortOrder").value;

            const statsMap = new Map(cachedStatsData.map((stat) => [stat.id, stat]));

            const sortedResults = [...cachedSearchResults].sort((a, b) => {
                let aValue, bValue;

                if (sortField === "views") {
                    aValue = parseInt(statsMap.get(a.id.videoId)?.statistics.viewCount || 0);
                    bValue = parseInt(statsMap.get(b.id.videoId)?.statistics.viewCount || 0);
                } else if (sortField === "publishedAt") {
                    aValue = new Date(a.snippet.publishedAt).getTime();
                    bValue = new Date(b.snippet.publishedAt).getTime();
                } else {
                    return 0; // Default: no sort
                }
                return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
            });
            renderGeneralSearchResults(sortedResults, cachedStatsData);
        }
        document.getElementById("sortField").addEventListener("change", applySortAndRender);
        document.getElementById("sortOrder").addEventListener("change", applySortAndRender);

        async function fetchGeneralSearchResults(query, maxCount, apiKey) {
            const baseUrl = "https://www.googleapis.com/youtube/v3/search";
            let videos = [];
            let pageToken = "";

            while (videos.length < maxCount) {
                const remaining = Math.min(50, maxCount - videos.length);
                const url = new URL(baseUrl);
                url.search = new URLSearchParams({
                    part: "snippet",
                    type: "video",
                    maxResults: remaining.toString(),
                    q: query,
                    key: apiKey,
                    pageToken,
                });
                const res = await fetch(url);
                if (await handleYouTubeApiError(res)) return [];

                const data = await res.json();
                if (!data.items || data.items.length === 0) break;

                videos = videos.concat(data.items);
                pageToken = data.nextPageToken || "";

                if (!pageToken) break;
            }
            return videos;
        }

        async function fetchVideoStats(videoIds, apiKey) {
            const allStats = [];

            function chunkArray(arr, size) {
                const chunks = [];
                for (let i = 0; i < arr.length; i += size) {
                    chunks.push(arr.slice(i, i + size));
                }
                return chunks;
            }
            const chunks = chunkArray(videoIds, 50);

            for (const chunk of chunks) {
                const ids = chunk.join(",");
                const url = new URL("https://www.googleapis.com/youtube/v3/videos");
                url.search = new URLSearchParams({
                    part: "contentDetails,statistics",
                    id: ids,
                    key: apiKey,
                });

                const res = await fetch(url);
                if (await handleYouTubeApiError(res)) return [];

                const data = await res.json();
                allStats.push(...data.items);
            }
            return allStats;
            // async function fetchVideoStatsParallel(videoIds, apiKey) {
            //     const chunks = chunkArray(videoIds, 50);
            //     const promises = chunks.map((chunk) => {
            //         const ids = chunk.join(",");
            //         const url = new URL("https://www.googleapis.com/youtube/v3/videos");
            //         url.search = new URLSearchParams({
            //             part: "contentDetails,statistics",
            //             id: ids,
            //             key: apiKey,
            //         });
            //         return fetch(url).then((res) => res.json());
            //     });
            //     const results = await Promise.all(promises);
            //     const allStats = results.flatMap((data) => data.items);
            //     return allStats;
            // }
        }

        function renderGeneralSearchResults(results, statsData) {
            resultContainer.innerHTML = "";
            results.forEach((video, index) => {
                const videoId = video.id.videoId;
                const stats = statsData.find((v) => v.id === videoId);
                const viewCount = stats?.statistics?.viewCount || "N/A";
                const duration = isoDurationToTimeString(stats?.contentDetails?.duration || "");

                const { title, thumbnails, channelTitle, publishedAt, channelId } = video.snippet;
                const formattedDate = formatDate(publishedAt);
                const timeAgoText = timeAgo(publishedAt);

                const card = document.createElement("div");
                card.className = `
                    border rounded-xl hover:border-blue-900 
                    overflow-hidden shadow hover:shadow-lg 
                    transition !p-4 !mb-4 flex gap-4 bg-white
                `;

                card.innerHTML = `
                    <div class="relative w-48 min-w-[12rem] bg-gray-900 rounded-[5px]">
                        <img src="${thumbnails.high.url}" alt="Thumbnail" class="rounded w-full h-auto">
                        <span class="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs !px-2 !py-1 rounded">
                            ${duration}
                        </span>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-xl text-indigo-800 font-semibold !mb-1">${title}</h3>
                        <p class="text-sm text-gray-600">👁️ ${formatViews(viewCount)} views</p>
                        <div class="text-xs text-gray-500 !mt-1">
                            ❀ Published: <span class="font-medium">${formattedDate}</span>
                            &nbsp;&nbsp;❀ ${timeAgoText}
                            <span class="font-bold text-blue-900">&nbsp; 🔹 SL: ${index + 1}</span>
                        </div>
                        <a href="https://www.youtube.com/channel/${channelId}" target="_blank" rel="noopener noreferrer" class="contents">
                            <p class="text-lg text-orange-900 font-medium !my-1 cursor-pointer">📺 ${channelTitle}</p>
                        </a>
                        <div class="flex flex-wrap gap-2">
                            <button class="gs-copy-btn text-black cursor-pointer" data-chid="${channelId}">⭐Channel ID</button>
                            <button class="gs-copy-btn text-black cursor-pointer" data-title="${index + 1}. ${title}" data-vid="${
                    video.id.videoId
                }">⭐LoadOnPlayer</button>
                            <button class="gs-copy-btn text-black cursor-pointer" data-vid="${video.id.videoId}">⭐Copy ID</button>
                            <button class="gs-copy-btn text-black cursor-pointer" data-link="https://www.youtube.com/watch?v=${
                                video.id.videoId
                            }">⭐PlayOnYt</button>
                        </div>
                    </div>
                `;

                resultContainer.appendChild(card);
            });

            document.addEventListener("click", (e) => {
                if (e.target.classList.contains("gs-copy-btn")) {
                    loadVideoId(e.target);
                }
            });
        }
    };

    function timeAgo(dateString) {
        const now = new Date();
        const publishedDate = new Date(dateString);
        const diffInSeconds = Math.floor((now - publishedDate) / 1000);

        const units = [
            { label: "year", seconds: 31536000 },
            { label: "month", seconds: 2592000 },
            { label: "week", seconds: 604800 },
            { label: "day", seconds: 86400 },
            { label: "hour", seconds: 3600 },
            { label: "minute", seconds: 60 },
            { label: "second", seconds: 1 },
        ];

        for (const unit of units) {
            const count = Math.floor(diffInSeconds / unit.seconds);
            if (count >= 1) {
                return `${count} ${unit.label}${count > 1 ? "s" : ""} ago`;
            }
        }
        return "just now";
    }
    function isoDurationToTimeString(iso) {
        const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
        if (iso === undefined) return "00:00";

        const match = iso.match(regex);
        if (!match) return "00:00";

        let [, hours, minutes, seconds] = match.map(Number);

        hours = hours || 0;
        minutes = minutes || 0;
        seconds = seconds || 0;

        const pad = (num) => String(num).padStart(2, "0");
        if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        else return `${pad(minutes)}:${pad(seconds)}`;
    }
    function loadVideoId(btn) {
        if (btn.dataset.chid) {
            const channel_id = btn.dataset.chid;
            const channelIdInput = document.getElementById("channelIdInput");
            if (channelIdInput) channelIdInput.value = channel_id;
            copyId(channel_id, btn);
        } else if (btn.dataset.vid && btn.dataset.title) {
            const { vid, title } = btn.dataset;
            if (vid === "undefined") {
                alert("Invalid video id");
                return;
            }
            load_media_into_player(vid, title);
        } else if (btn.dataset.vid) {
            const vid = btn.dataset.vid;
            copyId(vid, btn);
        } else if (btn.dataset.link) {
            const link = btn.dataset.link;
            if (link.includes("undefined")) alert("Link is broken");
            else {
                window.open(link, "_blank", "top=100,left=100,width=600,height=400");
                copyId(link, btn);
            }
        }
    }
}
