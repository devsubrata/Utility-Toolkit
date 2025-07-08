if (!document.getElementById("openYoutubePlayer")) {
    uploadSongList();

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
                <button id="searchBtn">🔍</button>
            </div>
            <iframe id="youtubePlayer" src="" allowfullscreen></iframe>
            <!-- <button id="popupBtn">Open in Popup</button> -->
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

    loadBtn.addEventListener("click", loadVideo);

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

    //TODO: Youtube Search
    const searchBtn = document.getElementById("searchBtn");
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

            <!-- Video Grid -->
            <div id="videoContainer" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"></div>
            <div class="flex justify-between items-center !mt-6 text-sm !px-2">
                <div id="video-count-display" class="text-gray-600 font-medium"></div>
                <div id="pagination" class="flex gap-2"></div>
            </div>
        </div>
        <!-- Show Channel List -->
        <div id="channelModal" class="fixed top-0 left-78 bg-white shadow-2xl rounded-xl !p-4 hidden z-30000">
            <div id="channelModalHeader" class="text-2xl text-pink-800 font-bold border-b !pb-2 !mb-4 flex justify-between items-center">
                <span class="title">📺 Select a Channel</span>
                <span id="closeChList" class="text-lg cursor-pointer">❌</span>
            </div>
            <div id="channelListContent"></div>
        </div>
    `;

    searchBtn.onclick = function () {
        if (document.getElementById("searchWindow")) return;
        document.body.appendChild(searchLoader);

        const channelModal = document.getElementById("channelModal");
        makeDraggable(channelModal);

        document.getElementById("closeChList").onclick = function () {
            channelModal.classList.add("hidden");
        };

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
            channelModal.classList.toggle("hidden");
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
                const channelData = await channelRes.json();
                const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

                const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`);
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
                        .map((v) => {
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
                                        <h3 class="font-semibold text-gray-800 mb-2 text-sm">${v.snippet.title}</h3>
                                        <p class="text-gray-500 text-sm !mb-3">
                                            ⭐${formatViews(v.statistics.viewCount)} • ${formatDate(v.snippet.publishedAt)}<br>
                                            ⭐${getRelativeDate(v.snippet.publishedAt)}
                                        </p>
                                        <button data-id=${videoId} class="copy-btn cursor-pointer !px-2 !py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded">Copy ID</button>
                                        <button data-id="https://www.youtube.com/watch?v=${videoId}" class="copy-btn !px-2 !py-1 cursor-pointer text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded">Copy Link</button>
                                        <button data-id=${videoId} class="load-media-btn cursor-pointer text-sm !px-2 !py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded">Load Media</button>
                                    </div>
                                </div>`;
                        })
                        .join("");

                    // ✅ Bind event listeners for buttons
                    document.querySelectorAll(".copy-btn").forEach((btn) => {
                        btn.addEventListener("click", () => {
                            const id = btn.dataset.id;
                            copyVideoId(id, btn);
                        });
                    });

                    document.querySelectorAll(".load-media-btn").forEach((btn) => {
                        btn.addEventListener("click", () => {
                            const id = btn.dataset.id;
                            load_media_into_player(id);
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

        function formatViews(views) {
            const n = Number(views);
            if (n >= 1e6) return (n / 1e6).toFixed(1) + "M views";
            if (n >= 1e3) return (n / 1e3).toFixed(1) + "K views";
            return n + " views";
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            const day = date.toLocaleString("en-GB", { day: "2-digit" });
            const month = date.toLocaleString("en-GB", { month: "long" });
            const year = date.toLocaleString("en-GB", { year: "numeric" });
            return `📅${day}-${month}-${year}`;
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

        function copyVideoId(id, btn) {
            navigator.clipboard.writeText(id).then(() => {
                const original = btn.innerText;
                btn.innerText = "Copied!";
                btn.disabled = true;
                setTimeout(() => {
                    btn.innerText = original;
                    btn.disabled = false;
                }, 1200);
            });
        }

        function load_media_into_player(id) {
            const iframe = document.getElementById("youtubePlayer");
            const input = document.getElementById("videoInput");
            if (iframe && input) {
                input.value = id;
                iframe.src = `https://www.youtube.com/embed/${id}`;
            }
        }
    };
    //Render Channel List in Modal
    function renderChannelList(json) {
        const container = document.getElementById("channelListContent");

        // Responsive grid layout
        container.className = "grid gap-3 w-[350px] h-[700px] overflow-y-auto !pb-3 !pr-2 resize";
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
                    document.getElementById("channelIdInput").value = id;
                });

                card.appendChild(btn);
            });

            container.appendChild(card);
        }
    }
}
