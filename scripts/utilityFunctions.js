//TODO:----------------Different Cursor------------------
function highlighterCursor(height, color = "rgba(255,255,0,0.7)") {
    const width = 16;
    const padding = 2;
    const strokeWidth = 4;

    const svgHeight = height + padding * 2;
    const rectX = width / 2 - strokeWidth / 2;
    const rectY = padding;

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${svgHeight}">
            <rect x="${rectX}"
                    y="${rectY}"
                    width="${strokeWidth}"
                    height="${height}"
                    rx="2" ry="2"
                    fill="${color}" />
        </svg>
    `.trim();

    const encoded = encodeURIComponent(svg);
    return `url("data:image/svg+xml;utf8,${encoded}") ${width / 2} ${rectY}, text`;
}
function lineCursor(strokeWidth = 2, color = "#000") {
    const size = 32;

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size * 3}" height="${size}" viewBox="0 0 ${size * 3} ${size}">
            <path d="
                M ${strokeWidth / 2} ${strokeWidth / 2} 
                V ${size * (1 / 2) - strokeWidth / 2} 
                M ${strokeWidth / 2} ${strokeWidth / 2} 
                H ${size * 1.5 - strokeWidth / 2}
            " 
                fill="none" 
                stroke="${color}" 
                stroke-width="${strokeWidth}" 
                stroke-linecap="square" 
                stroke-linejoin="miter"/>
        </svg>`.trim();

    return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '") 0 0, crosshair';
}
function rectCursor(fillColor, strokeColor, strokeWidth) {
    const size = 24; // fixed fill size
    const total = size + strokeWidth;

    const offset = strokeWidth / 2;

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${total}" viewBox="0 0 ${total} ${total}">
            <rect
                x="${offset}"
                y="${offset}"
                width="${(size * 2) / 3}"
                height="${(size * 1) / 2}"
                fill="${fillColor}"
                stroke="${strokeColor}"
                stroke-width="${strokeWidth * 0.6}"
                shape-rendering="crispEdges"
            />
        </svg>`.trim();
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") 0 0, crosshair`;
}
function solidRectCursor(color = "#ffd54f") {
    const width = 24;
    const height = 16;

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg"
            width="${width}"
            height="${height}"
            viewBox="0 0 ${width} ${height}">
        <rect x="0" y="0"
                width="${width}"
                height="${height}"
                fill="${color}" />
        </svg>
        `.trim();
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") 0 0, crosshair`;
}
function infiniteCrossCursor(canvas, color = "red", stroke = 1) {
    // prevent duplicates
    if (document.getElementById("crosshair")) return;

    const crosshair = document.createElement("div");
    crosshair.id = "crosshair";
    crosshair.innerHTML = `
        <div class="vline"></div>
        <div class="hline"></div>
    `;
    document.body.appendChild(crosshair);

    const vline = crosshair.querySelector(".vline");
    const hline = crosshair.querySelector(".hline");

    vline.style.background = hline.style.background = color;
    vline.style.width = stroke + "px";
    hline.style.height = stroke + "px";

    canvas.addEventListener("mouseenter", () => {
        crosshair.style.display = "block";
        canvas.classList.add("crosshair-active");
    });

    canvas.addEventListener("mouseleave", () => {
        crosshair.style.display = "none";
        canvas.classList.remove("crosshair-active");
    });

    canvas.addEventListener("mousemove", (e) => {
        // viewport coordinates (IMPORTANT)
        vline.style.left = e.clientX + "px";
        hline.style.top = e.clientY + "px";
    });
}

//TODO:----------------resize & move window------------------
function resizeLeftHalf(win) {
    win.style.top = "0px";
    win.style.left = "0px";
    win.style.width = window.innerWidth / 2 + "px";
    win.style.height = window.innerHeight - 10 + "px";
}
function resizeTopLeft(win) {
    win.style.top = "0px";
    win.style.left = "0px";
    win.style.width = window.innerWidth / 2 + "px";
    win.style.height = window.innerHeight / 2 + "px";
}
function resizeBottomLeft(win) {
    win.style.top = window.innerHeight / 2 - 10 + "px";
    win.style.left = "0px";
    win.style.width = window.innerWidth / 2 + "px";
    win.style.height = window.innerHeight / 2 + "px";
}
function resizeRightHalf(win) {
    win.style.top = "0px";
    win.style.left = window.innerWidth / 2 - 17 + "px";
    win.style.width = window.innerWidth / 2 + "px";
    win.style.height = window.innerHeight - 10 + "px";
}
function resizeTopRight(win) {
    win.style.top = "0px";
    win.style.left = window.innerWidth / 2 - 17 + "px";
    win.style.width = window.innerWidth / 2 + "px";
    win.style.height = window.innerHeight / 2 + "px";
}
function resizeBottomRight(win) {
    win.style.top = window.innerHeight / 2 - 10 + "px";
    win.style.left = window.innerWidth / 2 - 17 + "px";
    win.style.width = window.innerWidth / 2 + "px";
    win.style.height = window.innerHeight / 2 + "px";
}

//TODO:----------------add drag feature------------------
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

function hexToRgb(hex) {
    hex = hex.replace("#", "").trim();

    // Handle shorthand (#abc)
    if (hex.length === 3) {
        hex = hex
            .split("")
            .map((c) => c + c)
            .join("");
    }

    if (hex.length !== 6) {
        throw new Error("Invalid hex color");
    }

    const num = parseInt(hex, 16);

    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
    };
}

