if (!document.getElementById("annotationToolbar")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("styles/annotate.css");
    document.head.appendChild(link);

    const annotationDiv = document.createElement("div");
    annotationDiv.id = "annotationToolbar";
    annotationDiv.classList.add("glassy");
    annotationDiv.innerHTML = `
        <div class="gui-sizes">
            <input type="radio" id="size1" name="size" value="1" checked title="one-row-toolbar"/>
            <input type="radio" id="size2" name="size" value="2" title="three-row-toolbar"/>
            <input type="radio" id="size3" name="size" value="3" title="two-column-toolbar" />
            <input type="radio" id="size4" name="size" value="4" title="three-column-toolbar"/>
            <input type="radio" id="size5" name="size" value="5" title="four-row-toolbar" />
            <input type="radio" id="size6" name="size" value="6" title="two-row-toolbar" />
        </div>
        <div id="activeColor" title="Active Color"></div>
        <div id="togglePreset" title="Toggle preset">P</div>
        <div class="color-picker"></div>
        <div class="color-picker"></div>
        <div class="highlight_div">
            <button id="highlight" title="Highlight Text">🎨</button>
            <input type="number" id="highlighterSize" min="10" max="50" value="20" step="5"/>
        </div>
        <button id="filledRectangle" title="Filled rectangle">🟫</button>
        <div class="line_div">
            <button id="lines" title="draw line">―</button>
            <select id="line-select" title="select line patterns">
                <option value="H-line">―</option>
                <option value="V-line">┃</option>
                <option value="I-line">⸝⸝</option>
            </select>
        </div>
        <button id="rectangle" title="Rectangle">▭</button>
        <button id="circle" title="Circle">◯</button>
        <button id="brush" title="Brush">🖌️</button>
        <select id="line-type" class="line-type" title="Select line type"></select>
        <input type="number" id="brushSize" title="Adjust line, rect, brush, circle, stroke-width" min="1" max="50" value="2" />
        <button id="typeText" title="Add text">T</button>
        <button id="insertImage" title="Insert Image">🖼️</button>
        <div class="undo_redo">
            <button id="undo" title="undo">↪️</button>
            <button id="redo" title="redo">↩️</button>
        </div>
        <div class="opacity_control">
            <label for="opacity">🌓</label>
            <input type="number" title="Adjust opacity" id="opacity" min="0.00" max="1.00" step="0.05" value="1" />
        </div>
        <button id="miniTextTool" title="Mini text tool">𝐓</button>
        <button id="filledCircle" title="Filled circle">⚫</button>
        <button id="eraser" title="Erase" class="active">𝐄</button>
        <div class="save-menu">
            <button class="save-menu-btn" title="More options">☰</button>
            <div class="menu-content">
                <button id="borderedRectangle" title="Bordered Rectangle">▭</button>
                <button id="borderedCircle" title="Bordered Circle">◯</button>
                <button id="color_detector" title="Pick color from canvas">🔥</button>
                <button id="save" title="Take Snapshot">📸</button>
                <button id="saveLayer" title="Save layers">💾</button>
                <button id="restoreLayer" title="Restore layers">📂</button>
                <button id="clear" title="Erase everything">🆑</button>
                <button id="placeBottom" title="place bottom">🗕</button>
                <button id="exit">❌</button>
            </div>
        </div>
        <input type="file" id="fileInput" accept="image/png" style="display:none">
    `;

    document.body.appendChild(annotationDiv);
    makeDraggable(annotationDiv, false);

    const textModal = document.createElement("div");
    textModal.id = "modal";
    textModal.classList.add("modal");
    textModal.innerHTML = `
        <div id="modal-header" class="title">
            <select id="font-select">
                <option value="Arial">Arial</option>
                <option value="sans-serif">Sans Serif</option>
                <option value="serif">Serif</option>
                <option value="monospace">Monospace</option>
                <option value="Roboto Slab">Roboto slab</option>
                <option value="Garamond">Garamond</option>
                <option value="Georgia">Georgia</option>
                <option value="Tahoma">Tahoma</option>
                <option value="Open Sans">Open sans</option>
                <option value="Nunito Sans" selected>Nunito Sans</option>
                <option value="Nunito">Nunito</option>
                <option value="Verdana">Verdana</option>
            </select>
            <div class="text-color-picker"></div>
            <input type="number" title="Font Size" id="font-size" min="10" max="100" step="2" value="25"/>
            <input type="number" title="add font angle" id="rotation-input" value="0" step="10" min="-360" max="360">
            ${create_bullet_menu()}
            <button id="addBullet">Add Marker</button>
            <div class="text-style">
                <label style="display: inline-flex; align-items: center; gap: 3px;">
                    <input type="checkbox" id="bold-check">
                    <span>Bold</span>
                </label>
                <label style="display: inline-flex; align-items: center; gap: 3px;">
                    <input type="checkbox" id="italic-check">
                    <span>Italic</span>
                </label>
            </div>
            <button id="closeModal">X</button>
        </div>
        <textarea id="textInput" placeholder="Add note..." autofocus></textarea>
        <div id="submit_block">
            <p>Word Count:&nbsp;<span id="wc">0</span></p>
            <div>
                <button id="clearText">Clear</button>
                <button id="submitText">Add Text</button>
            </div>
        </div>
    `;
    document.body.appendChild(textModal);
    bullet_menu_listener();
    makeDraggable(textModal, false);

    const colors = `
            <div class="color-picker-button" title="Color Picker"></div>
            <div class="color-swatches">
                ${colorList()}
            </div>
    `;

    const colorPickers = document.querySelectorAll(".color-picker");
    colorPickers.forEach((colorPicker) => {
        colorPicker.innerHTML = colors;
    });

    injectCanvas();
    expandCanvasArea();
    createNavigation();

    document.getElementById("exit")?.addEventListener("click", () => {
        if (!confirm("Are you sure to close?")) return;

        ["drawingCanvas", "annotationToolbar", "expand_canvas", "bottomNavBar"].forEach((id) => {
            document.getElementById(id)?.remove();
        });
    });
}

