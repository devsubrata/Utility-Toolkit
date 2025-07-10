// for look a terms from various links
if (!document.getElementById("searchBar")) {
    const search_links = lookUpLinks();

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("styles/search.css");
    document.head.appendChild(link);

    const searchDiv = document.createElement("div");
    searchDiv.id = "searchBar";
    searchDiv.innerHTML = `
        <div id="search-modal" class="search-modal">
            <select id="search_options"></select>
            <input type="text" id="searchInput" placeholder="Enter a word...">
            <button id="searchButton">🔍</button>
            <button id="clearSearchInput">Clear</button>
            <input type="checkbox" id="newTab" title="Open in new tab">
            <button id="closeSearchModal">❌</button>
        </div>
    `;

    document.body.appendChild(searchDiv);

    // Populate the select element
    const search_options = document.getElementById("search_options");
    Object.keys(search_links).forEach((key) => {
        const option = document.createElement("option");
        option.value = search_links[key];
        option.textContent = key;
        if (key === "Oxford dictionary") option.selected = true;
        search_options.appendChild(option);
    });

    const search_modal = document.getElementById("search-modal");
    search_modal.style.display = "flex";

    const searchBtn = document.getElementById("searchButton");
    searchBtn.replaceWith(searchBtn.cloneNode(true));

    const searchInput = document.getElementById("searchInput");
    const newSearchBtn = document.getElementById("searchButton");

    function searchTerm() {
        const link = search_options.value;
        const searchTerm = searchInput.value.trim();

        if (!searchTerm) {
            alert("No input for search");
            return;
        }
        const url = link.replace("{search_term}", searchTerm);
        const isNewTabChecked = document.getElementById("newTab").checked;

        if (isNewTabChecked) window.open(url, "_blank");
        else openOnRightHalf(url);
    }
    newSearchBtn.addEventListener("click", searchTerm);
    searchInput.onkeydown = (e) => {
        if (e.key === "Enter") searchTerm();
    };

    document.getElementById("clearSearchInput").addEventListener("click", () => {
        document.getElementById("searchInput").value = "";
    });

    makeDraggableR(document.getElementById("search-modal"));
    closeWindow(searchDiv.querySelector("#closeSearchModal"), searchDiv, null);
}

function openOnRightHalf(url) {
    const laptopWidth = 1920; // Width of your laptop screen
    const lgScreenWidth = 2560; // Width of LG monitor
    const halfLgWidth = lgScreenWidth / 2;
    const left = laptopWidth + halfLgWidth; // Start at middle of LG screen
    const top = 0;
    const width = 930;
    const height = 1200;

    const win = window.open(url, "_blank", `width=${width},height=${height},left=${left},top=${top}`);

    // Optional moveTo fallback (may work in some browsers)
    setTimeout(() => {
        try {
            win.moveTo(left, top);
            win.resizeTo(width, height);
        } catch (e) {
            console.warn("Browser blocked moveTo:", e);
        }
    }, 100);
}