function getImageScale() {
    const input = prompt("Enter image scale (e.g., 0.5, 1, 2):", "1");
    const parsed = parseFloat(input);
    let imageScale;
    if (!isNaN(parsed) && parsed > 0) {
        imageScale = parsed;
    } else {
        alert("Invalid scale value. Using default (1).");
        imageScale = 1;
    }
    return imageScale;
}

function enableCanvasImagePaste({ canvas, ctx, isEnabled, clickPosition }) {
    async function onPaste(e) {
        if (!isEnabled) return;

        const items = e.clipboardData?.items || [];
        const scale = getImageScale();

        for (const item of items) {
            if (!item.type.startsWith("image")) continue;

            const blob = item.getAsFile();
            const img = new Image();

            img.onload = () => {
                const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
                startDraggablePreview({
                    canvas,
                    ctx,
                    image: img,
                    scale,
                    startPos: { ...clickPosition },
                    snapshot,
                });
            };

            img.src = URL.createObjectURL(blob);
            break;
        }
    }

    window.addEventListener("paste", onPaste);

    return {
        destroy() {
            window.removeEventListener("paste", onPaste);
        },
    };
}

function startDraggablePreview({ canvas, ctx, image, scale, startPos, snapshot }) {
    let x = startPos.x;
    let y = startPos.y;
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const w = image.width * scale;
    const h = image.height * scale;

    function draw() {
        ctx.putImageData(snapshot, 0, 0);
        ctx.drawImage(image, x, y, w, h);

        ctx.save();
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
    }

    function inside(px, py) {
        return px >= x && px <= x + w && py >= y && py <= y + h;
    }

    function getMouse(ev) {
        const r = canvas.getBoundingClientRect();
        return {
            x: ev.clientX - r.left,
            y: ev.clientY - r.top,
        };
    }

    function onDown(ev) {
        const { x: mx, y: my } = getMouse(ev);
        if (!inside(mx, my)) return;

        dragging = true;
        offsetX = mx - x;
        offsetY = my - y;
        canvas.style.cursor = "grabbing";
    }

    function onMove(ev) {
        const { x: mx, y: my } = getMouse(ev);

        if (!dragging) {
            canvas.style.cursor = inside(mx, my) ? "grab" : "default";
            return;
        }

        x = mx - offsetX;
        y = my - offsetY;
        draw();
    }

    function onUp() {
        dragging = false;
        canvas.style.cursor = "grab";
    }

    function onKey(ev) {
        if (ev.key === "Enter") {
            ctx.putImageData(snapshot, 0, 0);
            ctx.drawImage(image, x, y, w, h);
            cleanup();
        }

        if (ev.key === "Escape") {
            ctx.putImageData(snapshot, 0, 0);
            cleanup();
        }
    }

    function cleanup() {
        canvas.removeEventListener("mousedown", onDown);
        canvas.removeEventListener("mousemove", onMove);
        canvas.removeEventListener("mouseup", onUp);
        window.removeEventListener("keydown", onKey);
        canvas.style.cursor = "default";
    }

    draw();
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseup", onUp);
    window.addEventListener("keydown", onKey);
}

function colorList() {
    const colors = [
        "#ffa500",
        "#dcb909",
        "#cbd902",
        "#84cc16",
        "#b7fa00",
        "#00faaf",
        "#12c1ed",
        "#00ffff",
        "#ffffff",
        "#000000",
        "#ff0000",
        "#fe3b00",
        "#f43f5e",
        "#ff0066",
        "#9f1239",
        "#4B0001",
        "#B163FF",
        "#ffff00",
        "#964B00",
        "#BE5103",
        "#00ff00",
        "#009c1a",
        "#365314",
        "#134e4a",
        "#050372",
        "#0000ff",
        "#0047ab",
        "#2B0057",
        "#51158C",
        "#7F00FF",
        "#6601ff",
        "#cb00cc",
        "#ff00ff",
        "#cc00ff",
    ];
    let colorGrid = "";
    colors.forEach((color) => {
        colorGrid += `<div class="color-swatch" data-color="${color}" style="background-color: ${color}"></div>`;
    });
    return (
        colorGrid +
        `
        <div style="display:flex; justify-content:center; align-items:center;">
            <input type="color" class="html-color-input" value="#ff0000">
        </div>
        `
    );
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
            WordDefinition: `<span style='display:block;'><span style='font-weight:bold; color:maroon;'>🪰 word ➜ </span>definition</span>`,
        },
        {
            colors: colorPalletes(),
        },
    ];
}

function htmlPreset() {
    return {
        BlockSpan: ["<span style='display: block;'>", "</span>"],
        ListHead: ["<span style='color: darkmagenta; font-weight: bold; font-size: 23px; display: block;'>", "</span>"],
        list: ["<span style='display: block;'>&ensp;&ensp;➜ ", "</span>"],
        BlueBold: ["<span style='color: blue; font-weight: bold;'>", "</span>"],
        GreenBold: ["<span style='color: green; font-weight: bold;'>", "</span>"],
        TextBlue: ["<span style='color: blue; '>", "</span>"],
        TextGreen: ["<span style='color: green; '>", "</span>"],
        Bold: ["<span style='font-weight: bold;'>", "</span>"],
        Link: [`<a style="text-decoration:none; color:teal;" href="#" target="_blank">`, `</a>`],
        heading: [
            "<h2 style='text-align: center; padding: 5px; border-top: 3px solid tomato; border-bottom: 3px solid tomato; color: blue; margin: 50px;'>",
            "</h2>",
        ],
        ParaHead: ["<p style='color: darkmagenta; font-weight: bold; font-size: 25px;'>", "</p>"],
    };
}
