function makeDraggable(el, calcNew = true) {
    let isDragging = false;
    let offsetX, offsetY;

    let titleBar = el.querySelector(".title") || el;
    titleBar.style.cursor = "grab";

    titleBar.addEventListener("mousedown", (e) => {
        if (e.target !== titleBar) return;

        isDragging = true;
        offsetX = e.clientX - el.offsetLeft;
        offsetY = e.clientY - el.offsetTop;
        document.body.style.userSelect = "none";
        titleBar.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        // Calculate new position with bounds
        let newLeft = e.clientX - offsetX;
        let newTop = e.clientY - offsetY;

        if (calcNew) [newLeft, newTop] = preventOffscreen(newLeft, newTop);

        el.style.left = `${newLeft}px`;
        el.style.top = `${newTop}px`;
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        document.body.style.userSelect = "";
        titleBar.style.cursor = "grab";
    });

    function preventOffscreen(newLeft, newTop) {
        newLeft = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, newLeft));
        newTop = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, newTop));
        return [newLeft, newTop];
    }
}

function closeWindow(elm, ui, interval, options = {}) {
    const { hideInstead = false } = options;

    elm.addEventListener("click", () => {
        if (hideInstead) {
            ui.style.display = "none"; // Just hide it
        } else {
            ui.remove(); // Remove it from DOM
        }
        if (interval) clearInterval(interval);
    });
}

function minimizeWindow(elm, ui) {
    elm.addEventListener("click", () => {
        ui.classList.toggle("minimized");
    });
}