function create_bullet_menu() {
    return `
        <div class="custom-select">
            <div id="bullet" class="selected" data-value="⭐">⭐</div>
            <div class="options-menu">
                <div class="category-row">
                    <span class="option" data-value="✅">✅</span>
                    <span class="option" data-value="☑️">☑️</span>
                    <span class="option" data-value="✔️">✔️</span>
                    <span class="option" data-value="🗸">🗸</span>
                </div>
                <div class="category-row">
                    <span class="option" data-value="➡️">➡️</span>
                    <span class="option" data-value="⬅️">⬅️</span>
                    <span class="option" data-value="⬆️">⬆️</span>
                    <span class="option" data-value="⬇️">⬇️</span>
                </div>
                <div class="category-row">
                    <span class="option" data-value="✿">✿</span>
                    <span class="option" data-value="❀">❀</span>
                    <span class="option" data-value="✷">✷</span>
                    <span class="option" data-value="𖤐">𖤐</span>
                    <span class="option" data-value="𖤓">𖤓</span>
                    <span class="option" data-value="✩">✩</span>
                    <span class="option" data-value="✦">✦</span>
                </div>
                <div class="category-row">
                    <span class="option" data-value="🟣">🟣</span>
                    <span class="option" data-value="🔴">🔴</span>
                    <span class="option" data-value="🟠">🟠</span>
                    <span class="option" data-value="🟡">🟡</span>
                    <span class="option" data-value="🟢">🟢</span>
                    <span class="option" data-value="🔵">🔵</span>
                </div>
                <div class="category-row">
                    <span class="option" data-value=" ⇒ ">⇒</span>
                    <span class="option" data-value=" ➜ ">➜</span>
                    <span class="option" data-value=" ★ ">★</span>
                    <span class="option" data-value=" — ">—</span>
                    <span class="option" data-value="🔹">🔹</span>
                </div>
                <div class="category-row">
                    <span class="option" data-value="     — ">tab—</span>
                    <span class="option" data-value="     ⇒ ">tab⟹</span>
                    <span class="option" data-value="     ➜ ">tab➜</span>
                    <span class="option" data-value="     ★ ">tab★</span>
                    <span class="option" data-value="     🔹">tab🔹</span>
                    <span class="option" data-value="     ">5 Space</span>
                    <span class="option" data-value="          ">10 Space</span>
                </div>
                <div class="category-row">
                    <span class="option" data-value="🔶">🔶</span>
                    <span class="option" data-value="⭐">⭐</span>
                    <span class="option" data-value="🔹">🔹</span>
                    <span class="option" data-value="❌">❌</span>
                    <span class="option" data-value="🔢">🔢</span>
                    <span class="option" data-value="ABC">ABC</span>
                    <span class="option" data-value="abc">abc</span>
                </div>
                <div class="category-row">
                    <span class="option" data-value="🪰">🪰</span>
                    <span class="option" data-value="🪳">🪳</span>
                    <span class="option" data-value="🕷️">🕷️</span>
                    <span class="option" data-value="🦋">🦋</span>
                    <span class="option" data-value="🦉">🦉</span>
                    <span class="option" data-value="🐧">🐧</span>
                    <span class="option" data-value="🏵️">🏵️</span>
                    <span class="option" data-value="🪲">🪲</span>
                </div>
            </div>
        </div>
    `;
}

function bullet_menu_listener() {
    const selected = document.querySelector(".selected");
    const menu = document.querySelector(".options-menu");
    const options = document.querySelectorAll(".option");

    selected.addEventListener("click", () => {
        menu.style.display = menu.style.display === "block" ? "none" : "block";
    });

    options.forEach((option) => {
        option.addEventListener("click", () => {
            selected.textContent = option.textContent;
            selected.setAttribute("data-value", option.getAttribute("data-value"));
            menu.style.display = "none";
            console.log(`You selceted: "${selected.getAttribute("data-value")}"`);
        });
    });

    document.addEventListener("click", (e) => {
        if (!document.querySelector(".custom-select").contains(e.target)) {
            menu.style.display = "none";
        }
    });
}

