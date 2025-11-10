if (!document.getElementById("stickyNote")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("styles/StickyNote.css");
    document.head.appendChild(link);

    const stn = document.createElement("div");
    stn.id = "stickyNote";
    stn.className = "sticky-note";
    stn.innerHTML = `
        <div class="pin-bar">
            <div class="pin title">📌StickyNote</div>
            <div class="buttons">
                <button id="minBtn">—</button>
                <button id="closeBtn">❌</button>
            </div>
        </div>
        <div class="menu-bar">
            <button class="menu-btn" title="Display list of notes">🗒️</button>
            <button class="menu-btn" title="Add new notes">➕</button>
            <button class="menu-btn" title="Save">💾</button>
            <button class="menu-btn" title="Select a emoji">🤪</button>
            <button class="menu-btn" title="insert objects">🔗</button>
            <button class="menu-btn" title="Options">⚙️</button>
        </div>
        <textarea class="note-content" placeholder="Write your note here..."></textarea>
    `;
    document.body.appendChild(stn);
    makeDraggable(stn);

    // ----- JavaScript for Emoji Menu -----
    const addEmojiBtn = document.querySelector('.menu-btn[title="Select a emoji"]');
    const emojiContainer = document.createElement("div");
    emojiContainer.id = "emojiContainer";
    document.body.appendChild(emojiContainer);

    addEmojiBtn.addEventListener("click", (e) => {
        const rect = addEmojiBtn.getBoundingClientRect();
        emojiContainer.style.top = rect.bottom + window.scrollY + "px";
        emojiContainer.style.left = rect.left + window.scrollX + "px";
        emojiContainer.style.display = emojiContainer.style.display === "none" ? "flex" : "none";

        // Populate emojis only once
        if (emojiContainer.innerHTML === "") {
            const emojis = loadSymbols();
            emojis.forEach((sym) => {
                const btn = document.createElement("button");
                btn.textContent = sym;
                btn.addEventListener("click", () => {
                    // Insert at cursor position
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    textarea.value = textarea.value.slice(0, start) + `${sym} ` + textarea.value.slice(end);
                    textarea.selectionStart = textarea.selectionEnd = start + sym.length + 1;
                    textarea.focus();
                    navigator.clipboard.writeText(`${sym} `);
                    emojiContainer.style.display = "none";
                });
                emojiContainer.appendChild(btn);
            });
        }
    });

    // Hide emoji container if clicked outside
    document.addEventListener("click", (e) => {
        if (!emojiContainer.contains(e.target) && e.target !== addEmojiBtn) {
            emojiContainer.style.display = "none";
        }
    });

    /* ---------- Globals / State ---------- */
    let currentNoteId = null; // id of the note currently shown in main UI (null => new note)
    let existingNote = null; // the last-loaded note object (keeps createdAt)

    const DB_NAME = "StickyNoteDB";
    const STORE_NAME = "notes";
    let db = null; // IndexedDB instance

    /* Main UI elements (assumed already present in DOM) */
    const note = document.getElementById("stickyNote");
    const textarea = note.querySelector(".note-content");
    const minBtn = document.getElementById("minBtn");
    const closeBtn = document.getElementById("closeBtn");
    const saveMenuBtn = document.querySelector('.menu-btn[title="Save"]'); // 💾 button
    const addMenuBtn = document.querySelector('.menu-btn[title="Add new notes"]'); // ➕ button
    const listMenuBtn = document.querySelector('.menu-btn[title="Display list of notes"]'); // 🗒️ button

    /* Track expanded height for minimize/restore */
    let prevHeight = note.offsetHeight || 490;

    /* ---------- IndexedDB Initialization ---------- */
    (function initDB() {
        const req = indexedDB.open(DB_NAME, 1);

        req.onerror = (e) => {
            console.error("IndexedDB open error:", e);
        };

        req.onsuccess = (e) => {
            db = e.target.result;
            // If the list window is open, refresh it
            if (document.getElementById("notesListWindow")) refreshNotesList();
        };

        req.onupgradeneeded = (e) => {
            db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };
    })();

    /* ---------- Utility Helpers ---------- */

    /** Safe HTML escape for table insertion */
    function escapeHtml(str) {
        return String(str || "")
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    /** Generate new unique id for notes (timestamp) */
    function genId() {
        return Date.now();
    }

    /* ---------- Save / Load Note Functions ---------- */

    /**
     * Save the current main note to IndexedDB.
     * If forcedTitle is provided, it will be used as note.title.
     * If currentNoteId is null, a new note will be created.
     */
    function saveNote(forcedTitle = null) {
        if (textarea.value.trim() === "") return;
        if (!db) {
            alert("Database not ready. Try again in a moment.");
            return;
        }

        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);

        const idToUse = currentNoteId || genId();
        const createdAt = existingNote?.createdAt || new Date().toISOString();
        const inferredTitle = (textarea.value || "").trim().split("\n")[0].slice(0, 60) || "Untitled Note";
        const title = forcedTitle !== null ? forcedTitle : inferredTitle;

        const payload = {
            id: idToUse,
            title: title,
            content: textarea.value,
            width: note.offsetWidth,
            prevHeight: prevHeight,
            currentHeight: note.offsetHeight,
            top: note.offsetTop,
            left: note.offsetLeft,
            minimized: textarea.style.display === "none",
            createdAt: createdAt,
            modifiedAt: new Date().toISOString(),
        };

        const req = store.put(payload);

        req.onsuccess = () => {
            currentNoteId = payload.id;
            existingNote = payload;
            // If list window is open, refresh it to show the saved note
            refreshNotesList();
        };

        req.onerror = (e) => {
            console.error("Failed to save note:", e);
            alert("Failed to save note. See console for details.");
        };
    }

    /**
     * Load a specific note by id from IndexedDB into the main UI.
     * Restores size, position, minimized state and content.
     */
    function loadNoteById(id) {
        if (!db) return;
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);

        req.onsuccess = () => {
            const data = req.result;
            if (!data) {
                alert("Note not found.");
                return;
            }

            currentNoteId = id;
            existingNote = data;

            // Set content & UI state
            textarea.value = data.content || "";
            note.style.width = (data.width || 480) + "px";
            prevHeight = data.prevHeight || prevHeight;

            if (data.minimized) {
                textarea.style.display = "none";
                note.style.height = "45px";
                note.style.resize = "none";
            } else {
                textarea.style.display = "block";
                note.style.height = (data.currentHeight || 490) + "px";
                note.style.resize = "both";
            }

            if (typeof data.top === "number") note.style.top = data.top + "px";
            if (typeof data.left === "number") note.style.left = data.left + "px";
        };

        req.onerror = (e) => console.error("Failed to load note:", e);
    }

    /* ---------- Notes List Window (UI) ---------- */

    /**
     * Create a draggable, resizable "Saved Notes" window that lists saved notes.
     * Clicking a title loads that note into main UI.
     */
    function createNotesListWindow() {
        // If already open, bring to front and refresh
        const existing = document.getElementById("notesListWindow");
        if (existing) {
            refreshNotesList();
            return;
        }

        // Build DOM
        const win = document.createElement("div");
        win.id = "notesListWindow";
        win.className = "notes-list-window";
        win.innerHTML = `
            <div class="title-bar">
                <div class="title">📋 Saved Notes</div>
                <div class="buttons">
                    <button id="minListBtn">—</button>
                    <button id="closeListBtn">❌</button>
                </div>
            </div>
            <div class="table-container">
                <table class="notes-table">
                    <thead>
                        <tr>
                            <th>SL</th>
                            <th>Title</th>
                            <th>Added</th>
                            <th>Last Modified</th>
                        </tr>
                    </thead>
                    <tbody id="notesTableBody"></tbody>
                </table>
            </div>
        `;

        document.body.appendChild(win);
        makeDraggable(win);

        // Controls
        const minBtn = win.querySelector("#minListBtn");
        const closeBtn = win.querySelector("#closeListBtn");
        const tableContainer = win.querySelector(".table-container");
        let listPrevHeight = win.offsetHeight || 300;

        // Minimize / restore
        minBtn.addEventListener("click", () => {
            if (tableContainer.style.display === "none") {
                tableContainer.style.display = "block";
                win.style.height = listPrevHeight + "px";
                win.style.resize = "both";
            } else {
                listPrevHeight = win.offsetHeight;
                tableContainer.style.display = "none";
                win.style.height = "45px";
                win.style.resize = "none";
            }
        });

        // Close
        closeBtn.addEventListener("click", () => win.remove());

        // Populate immediately (DB may not be ready; refreshNotesList is defensive)
        setTimeout(refreshNotesList, 80);
    }

    /**
     * Refreshes the notes table in the list window by reading all notes from DB.
     * Table body must use id="notesTableBody".
     */
    function refreshNotesList() {
        if (!db) {
            console.warn("DB not ready. refreshNotesList will retry later when DB is ready.");
            return;
        }

        const tableBody = document.querySelector("#notesTableBody");
        if (!tableBody) return; // list window not present

        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
            const notes = req.result || [];

            // Sort by modified date descending
            notes.sort((a, b) => (b.modifiedAt || 0) - (a.modifiedAt || 0));

            // Clear current rows
            tableBody.innerHTML = "";

            // Populate rows
            notes.forEach((n, i) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                <td>${i + 1}</td>
                <td class="title-cell">
                    <div class="title-wrapper">
                        <span class="note-title" data-id="${n.id}" style="cursor:pointer; color:#0077cc;">${escapeHtml(n.title || "Untitled")}</span>
                        <span class="delete-icon" title="Delete">⛔</span>
                    </div>
                </td>
                <td>${n.createdAt ? formatDateTime(new Date(n.createdAt)) : "-"}</td>
                <td>${n.modifiedAt ? formatDateTime(new Date(n.modifiedAt)) : "-"}</td>
            `;
                tableBody.appendChild(tr);
            });

            // Apply click handlers
            tableBody.querySelectorAll(".note-title").forEach((td) => {
                td.addEventListener("click", (e) => {
                    const idRaw = e.currentTarget.dataset.id;
                    const id = !isNaN(Number(idRaw)) ? Number(idRaw) : idRaw;
                    loadNoteById(id);
                    textarea.focus();
                });
            });

            tableBody.querySelectorAll(".delete-icon").forEach((icon) => {
                icon.addEventListener("click", (e) => {
                    const tr = e.currentTarget.closest("tr");
                    const noteId = tr.querySelector(".note-title").dataset.id;

                    if (confirm("Are you sure you want to delete this note?")) {
                        // Remove from IndexedDB
                        const tx = db.transaction(STORE_NAME, "readwrite");
                        const store = tx.objectStore(STORE_NAME);
                        store.delete(Number(noteId));

                        // Remove from UI
                        tr.remove();
                    }
                });
            });
        };

        req.onerror = (e) => console.error("Failed to read notes from DB:", e);
    }

    /* ---------- UI Wiring (buttons, new note, list) ---------- */

    // Save button (shows prompt for title, then saves)
    if (saveMenuBtn) {
        saveMenuBtn.addEventListener("click", () => {
            if (textarea.value.trim() === "") return;
            const suggested = textarea.value.trim().split("\n")[0] || existingNote?.title || "Untitled Note";
            const userTitle = prompt("Enter title for this note:", suggested.slice(0, 60));
            if (userTitle === null) return; // user cancelled
            saveNote(userTitle);
            alert("Note saved.");
        });
    } else {
        console.warn('Save button not found: .menu-btn[title="Save"]');
    }

    // Add new note (clear main UI)
    if (addMenuBtn) {
        addMenuBtn.addEventListener("click", () => {
            currentNoteId = null;
            existingNote = null;
            navigator.clipboard.writeText(textarea.value);
            textarea.value = "";
        });
    }

    // Show list window
    if (listMenuBtn) {
        listMenuBtn.addEventListener("click", () => {
            createNotesListWindow();
            // small delay then populate
            setTimeout(refreshNotesList, 120);
        });
    }

    /* Minimize main note button (stores prevHeight and toggles) */
    minBtn.addEventListener("click", () => {
        if (textarea.style.display === "none") {
            textarea.style.display = "block";
            note.style.height = prevHeight + "px";
            note.style.resize = "both";
        } else {
            prevHeight = note.offsetHeight;
            textarea.style.display = "none";
            note.style.height = "45px";
            note.style.resize = "none";
        }
    });

    /* Close main note (optional save then remove) */
    closeBtn.addEventListener("click", () => {
        saveNote();
        const list = document.getElementById("notesListWindow");
        if (list) list.remove();
        note.remove();
    });

    textarea.addEventListener("keydown", function (e) {
        if (e.key !== "Tab") return;
        e.preventDefault();

        const start = this.selectionStart;
        const end = this.selectionEnd;
        const value = this.value;

        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const lineEnd = value.indexOf("\n", end);
        const blockEnd = lineEnd === -1 ? value.length : lineEnd;

        // caret only
        if (start === end) {
            if (e.shiftKey) {
                // remove a leading tab at start of line if exists
                if (value.charAt(lineStart) === "\t") {
                    this.setRangeText("", lineStart, lineStart + 1, "end");
                    this.selectionStart = this.selectionEnd = start - 1;
                }
            } else {
                // insert tab
                this.setRangeText("\t", start, end, "end");
                // no manual cursor move → keep undo stack intact
            }
            return;
        }
        // multi-line
        const block = value.slice(lineStart, blockEnd);
        const lines = block.split("\n");

        if (e.shiftKey) {
            const newLines = lines.map((line) => (line.startsWith("\t") ? line.slice(1) : line));
            const replaced = newLines.join("\n");
            this.setRangeText(replaced, lineStart, blockEnd, "preserve");
        } else {
            const newLines = lines.map((line) => "\t" + line);
            const replaced = newLines.join("\n");
            this.setRangeText(replaced, lineStart, blockEnd, "preserve");
        }
    });
    //TODO:-------------for creating a shortcut for easy note-making---------------
    // Shortcut container (absolute, initially hidden)
    const shortcutMenu = document.createElement("div");
    shortcutMenu.id = "shortcutMenu";
    document.body.appendChild(shortcutMenu);

    const shortcuts = loadStickyNoteShortcuts();
    // Populate shortcut buttons
    shortcuts.forEach((obj) => {
        const label = Object.keys(obj)[0];
        const value = obj[label];

        const btn = document.createElement("button");
        btn.textContent = label; // shows label
        btn.title = value; // full text on hover

        btn.onclick = () => {
            // Copy to clipboard
            navigator.clipboard.writeText(value).catch((err) => console.error("Clipboard copy failed:", err));

            // Insert at cursor in textarea
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const textBefore = textarea.value.substring(0, start);
                const textAfter = textarea.value.substring(end);
                textarea.value = textBefore + value + textAfter;

                // Move cursor after inserted text
                textarea.selectionStart = textarea.selectionEnd = start + value.length;
                textarea.focus();
            }
            shortcutMenu.style.display = "none";
        };

        shortcutMenu.appendChild(btn);
    });

    // Toggle shortcut menu with a menu button
    const shortcutBtn = document.querySelector('.menu-btn[title="insert objects"]');
    shortcutBtn.addEventListener("click", () => {
        const rect = shortcutBtn.getBoundingClientRect();
        shortcutMenu.style.top = rect.bottom + "px";
        shortcutMenu.style.left = rect.left + "px";
        shortcutMenu.style.display = shortcutMenu.style.display === "grid" ? "none" : "grid";
    });

    // Hide shortcutMenu if clicked outside
    document.addEventListener("click", (e) => {
        if (!shortcutMenu.contains(e.target) && e.target !== shortcutBtn) {
            shortcutMenu.style.display = "none";
        }
    });
}