function handleNavigation(ui) {
    if (!ui) return consoleLog("No scrollable UI passed to handleNavigation");

    let vh = ui === window ? window.innerHeight * 1.5 : ui.clientHeight * 2;

    const scrollToBottomBtn = document.getElementById("scrollToBottom");
    const scrollToTopBtn = document.getElementById("scrollToTop");
    const scrollDownBtn = document.getElementById("scrollDown");
    const scrollUpBtn = document.getElementById("scrollUp");

    if (scrollToBottomBtn) {
        scrollToBottomBtn.onclick = () => {
            const top = ui === window ? document.body.scrollHeight : ui.scrollHeight;
            ui.scrollTo({ top, behavior: "smooth" });
        };
    }
    if (scrollToTopBtn) {
        scrollToTopBtn.onclick = () => ui.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (scrollDownBtn) {
        scrollDownBtn.onclick = () => ui.scrollBy({ top: vh, behavior: "smooth" });
    }
    if (scrollUpBtn) {
        scrollUpBtn.onclick = () => ui.scrollBy({ top: -vh, behavior: "smooth" });
    }
}

function lookUpLinks() {
    return {
        "Google search": "https://www.google.com/search?q={search_term}",
        AI_Review: "https://www.google.com/search?q={search_term}&udm=50",
        "Cambridge dictionary": "https://dictionary.cambridge.org/dictionary/english/{search_term}",
        "Longman dictionary": "https://www.ldoceonline.com/dictionary/{search_term}",
        "Oxford dictionary": "https://www.oxfordlearnersdictionaries.com/definition/english/{search_term}",
        "Webster dictionary": "https://www.merriam-webster.com/dictionary/{search_term}",
        "Collins dictionary": "https://www.collinsdictionary.com/dictionary/english/{search_term}",
        "vocabulary.com": "https://www.vocabulary.com/dictionary/{search_term}",
        "just-the-word.com": "https://www.just-the-word.com/main.pl?word={search_term}&mode=combinations",
        "thesaurus.com": "https://www.thesaurus.com/browse/{search_term}",
        "dictionary.com": "https://www.dictionary.com/browse/{search_term}",
        "Youglish.com": "https://youglish.com/pronounce/{search_term}/english",
        "Image search": "https://www.google.com/search?tbm=isch&q={search_term}",
        "Video search": "https://www.google.com/search?tbm=vid&q={search_term}",
        "Google Map": "https://www.google.com/maps/place/{search_term}",
        Wikipedia: "https://en.wikipedia.org/wiki/{search_term}",
        "Youtube search": "https://www.youtube.com/results?search_query={search_term}",
        "Facebook search": "https://www.facebook.com/search/top/?q={search_term}",
        "News search": "https://www.google.com/search?tbm=nws&q={search_term}",
        "Pdf search": "https://www.google.com/search?q={search_term}&as_filetype=pdf",
        Downloadly: "https://downloadlynet.ir/?s={search_term}",
        GetIntoPC: "https://getintopc.com/?s={search_term}",
        TorrentEngine: "https://1337x.to/sort-search/{search_term}/time/desc/1/",
        "Book library": "https://www.libgen.is/search.php?req={search_term}",
        Github: "https://github.com/search?q={search_term}",
    };
}

function colorList() {
    return `
        <div class="color-swatch" data-color="#ffffff" style="background-color: #ffffff"></div>
        <div class="color-swatch" data-color="#000000" style="background-color: #000000"></div>
        <div class="color-swatch" data-color="#ff0000" style="background-color: #ff0000"></div>
        <div class="color-swatch" data-color="#fe3b00" style="background-color: #fe3b00"></div>
        <div class="color-swatch" data-color="#f43f5e" style="background-color: #f43f5e"></div>
        <div class="color-swatch" data-color="#ff0066" style="background-color: #ff0066"></div>
        <div class="color-swatch" data-color="#9f1239" style="background-color: #9f1239"></div>
        <div class="color-swatch" data-color="#4B0001" style="background-color: #4B0001"></div>
        <div class="color-swatch" data-color="#964B00" style="background-color: #964B00"></div>
        <div class="color-swatch" data-color="#BE5103" style="background-color: #BE5103"></div>
        <div class="color-swatch" data-color="#ffa500" style="background-color: #ffa500"></div>
        <div class="color-swatch" data-color="#ffff00" style="background-color: #ffff00"></div>
        <div class="color-swatch" data-color="#00ff00" style="background-color: #00ff00"></div>
        <div class="color-swatch" data-color="#009c1a" style="background-color: #009c1a"></div>
        <div class="color-swatch" data-color="#429A31" style="background-color: #429A31"></div>
        <div class="color-swatch" data-color="#84cc16" style="background-color: #84cc16"></div>
        <div class="color-swatch" data-color="#365314" style="background-color: #365314"></div>
        <div class="color-swatch" data-color="#134e4a" style="background-color: #134e4a"></div>
        <div class="color-swatch" data-color="#12c1ed" style="background-color: #12c1ed"></div>
        <div class="color-swatch" data-color="#00ffff" style="background-color: #00ffff"></div>
        <div class="color-swatch" data-color="#050372" style="background-color: #050372"></div>
        <div class="color-swatch" data-color="#0000ff" style="background-color: #0000ff"></div>
        <div class="color-swatch" data-color="#0047ab" style="background-color: #0047ab"></div>
        <div class="color-swatch" data-color="#2B0057" style="background-color: #2B0057"></div>
        <div class="color-swatch" data-color="#51158C" style="background-color: #51158C"></div>
        <div class="color-swatch" data-color="#7F00FF" style="background-color: #7F00FF"></div>
        <div class="color-swatch" data-color="#6601ff" style="background-color: #6601ff"></div>
        <div class="color-swatch" data-color="#B163FF" style="background-color: #B163FF"></div>
        <div class="color-swatch" data-color="#cb00cc" style="background-color: #cb00cc"></div>
        <div class="color-swatch" data-color="#ff00ff" style="background-color: #ff00ff"></div>
        <div class="color-swatch" data-color="#cc00ff" style="background-color: #cc00ff"></div>
    `;
}

function consoleLog(log) {
    chrome.runtime.sendMessage({ action: "logMessage", msg: log });
}

/**API functions */
// Global reusable function to check for YouTube API errors
async function handleYouTubeApiError(res) {
    if (res.ok) return false; // No error, caller can continue

    let errorMsg = "❌ An error occurred.";
    try {
        const data = await res.json();
        const err = data?.error;

        if (err?.errors?.some((e) => e.reason === "quotaExceeded")) {
            errorMsg = "🚫 YouTube API quota exceeded. Please try again later.";
        } else if (err?.message) {
            errorMsg = `❌ ${err.message}`;
        }
    } catch (e) {
        errorMsg = `❌ Error parsing response: ${e.message}`;
    }

    displayError(errorMsg);
    return true; // Error was handled
}

// Optional: Utility function to display the error visibly
function displayError(msg) {
    const box = document.createElement("div");
    box.textContent = msg;
    box.style = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: #ffdddd;
        color: #900;
        padding: 10px 20px;
        border: 1px solid #f00;
        border-radius: 8px;
        z-index: 9999;
        font-family: sans-serif;
        font-weight: bold;
    `;
    document.body.appendChild(box);

    setTimeout(() => box.remove(), 5000); // Auto-remove after 5 sec
}

//* Copy text of anything
function copyId(id, btn) {
    navigator.clipboard.writeText(id).then(() => {
        const original = btn.innerText;
        btn.innerText = "Copied";
        btn.disabled = true;
        setTimeout(() => {
            btn.innerText = original;
            btn.disabled = false;
        }, 1200);
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.toLocaleString("en-GB", { day: "2-digit" });
    const month = date.toLocaleString("en-GB", { month: "long" });
    const year = date.toLocaleString("en-GB", { year: "numeric" });
    return `📅${day}-${month}-${year}`;
}

function formatDateTime(isoString) {
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // convert to 12-hour format
    hours = String(hours).padStart(2, "0");

    return `${day}-${month}-${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
}

function getUniqueFileName() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = String(now.getFullYear());
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
}

function parseNumber(v) {
    return parseInt(v, 10) || 0;
}

function formatViews(v) {
    const n = parseNumber(v);
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return v;
}

function loadSymbols() {
    return [
        "✔️",
        "✅",
        "☑️",
        "➡️",
        "⬅️",
        "⬆️",
        "⬇️",
        "🟩",
        "🟥",
        "🟦",
        "✿",
        "❀",
        "✷",
        "𖤐",
        "𖤓",
        "✩",
        "✦",
        "—",
        "➜",
        "➔",
        "➨",
        "➜",
        "▶",
        "⇒",
        "⟹",
        "★",
        "🔹",
        "🔶",
        "⭐",
        "❌",
        "🪰",
        "🪳",
        "🕷️",
        "🦋",
        "🦉",
        "🐧",
        "🏵️",
        "🪲",
        "1️⃣",
        "2️⃣",
        "3️⃣",
        "4️⃣",
        "5️⃣",
        "6️⃣",
        "7️⃣",
        "8️⃣",
        "9️⃣",
        "🔟",
        "❤️",
        "🧡",
        "💛",
        "💚",
        "💙",
        "💜",
    ];
}

function loadStickyNoteShortcuts() {
    const colorPalletes = () => {
        let colorString = "## ";
        const colorNames = [
            "black",
            "dimgray",
            "slategray",
            "darkslategray",
            "darkgray",
            "navy",
            "royalblue",
            "steelblue",
            "teal",
            "darkcyan",
            "maroon",
            "firebrick",
            "brown",
            "saddlebrown",
            "indianred",
            "darkolivegreen",
            "seagreen",
            "forestgreen",
            "darkgreen",
            "indigo",
            "rebeccapurple",
            "darkmagenta",
            "purple",
        ];

        // Build markdown with color spans separated by |
        colorString += colorNames.map((name) => `<span style="color:${name}">${name}</span>`).join(" | ");

        return colorString;
    };

    return [
        {
            header: `——————————————————————————————\n      title\n——————————————————————————————`,
        },
        {
            EqualsHeader: `======================\n      title\n======================`,
        },
        { "h-line": "——————————————————————————" },
        { "tab⟹": "\t⟹ " },
        { "tab➜": "\t➜ " },
        { "tab★": "\t★ " },
        {
            "v-line": `|\n|\n|\n|\n|`,
        },
        {
            "double-v-line": `||\n||\n||\n||\n||`,
        },
        { stars1: "★★★★★★★★★★★★★★★★★" },
        { stars2: "✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦" },
        { "@@@@@": "@@@@@@@@@@@@@@@@@@@@@@@@@@@" },
        { hash: "###########################" },
        { dashes: "-------------------------------------" },
        { equals: "=====================================" },
        { dots: "......................................." },
        { "arrow-line": "➜➜➜➜➜➜➜➜➜➜➜➜➜➜➜➜➜➜➜➜➜" },
        { "boxed-line": "+---------------------------------+" },
        {
            "HTML-list": `<ul style="list-style-type: '➜ '; padding-left: 50px; color: darkblue; font-size: 25px; font-weight: bold">
    <li>list one</li>
    <li>list two</li>
    <li>list three</li>
    <li>list four</li>
    <li>list five</li>
</ul>`,
        },
        {
            WordDefinition: `<span style='color: indigo; font-weight: bold;'>🪰 word ➜&nbsp;</span>meaning</span>`,
        },
        {
            colors: colorPalletes(),
        },
    ];
}

function htmlPreset() {
    return {
        BlockSpan: ["<span style='display: block;'", "</span>"],
        list: ["<span style='display: block;'>&ensp;&ensp;➜ ", "</span>"],
        BlueBold: ["<span style='color: blue; font-weight: bold;'>", "</span>"],
        GreenBold: ["<span style='color: green; font-weight: bold;'>", "</span>"],
        TextBlue: ["<span style='color: blue; '>", "</span>"],
        TextGreen: ["<span style='color: green; '>", "</span>"],
        Bold: ["<span style='font-weight: bold;'>", "</span>"],
        heading: [
            "<h2 style='text-align: center; padding: 5px; border-top: 3px solid tomato; border-bottom: 3px solid tomato; color: blue; margin: 50px;'>",
            "</h2>",
        ],
        ParaHead: ["<p style='color: darkmagenta; font-weight: bold; font-size: 25px;'>", "</p>"],
    };
}