function injectCanvas() {
    let canvas = document.createElement("canvas");
    canvas.id = "drawingCanvas";
    document.body.appendChild(canvas);

    function setupCanvas() {
        canvas.width = document.documentElement.scrollWidth;
        canvas.height = document.documentElement.scrollHeight;
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.zIndex = "9999";
        canvas.style.pointerEvents = "auto";
        canvas.style.backgroundColor = "transparent";
    }
    setupCanvas();

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const brushSizeInput = document.getElementById("brushSize");

    //TODO:-------------- Tools------------------------
    const tools = {
        brush: document.getElementById("brush"),
        highlighter: document.getElementById("highlight"),
        lines: document.getElementById("lines"),
        rectangle: document.getElementById("rectangle"),
        filledRectangle: document.getElementById("filledRectangle"),
        borderedRectangle: document.getElementById("borderedRectangle"),
        typeText: document.getElementById("typeText"),
        miniTextTool: document.getElementById("miniTextTool"),
        pasteImage: document.getElementById("insertImage"),
        eraser: document.getElementById("eraser"),
        eyeDropperTool: document.getElementById("color_detector"),
        circle: document.getElementById("circle"),
        filledCircle: document.getElementById("filledCircle"),
        borderedCircle: document.getElementById("borderedCircle"),
    };

    let painting = false;
    let isTyping = false;
    let isPasting = false;
    let brushSize = 2;
    let highlighterSize = 20;
    let opacity = 1.0;
    let color1 = `rgba(255,255,255,${opacity})`;
    let color2 = `rgba(255, 165, 0, 0.3)`;
    let textColor = `#000000`;
    let currentTool = "eraser";
    let startX, startY;
    let snapshot; // Store canvas state before drawing a rectangle
    const undoStack = [];
    const redoStack = [];

    const [colorPicker1, colorPicker2] = document.querySelectorAll(".color-picker");
    colorPicker1.children[0].style.backgroundColor = color1;
    colorPicker2.children[0].style.backgroundColor = `rgba(255, 165, 0, 1)`;

    // pupulate line type
    function populateLineType() {
        const lineDict = {
            "────": "[]",
            "5,5": "[5, 5]",
            "10,5": "[10, 5]",
            "10,8": "[10, 8]",
            "10,10": "[10, 10]",
            "20,10": "[20, 10]",
            "20,15": "[20, 15]",
        };
        const lineContainer = document.getElementById("line-type");
        Object.keys(lineDict).forEach((key) => {
            const option = document.createElement("option");
            option.value = lineDict[key];
            option.textContent = key;
            lineContainer.appendChild(option);
        });
    }
    populateLineType();

    // Set active tool
    function setActiveTool(tool) {
        if (tool !== "typeText") isTyping = false;
        if (tool !== "miniTextTool") isTyping = false;
        if (tool !== "pasteImage") isPasting = false;

        currentTool = tool;

        Object.values(tools).forEach((btn) => btn.classList.remove("active"));
        const isLine = ["horizontalLine", "verticalLine", "inclinedLine"].includes(currentTool);
        if (isLine) tools["lines"].classList.add("active");
        else tools[tool].classList.add("active");

        const activeColor = document.getElementById("activeColor");
        if (tool === "highlighter" || tool === "filledRectangle") activeColor.style.backgroundColor = color2;
        else activeColor.style.backgroundColor = color1;
    }

    //TODO:--------------- Start drawing -----------------------
    function startPainting(e) {
        e.preventDefault();
        if (currentTool === "typeText" || currentTool === "miniTextTool") {
            isTyping = true;
            return;
        }
        if (currentTool === "eyeDropperTool") return;
        if (currentTool === "pasteImage") return;

        painting = true;

        let pos = { x: e.offsetX, y: e.offsetY };
        startX = pos.x;
        startY = pos.y;

        ctx.beginPath();

        switch (currentTool) {
            case "horizontalLine":
            case "verticalLine":
            case "inclinedLine":
            case "rectangle":
            case "filledRectangle":
            case "borderedRectangle":
            case "circle":
            case "filledCircle":
            case "borderedCircle":
            case "highlighter":
            case "eraser":
                snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
                break;
            default:
                ctx.moveTo(startX, startY);
        }
    }

    // Draw function
    function draw(e) {
        if (!painting) return;
        e.preventDefault();

        let pos = { x: e.offsetX, y: e.offsetY };

        ctx.lineWidth = brushSize;
        ctx.lineCap = "square";
        ctx.strokeStyle = color1;

        // Set line dash: [dashLength, gapLength]
        const dashArray = JSON.parse(document.getElementById("line-type").value);
        ctx.setLineDash(dashArray);

        switch (currentTool) {
            case "horizontalLine":
            case "verticalLine":
            case "inclinedLine":
                ctx.putImageData(snapshot, 0, 0);
                ctx.beginPath();
                ctx.moveTo(startX, startY);

                if (currentTool === "horizontalLine") {
                    ctx.lineTo(pos.x, startY);
                    ctx.stroke();
                } else if (currentTool === "verticalLine") {
                    ctx.lineTo(startX, pos.y);
                    ctx.stroke();
                } else {
                    ctx.lineTo(pos.x, pos.y);
                    ctx.stroke();
                }
                break;
            case "rectangle":
            case "filledRectangle":
            case "borderedRectangle":
            case "eraser":
                ctx.putImageData(snapshot, 0, 0);
                let width = pos.x - startX;
                let height = pos.y - startY;
                if (currentTool === "rectangle") {
                    ctx.strokeRect(startX, startY, width, height);
                } else if (currentTool === "filledRectangle") {
                    ctx.fillStyle = color2;
                    ctx.fillRect(startX, startY, width, height);
                } else if (currentTool === "borderedRectangle") {
                    const { r, g, b } = extractRGB(color2);
                    ctx.strokeStyle = `rgb(${r},${g},${b})`;
                    ctx.strokeRect(startX, startY, width, height);
                    ctx.fillStyle = color1;
                    ctx.fillRect(startX, startY, width, height);
                } else {
                    ctx.fillStyle = color1;
                    ctx.fillRect(startX, startY, width, height);
                }
                break;
            case "circle":
            case "filledCircle":
            case "borderedCircle":
                ctx.putImageData(snapshot, 0, 0);
                const radius = Math.sqrt((startX - pos.x) ** 2 + (startY - pos.y) ** 2);
                ctx.beginPath();
                ctx.arc(startX, startY, radius, 0, Math.PI * 2);
                if (currentTool === "circle") {
                    ctx.stroke();
                } else if (currentTool === "borderedCircle") {
                    const { r, g, b } = extractRGB(color2);
                    ctx.strokeStyle = `rgb(${r},${g},${b})`;
                    ctx.stroke();
                    ctx.fillStyle = color1;
                    ctx.fill();
                } else {
                    ctx.fillStyle = color1;
                    ctx.fill();
                }
                break;
            case "highlighter":
                ctx.putImageData(snapshot, 0, 0);
                let w = pos.x - startX;
                ctx.fillStyle = color2;
                ctx.fillRect(startX, startY, w, highlighterSize);
                break;
            default:
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
        }
    }

    // Stop drawing
    function stopPainting() {
        painting = false;
        ctx.closePath();

        const state = canvas.toDataURL();
        undoStack.push(state);
        redoStack.length = 0;
    }

    //TODO:--------- Event Listeners for canvas ---------------------------------
    canvas.addEventListener("mousedown", startPainting);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopPainting);
    canvas.addEventListener("mouseout", stopPainting);
    canvas.addEventListener("click", (e) => {
        if (currentTool === "eyeDropperTool") {
            canvas.style.pointerEvents = "none";
            const element = document.elementFromPoint(e.clientX, e.clientY);
            canvas.style.pointerEvents = "auto";
            if (element) {
                color1 = getBackgroundColor(element);
                if (color1 === "None") return;
                colorPicker1.children[0].style.backgroundColor = color1;
            }
        } else if (currentTool === "pasteImage") {
            handlePasteImage(e);
        } else if (currentTool === "miniTextTool") {
            addMiniTextModal(e);
        } else {
            showModal(e);
        }
        // Function to get the actual background color
        function getBackgroundColor(el) {
            while (el) {
                let bgColor = window.getComputedStyle(el).backgroundColor;
                if (bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent") return bgColor;
                el = el.parentElement;
            }
            return "None";
        }
    });

    // Event Listeners for touch
    canvas.addEventListener("touchstart", startPainting);
    canvas.addEventListener("touchmove", draw);
    canvas.addEventListener("touchend", stopPainting);

    // Disable scrolling while drawing
    document.body.style.touchAction = "none";

    function lineToolsHandler() {
        const lineType = document.getElementById("line-select").value;
        const lineBtn = document.getElementById("lines");

        if (lineType === "H-line") {
            setActiveTool("horizontalLine");
            lineBtn.textContent = "―";
        } else if (lineType === "V-line") {
            setActiveTool("verticalLine");
            lineBtn.textContent = "┃";
        } else {
            setActiveTool("inclinedLine");
            lineBtn.textContent = "⸝⸝";
        }
    }
    document.getElementById("line-select").addEventListener("change", () => {
        const isLine = ["horizontalLine", "verticalLine", "inclinedLine"].includes(currentTool);
        if (!isLine) return;
        lineToolsHandler();
    });

    //TODO:----------Tool Handlers-----------------------------------
    tools.brush.addEventListener("click", () => setActiveTool("brush"));
    tools.highlighter.addEventListener("click", () => setActiveTool("highlighter"));
    tools.lines.addEventListener("click", lineToolsHandler);
    tools.rectangle.addEventListener("click", () => setActiveTool("rectangle"));
    tools.filledRectangle.addEventListener("click", () => setActiveTool("filledRectangle"));
    tools.borderedRectangle.addEventListener("click", () => setActiveTool("borderedRectangle"));
    tools.eraser.addEventListener("click", () => setActiveTool("eraser"));
    tools.eyeDropperTool.addEventListener("click", () => setActiveTool("eyeDropperTool"));
    tools.typeText.addEventListener("click", () => {
        isTyping = true;
        setActiveTool("typeText");
    });
    tools.miniTextTool.addEventListener("click", () => {
        isTyping = true;
        setActiveTool("miniTextTool");
    });
    tools.pasteImage.addEventListener("click", () => {
        isPasting = true;
        setActiveTool("pasteImage");
    });
    tools.circle.addEventListener("click", () => setActiveTool("circle"));
    tools.filledCircle.addEventListener("click", () => setActiveTool("filledCircle"));
    tools.borderedCircle.addEventListener("click", () => setActiveTool("borderedCircle"));

    // highlighter Size
    document.getElementById("highlighterSize").addEventListener("input", (e) => {
        highlighterSize = parseInt(e.target.value);
    });

    // Brush Size
    brushSizeInput.addEventListener("input", (e) => {
        brushSize = e.target.value;
    });

    // Clear Canvas
    document.getElementById("clear").addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    document.querySelector(".save-menu-btn").onclick = () => {
        const saveMenu = document.querySelector(".menu-content");
        saveMenu.style.display = saveMenu.style.display === "none" || saveMenu.style.display === "" ? "grid" : "none";
    };
    document.getElementById("save").onclick = () => {
        startFullPageCapture();
        document.querySelector(".menu-content").style.display = "none";
    };
    document.getElementById("saveLayer").onclick = () => {
        saveAllLayers();
        document.querySelector(".menu-content").style.display = "none";
    };
    document.getElementById("restoreLayer").onclick = () => {
        restoreAllLayers();
        document.querySelector(".menu-content").style.display = "none";
    };

    // Opacity Control
    function color_opacity_control() {
        const opacity_input = document.getElementById("opacity");

        if (opacity_input.value === "") return;
        opacity = opacity_input.value;

        const { r, g, b } = extractRGB(color1);
        color1 = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        document.getElementById("activeColor").style.backgroundColor = color1;
    }
    document.getElementById("opacity").addEventListener("input", color_opacity_control);
    document.querySelector(".opacity_control label").onclick = () => {
        let opacityInput = document.getElementById("opacity");
        let opacityValue = parseFloat(opacityInput.value);
        opacityInput.value = opacityValue === 1 ? 0.2 : 1;
        color_opacity_control();
    };

    // Undo functionality
    document.getElementById("undo").addEventListener("click", () => {
        if (undoStack.length >= 1) {
            // Ensure there's a state to undo to
            const currentState = undoStack.pop(); // Pop current state
            redoStack.push(currentState); // Push to redo stack
            const prevState = undoStack[undoStack.length - 1]; // Get previous state
            restoreCanvas(prevState); // Restore canvas
        }
    });

    // Redo functionality
    document.getElementById("redo").addEventListener("click", () => {
        if (redoStack.length > 0) {
            // Ensure there's a state to redo to
            const nextState = redoStack.pop(); // Pop next state
            undoStack.push(nextState); // Push to undo stack
            restoreCanvas(nextState); // Restore canvas
        }
    });

    // Function to restore canvas from a state
    function restoreCanvas(state) {
        const img = new Image();
        img.src = state;
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
            ctx.drawImage(img, 0, 0); // Draw the saved state
        };
    }

    function createRGBA(hex, opacity) {
        hex = hex.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    function extractRGB(rgbaString) {
        const rgbaRegex = /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/;
        const match = rgbaString.match(rgbaRegex);
        if (match === null) return;
        return { r: parseInt(match[1], 10), g: parseInt(match[2], 10), b: parseInt(match[3], 10) };
    }

    // Code for color pickers
    function assignColor(colorPicker, colorVariable) {
        // Code for predifined color
        const colorPickerButton = colorPicker.querySelector(".color-picker-button");
        const colorSwatches = colorPicker.querySelector(".color-swatches");

        // Toggle color swatches visibility on button click
        colorPickerButton.addEventListener("click", function (event) {
            event.stopPropagation(); // Prevent event from bubbling up
            colorSwatches.classList.toggle("visible");
        });

        // Handle color selection
        colorSwatches.querySelectorAll(".color-swatch").forEach((swatch) => {
            swatch.addEventListener("click", function () {
                // Get the selected color's hex code
                const selectedColor = this.getAttribute("data-color");
                // Update button color
                colorPickerButton.style.backgroundColor = selectedColor;
                // Hide swatches after selection
                colorSwatches.classList.remove("visible");

                if (colorVariable === 1) color1 = createRGBA(selectedColor, opacity);
                else color2 = createRGBA(selectedColor, 0.4);

                if (currentTool === "highlighter" || currentTool === "filledRectangle")
                    document.getElementById("activeColor").style.backgroundColor = color2;
                else document.getElementById("activeColor").style.backgroundColor = color1;
            });
        });

        // Close swatches when clicking outside
        document.addEventListener("click", function (event) {
            if (!event.target.closest(".color-picker")) colorSwatches.classList.remove("visible");
        });
    }
    assignColor(colorPicker1, 1);
    assignColor(colorPicker2, 2);

    function assignTextColor(colorPicker) {
        const colorSwatches = colorPicker.querySelector(".color-swatches");
        // Toggle swatch visibility when the picker is clicked
        colorPicker.addEventListener("click", function (event) {
            event.stopPropagation();
            colorSwatches.classList.toggle("visible");
        });

        // Handle swatch selection
        colorSwatches.querySelectorAll(".color-swatch").forEach((swatch) => {
            swatch.addEventListener("click", function (event) {
                event.stopPropagation(); // stop bubbling event fires from colorPicker
                const selectedColor = this.getAttribute("data-color");
                colorPicker.style.backgroundColor = selectedColor;
                colorSwatches.classList.remove("visible");
                textColor = selectedColor;
            });
        });

        // Hide the color swatches if click is outside the picker
        document.addEventListener("click", function (event) {
            if (!event.target.closest(".text-color-picker")) colorSwatches.classList.remove("visible");
        });
    }

    function addText(x, y, text) {
        const fontSize = parseInt(document.getElementById("font-size").value);
        const fontFamily = document.getElementById("font-select").value;
        const isBold = document.getElementById("bold-check").checked;
        const isItalic = document.getElementById("italic-check").checked;
        const rotationDeg = parseFloat(document.getElementById("rotation-input").value) || 0;

        // Build font string
        ctx.font = `${isItalic ? "italic " : ""}${isBold ? "bold " : ""}${fontSize}px ${fontFamily}`;
        ctx.fillStyle = textColor;

        const rotationRad = -(rotationDeg * (Math.PI / 180));
        const lineHeight = fontSize + 3;

        const lines = text.split("\n");

        ctx.save();
        ctx.translate(x, y); // Move to base point
        ctx.rotate(rotationRad); // Rotate coordinate system

        lines.forEach((line, index) => {
            const offsetY = (fontSize * 2.3) / 3 + lineHeight * index;
            ctx.fillText(line, 0, offsetY); // Keep X = 0, shift Y in rotated space
        });

        ctx.restore();
    }

    function showModal(e) {
        if (!isTyping) return;

        const modal = document.getElementById("modal");
        modal.style.display = "block";
        disableScroll();

        const bullet = document.getElementById("bullet");
        const addBulletBtn = document.getElementById("addBullet");
        const submitBtn = document.getElementById("submitText");
        const clearBtn = document.getElementById("clearText");
        const textInput = document.getElementById("textInput");
        const closeBtn = document.getElementById("closeModal");
        if (textInput) textInput.focus();

        let autoNumber = 0;
        let autoLetterIndex = 0;
        const numbers = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

        const textColorPicker = document.querySelector(".text-color-picker");
        textColorPicker.innerHTML = `<div class="color-swatches">${colorList()}</div>`;
        assignTextColor(textColorPicker);

        // Remove any existing event listener to avoid duplication
        addBulletBtn.replaceWith(addBulletBtn.cloneNode(true));
        const newAddBulletBtn = document.getElementById("addBullet");

        newAddBulletBtn.addEventListener("click", () => {
            let currentBullet = bullet.dataset.value;

            if (currentBullet === "🔢") {
                currentBullet = numbers[autoNumber];
                autoNumber = (autoNumber + 1) % numbers.length; // Increment and reset after 🔟
            }
            if (currentBullet === "ABC") {
                currentBullet = letters[autoLetterIndex] + "). ";
                autoLetterIndex = (autoLetterIndex + 1) % letters.length;
            }
            if (currentBullet === "abc") {
                currentBullet = letters[autoLetterIndex].toLowerCase() + "). ";
                autoLetterIndex = (autoLetterIndex + 1) % letters.length;
            }

            // Get current cursor position
            let start = textInput.selectionStart;
            let end = textInput.selectionEnd;

            // Insert bullet at cursor position
            let text = textInput.value;
            textInput.value = text.slice(0, start) + currentBullet + text.slice(end);

            // Move cursor after the inserted bullet
            textInput.selectionStart = textInput.selectionEnd = start + currentBullet.length;

            // Focus back on textInput
            textInput.focus();

            navigator.clipboard.writeText(currentBullet);
        });

        textInput.addEventListener("input", (e) => {
            const wordCountDisplay = document.getElementById("wc");
            const text = e.target.value.trim();
            const words = text === "" ? 0 : text.split(/\s+/).length;
            wordCountDisplay.textContent = words;
        });

        // Function to handle submission
        function submitText() {
            if (textInput.value.trim() !== "") {
                addText(e.offsetX, e.offsetY, textInput.value);
                navigator.clipboard.writeText(textInput.value);
            }
            modal.style.display = "none";
            textInput.value = "";
            document.getElementById("wc").textContent = "0";
            document.getElementById("bold-check").checked = false;
            document.getElementById("italic-check").checked = false;
            document.getElementById("rotation-input").value = 0;
            enableScroll();
        }

        submitBtn.onclick = submitText;

        // Listen for Shift + Enter key press
        textInput.onkeydown = (event) => {
            if (event.shiftKey && event.key === "Enter") {
                event.preventDefault(); // Prevent default newline behavior
                submitText();
            }
        };

        clearBtn.onclick = () => {
            textInput.value = "";
            document.getElementById("wc").textContent = "0";
            autoNumber = 0;
            autoLetterIndex = 0;
        };
        closeBtn.onclick = () => {
            modal.style.display = "none";
            enableScroll();
            textInput.value = "";
            autoNumber = 0;
            autoLetterIndex = 0;
        };
        //Stop scrolling document when mouse on modal
        function disableScroll() {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = "hidden";
            document.body.style.paddingRight = `${scrollbarWidth}px`; // Prevents content shift
        }

        function enableScroll() {
            document.body.style.overflow = "";
            document.body.style.paddingRight = ""; // Reset padding
        }
    }

    function addMiniTextModal(e) {
        if (!isTyping) return;

        const existingModal = document.getElementById("miniTextModal");
        if (existingModal) existingModal.remove();
        const textarea = document.createElement("textarea");
        textarea.id = "miniTextModal";
        textarea.classList.add("mini-textarea");

        // Dynamic size and position
        textarea.style.left = `${e.offsetX}px`;
        textarea.style.top = `${e.offsetY}px`;
        textarea.style.fontSize = `${highlighterSize}px`;
        textarea.style.height = `${highlighterSize + 5}px`;

        document.body.appendChild(textarea);
        textarea.focus();

        // --- Hidden span to measure width ---
        const measure = document.createElement("span");
        measure.style.position = "absolute";
        measure.style.visibility = "hidden";
        measure.style.whiteSpace = "pre";
        measure.style.font = `${highlighterSize}px Arial`;
        document.body.appendChild(measure);

        // --- Adjust width dynamically ---
        function adjustWidth() {
            // Find longest line among all lines
            const lines = textarea.value.split("\n");
            let longest = "";
            for (const line of lines) if (line.length > longest.length) longest = line;

            measure.textContent = longest || " ";
            const newWidth = measure.offsetWidth + 20; // padding
            textarea.style.width = `${newWidth}px`;
        }

        textarea.addEventListener("input", adjustWidth);
        adjustWidth(); // initialize

        // --- Add text to canvas ---
        function addText() {
            const text = textarea.value.trim();
            if (text) {
                ctx.font = `${highlighterSize}px Arial`;
                const { r, g, b } = extractRGB(color1);
                ctx.fillStyle = `rgb(${r},${g},${b})`;

                const lines = text.split("\n");
                const lineHeight = highlighterSize + 2;

                lines.forEach((line, index) => {
                    ctx.fillText(line, e.offsetX, e.offsetY + highlighterSize + lineHeight * index);
                });

                navigator.clipboard.writeText(text);
            }
            reset();
        }

        textarea.onkeydown = (event) => {
            if (event.key === "Enter" && event.shiftKey) {
                event.preventDefault();
                addText();
            }
            if (event.key === "Enter" && !event.shiftKey) {
                // setTimeout(() => {
                //     textarea.style.height = "auto";
                //     textarea.style.height = textarea.scrollHeight + "px";
                // }, 0);

                textarea.style.height = "auto";
                textarea.style.height = textarea.scrollHeight + "px";
            }
            if (event.key === "Escape") reset();
        };
        function reset() {
            textarea.remove();
            measure.remove();
        }
    }

    //TODO: Handing inserting image from clipboard
    let clickPosition = { x: 0, y: 0 };

    function handlePasteImage(e) {
        const rect = canvas.getBoundingClientRect();
        clickPosition.x = e.clientX - rect.left;
        clickPosition.y = e.clientY - rect.top;
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

    window.addEventListener("paste", async function (e) {
        if (!isPasting) return;

        const items = e.clipboardData.items;
        const scale = getImageScale();

        for (const item of items) {
            if (item.type.indexOf("image") !== -1) {
                const blob = item.getAsFile();
                const img = new Image();

                img.onload = function () {
                    // Take a snapshot of the canvas so previous drawings remain intact
                    const canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    // Initialize draggable mode only when pasting is active
                    if (isPasting) {
                        makeImageDraggable(img, scale, { x: clickPosition.x, y: clickPosition.y }, canvasSnapshot);
                    }

                    // --- Helper for draggable pasted image ---
                    function makeImageDraggable(image, scaleFactor, startPos, snapshot) {
                        let tempX = startPos.x;
                        let tempY = startPos.y;
                        let isDragging = false;
                        let offsetX = 0;
                        let offsetY = 0;
                        // Draw preview on top of existing canvas
                        function drawTemp() {
                            ctx.putImageData(snapshot, 0, 0);
                            ctx.drawImage(image, tempX, tempY, image.width * scaleFactor, image.height * scaleFactor);
                            ctx.save();
                            ctx.strokeStyle = "rgba(0,0,0,0.35)";
                            ctx.lineWidth = 1;
                            ctx.strokeRect(tempX, tempY, image.width * scaleFactor, image.height * scaleFactor);
                            ctx.restore();
                        }
                        drawTemp();

                        function isInsideImage(x, y) {
                            return x >= tempX && x <= tempX + image.width * scaleFactor && y >= tempY && y <= tempY + image.height * scaleFactor;
                        }

                        // Mouse down → start drag
                        function onMouseDown(ev) {
                            const rect = canvas.getBoundingClientRect();
                            const x = ev.clientX - rect.left;
                            const y = ev.clientY - rect.top;
                            if (isInsideImage(x, y)) {
                                isDragging = true;
                                offsetX = x - tempX;
                                offsetY = y - tempY;
                                canvas.style.cursor = "grabbing";
                            }
                        }
                        // Mouse move → update drag or cursor
                        function onMouseMove(ev) {
                            const rect = canvas.getBoundingClientRect();
                            const x = ev.clientX - rect.left;
                            const y = ev.clientY - rect.top;
                            // Change cursor only when hovering over image
                            if (!isDragging) {
                                canvas.style.cursor = isInsideImage(x, y) ? "grab" : "default";
                            } else {
                                // Update position while dragging
                                tempX = x - offsetX;
                                tempY = y - offsetY;
                                drawTemp();
                            }
                        }
                        // Mouse up → stop drag
                        function onMouseUp() {
                            if (isDragging) {
                                isDragging = false;
                                canvas.style.cursor = "grab";
                            }
                        }
                        // Keyboard: Enter = fix, Esc = cancel
                        function onKeyDown(ev) {
                            if (ev.key === "Enter") {
                                // Fix image permanently
                                ctx.putImageData(snapshot, 0, 0);
                                ctx.drawImage(image, tempX, tempY, image.width * scaleFactor, image.height * scaleFactor);
                                cleanup();
                            } else if (ev.key === "Escape") {
                                // Cancel placement
                                ctx.putImageData(snapshot, 0, 0);
                                cleanup();
                            }
                        }
                        // Cleanup
                        function cleanup() {
                            canvas.removeEventListener("mousedown", onMouseDown);
                            canvas.removeEventListener("mousemove", onMouseMove);
                            canvas.removeEventListener("mouseup", onMouseUp);
                            window.removeEventListener("keydown", onKeyDown);
                            canvas.style.cursor = "default";
                        }
                        // Attach listeners
                        canvas.addEventListener("mousedown", onMouseDown);
                        canvas.addEventListener("mousemove", onMouseMove);
                        canvas.addEventListener("mouseup", onMouseUp);
                        window.addEventListener("keydown", onKeyDown);
                    }
                };
                img.src = URL.createObjectURL(blob);
                break; // Handle only first image item
            }
        }
    });

    //* resize/positon tool bar
    changeToolbarSize();
    document.getElementById("placeBottom").addEventListener("click", () => {
        const toolbar = document.getElementById("annotationToolbar");
        toolbar.style.width = "max-content";
        toolbar.style.height = "63px";
        toolbar.style.top = "96%";
        toolbar.style.left = "50%";
        toolbar.style.transform = "translate(-50%, -50%)";
        document.querySelector(".save-menu .menu-content").style.display = "none";
    });

    //* setting presets
    function tooglePreset(presetNumber) {
        function colorSettings(r, g, b, opacity, picker) {
            if (picker === 1) {
                color1 = `rgba(${r},${g},${b},${opacity})`;
                document.querySelector(".color-picker-button").style.backgroundColor = `rgba(${r},${g},${b},1)`;
                color_opacity_control();
            } else {
                color2 = `rgba(${r},${g},${b},${opacity})`;
                document.querySelectorAll(".color-picker-button")[1].style.backgroundColor = `rgba(${r},${g},${b},1)`;
            }
        }
        const preset1 = () => {
            opacity = 1;
            color1 = `rgba(255,255,255,${opacity})`;
            document.querySelector(".color-picker-button").style.backgroundColor = color1;
            document.getElementById("opacity").value = opacity;
            color_opacity_control();
            setActiveTool("eraser");
        };
        const preset2 = (setOpacity, setBrushSize, lineTool = true) => {
            opacity = setOpacity;
            brushSize = setBrushSize;

            document.getElementById("opacity").value = opacity;
            document.getElementById("brushSize").value = brushSize;

            if (lineTool) {
                lineToolsHandler();
                colorSettings(0, 0, 255, opacity, 1);
            } else {
                setActiveTool("rectangle");
                colorSettings(18, 193, 235, opacity, 1);
            }
        };
        const preset3 = (setOpacity, isborderedRectangle = true) => {
            opacity = setOpacity;
            document.getElementById("opacity").value = opacity;
            color_opacity_control();
            if (isborderedRectangle) {
                setActiveTool("borderedRectangle");
                colorSettings(18, 193, 235, opacity, 1);
                colorSettings(18, 193, 235, opacity, 2);
            } else {
                setActiveTool("eraser");
            }
        };

        if (presetNumber === 0) preset1();
        if (presetNumber === 1) preset2(0.5, 3);
        if (presetNumber === 2) preset2(1, 2, false);
        if (presetNumber === 3) preset3(0.06, false);
        if (presetNumber === 4) preset3(0.2);
    }
    let presetNumber = 1;
    document.getElementById("togglePreset").addEventListener("click", () => {
        tooglePreset(presetNumber++);
        presetNumber %= 5;
    });
}
//TODO:------------save & restore canvas drawing-------------------------------
async function saveAllLayers() {
    const canvas = document.getElementById("drawingCanvas");
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));

    const handle = await window.showSaveFilePicker({
        suggestedName: "canvas.png",
        types: [{ description: "PNG Image", accept: { "image/png": [".png"] } }],
    });

    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
}

