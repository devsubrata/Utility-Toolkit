if (!document.getElementById("annotationToolbar")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("styles/annotate.css");
    document.head.appendChild(link);

    const annotationDiv = document.createElement("div");
    annotationDiv.id = "annotationToolbar";
    annotationDiv.classList.add("glassy");
    annotationDiv.innerHTML = `
        <div class="bar-size" title="toggle tool bar size">
            <input type="radio" id="size1" name="size" value="1" checked />
            <input type="radio" id="size2" name="size" value="2" />
            <input type="radio" id="size3" name="size" value="3" />
        </div>
        <div id="activeColor" title="Active Color"></div>
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
        <button id="color_detector" title="Pick color from canvas">🔥</button>
        <button id="filledCircle" title="Filled circle">⚫</button>
        <button id="eraser" title="Erase" class="active">E</button>
        <button id="save" title="Take Snapshot">📸</button>
        <button id="clear" title="Erase everything">🆑</button>
        <button id="exit">❌</button>
    `;

    document.body.appendChild(annotationDiv);
    makeDraggable(annotationDiv);

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
                <option value="Tahoma" selected>Tahoma</option>
                <option value="Open Sans">Open sans</option>
                <option value="Verdana">Verdana</option>
            </select>
            <div class="text-color-picker"></div>
            <input type="number" title="Font Size" id="font_size" min="10" max="100" step="2" value="30"/>
            ${create_bullet_menu()}
            <button id="addBullet">Add Marker</button>
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
    makeDraggable(textModal);

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
        typeText: document.getElementById("typeText"),
        pasteImage: document.getElementById("insertImage"),
        eraser: document.getElementById("eraser"),
        eyeDropperTool: document.getElementById("color_detector"),
        circle: document.getElementById("circle"),
        filledCircle: document.getElementById("filledCircle"),
    };

    let painting = false;
    let isTyping = false;
    let isPasting = false;
    let brushSize = 2;
    let highlighterSize = 20;
    let opacity = 1.0;
    let color1 = `rgba(255,255,255,${opacity})`;
    let color2 = `rgba(255, 165, 0, 0.4)`;
    let textColor = `#0000ff`;
    let currentTool = "eraser";
    let startX, startY;
    let snapshot; // Store canvas state before drawing a rectangle
    const undoStack = [];
    const redoStack = [];

    const [colorPicker1, colorPicker2] = document.querySelectorAll(".color-picker");
    colorPicker1.children[0].style.backgroundColor = color1;
    colorPicker2.children[0].style.backgroundColor = color2;

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
        if (currentTool === "typeText") {
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
            case "circle":
            case "filledCircle":
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
            case "eraser":
                ctx.putImageData(snapshot, 0, 0);
                let width = pos.x - startX;
                let height = pos.y - startY;
                if (currentTool === "rectangle") {
                    ctx.strokeRect(startX, startY, width, height);
                } else if (currentTool === "filledRectangle") {
                    ctx.fillStyle = color2;
                    ctx.fillRect(startX, startY, width, height);
                } else {
                    ctx.fillStyle = color1;
                    ctx.fillRect(startX, startY, width, height);
                }
                break;
            case "circle":
            case "filledCircle":
                ctx.putImageData(snapshot, 0, 0);
                const radius = Math.sqrt((startX - pos.x) ** 2 + (startY - pos.y) ** 2);
                ctx.beginPath();
                ctx.arc(startX, startY, radius, 0, Math.PI * 2);
                if (currentTool === "circle") {
                    ctx.stroke();
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
    tools.eraser.addEventListener("click", () => setActiveTool("eraser"));
    tools.eyeDropperTool.addEventListener("click", () => setActiveTool("eyeDropperTool"));
    tools.typeText.addEventListener("click", () => {
        isTyping = true;
        setActiveTool("typeText");
    });
    tools.pasteImage.addEventListener("click", () => {
        isPasting = true;
        setActiveTool("pasteImage");
    });
    tools.circle.addEventListener("click", () => setActiveTool("circle"));
    tools.filledCircle.addEventListener("click", () => setActiveTool("filledCircle"));

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

    document.getElementById("save").addEventListener("click", startFullPageCapture);

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
        document.getElementById("opacity").value = 1;
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

    // functions for adding text in canvas
    function addText(x, y, text) {
        const fontSize = document.getElementById("font_size").value;
        const fontFamily = document.getElementById("font-select").value;
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = textColor;
        y = y + (parseInt(fontSize) * 2.3) / 3;

        const lines = text.split("\n");
        lines.forEach((line) => {
            ctx.fillText(line, x, y);
            y += 3 + parseInt(fontSize);
        });
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
            enableScroll();
            textInput.value = "";
            document.getElementById("wc").textContent = "0";
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
                    ctx.drawImage(img, clickPosition.x, clickPosition.y, img.width * scale, img.height * scale);
                };
                img.src = URL.createObjectURL(blob);
                break; // Only handle the first image
            }
        }
    });

    //* resize tool bar
    changeToolbarSize();
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
                    toolbar.style.width = "460px";
                    toolbar.style.height = "150px";
                    break;
                case "3":
                    positionToolbar();
                    toolbar.style.width = "101px";
                    toolbar.style.height = "723px";
                    break;
            }
        });
        function positionToolbar() {
            toolbar.style.top = "0";
            toolbar.style.left = "50%";
            toolbar.style.transform = "translateX(-50%)";
        }
    });
}