function restoreAllLayers() {
    // Trigger hidden file input
    document.getElementById("fileInput").click();
    // When file is selected
    document.getElementById("fileInput").onchange = function (event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.getElementById("drawingCanvas");
                const ctx = canvas.getContext("2d");

                // Clear canvas and draw restored image at top-left corner
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };
}

async function startFullPageCapture() {
    const originalScrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const totalHeight = document.body.scrollHeight;
    const numScreenshots = Math.ceil(totalHeight / viewportHeight);

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = totalHeight;

    // Hide fixed/sticky elements
    const hiddenElements = [];
    document.querySelectorAll("*").forEach((el) => {
        const style = window.getComputedStyle(el);
        if (style.position === "fixed" || style.position === "sticky") {
            hiddenElements.push({
                element: el,
                originalDisplay: el.style.display,
            });
            el.style.display = "none";
        }
    });

    const images = [];

    for (let i = 0; i < numScreenshots; i++) {
        window.scrollTo(0, i * viewportHeight);
        await new Promise((resolve) => setTimeout(resolve, 500)); // wait for rendering

        const dataUrl = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "capture" }, resolve);
        });

        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve) => (img.onload = resolve));
        images.push(img);
    }

    // Restore hidden elements
    for (const { element, originalDisplay } of hiddenElements) {
        element.style.display = originalDisplay;
    }

    window.scrollTo(0, originalScrollY); // restore scroll

    // Stitch image
    let y = 0;
    for (const img of images) {
        context.drawImage(img, 0, y);
        y += img.height;
    }

    const finalImage = canvas.toDataURL("image/png");

    // Download
    const a = document.createElement("a");
    a.href = finalImage;
    a.download = `fullpage-${Date.now()}.png`;
    a.click();
    consoleLog("Screenshot taken successfully!");
}

function expandCanvasArea() {
    const expandBtn = document.createElement("button");
    expandBtn.id = "expand_canvas";
    expandBtn.textContent = "Expand Canvas";
    document.body.appendChild(expandBtn);

    expandBtn.addEventListener("click", () => {
        const whiteBg = document.createElement("div");
        whiteBg.classList.add("whiteBg");
        document.body.appendChild(whiteBg);

        const canvas = document.getElementById("drawingCanvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.height += 600;
        ctx.putImageData(imageData, 0, 0);
    });
}

function createNavigation() {
    const navDiv = document.createElement("div");
    navDiv.id = "bottomNavBar";
    navDiv.classList.add("scroll-buttons");
    navDiv.innerHTML = `
        <button id="scrollToTop">⏫</button>      
        <button id="scrollUp">🔼</button>        
        <button id="scrollDown">🔽</button>       
        <button id="scrollToBottom">⏬</button>   
    `;
    document.body.appendChild(navDiv);

    handleNavigation(window);
}

function changeToolbarSize() {
    const toolbar = document.getElementById("annotationToolbar");
    const radioButtons = document.querySelectorAll('input[name="size"]');

    radioButtons.forEach((radio) => {
        radio.addEventListener("change", (e) => {
            const size = e.target.value;
            switch (size) {
                case "1":
                    positionToolbar();
                    toolbar.style.width = "max-content";
                    toolbar.style.height = "63px";
                    break;
                case "2":
                    positionToolbar();
                    toolbar.style.width = "425px";
                    toolbar.style.height = "150px";
                    break;
                case "3":
                    positionToolbar();
                    toolbar.style.width = "107px";
                    toolbar.style.height = "740px";
                    break;
                case "4":
                    positionToolbar();
                    toolbar.style.width = "165px";
                    toolbar.style.height = "415px";
                    break;
                case "5":
                    positionToolbar();
                    toolbar.style.width = "335px";
                    toolbar.style.height = "188px";
                    break;
                case "6":
                    positionToolbar();
                    toolbar.style.width = "590px";
                    toolbar.style.height = "105px";
                    break;
            }
        });
        function positionToolbar() {
            toolbar.style.top = "30px";
            toolbar.style.left = "50%";
            toolbar.style.transform = "translateX(-50%)";
        }
    });
}
