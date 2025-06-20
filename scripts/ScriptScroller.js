if (!document.getElementById("openScriptScroller")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("styles/ScriptScroller.css");
    document.head.appendChild(link);

    const scriptScroller = document.createElement("div");
    scriptScroller.id = "openScriptScroller";
    scriptScroller.innerHTML = `
        <div id="loaderWindow">
            <div class="title-bar">
                <span class="title">🖼️ ScriptScroller</span>
                <div>
                    <button class="minimize-btn" title="minimize">—</button>
                    <button class="close-btn" title="Close">❌</button>
                </div>
            </div>
            <div class="content">
                <input type="file" id="imageInput" accept="image/*" multiple style="display: none" />
                <div class="file-button-div">
                    <button class="file-button" id="load-images">Load Script</button>
                </div>
                <h4 id="file-count"></h4>
                <ul id="fileList"></ul>
            </div>
        </div>
        <div id="viewerWindow">
            <div class="title-bar" id="viewerTitle">
                <span class="title">🖼 Image Viewer</span>
                <span id="imageName">No Image</span>
                <div class="controls">
                    <button id="minimize">_</button>
                    <button id="maximize">⬜</button>
                    <button id="close">❌</button>
                </div>
            </div>
            <div id="imageContainer">
                <img id="mainImage" src="" alt="Selected" />
            </div>
            <div class="footer-bar" id="viewerFooter">
                <div>
                    <button id="prevBtn">⬅️</button>
                    <button id="nextBtn">➡️</button>
                    <button id="zoomIn">➕</button>
                    <button id="zoomOut">➖</button>
                </div>
                <div>
                    <button id="scrollToTop">⏫</button>      
                    <button id="scrollUp">🔼</button>        
                    <button id="scrollDown">🔽</button>       
                    <button id="scrollToBottom">⏬</button>   
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(scriptScroller);
    makeDraggable(document.getElementById("loaderWindow"));
    makeDraggable(document.getElementById("viewerWindow"));
    closeWindow(scriptScroller.querySelector(".close-btn"), scriptScroller, null);
    minimizeWindow(scriptScroller.querySelector(".minimize-btn"), document.getElementById("loaderWindow"));

    const imageInput = document.getElementById("imageInput");
    const loadImageBtn = document.getElementById("load-images");
    const fileList = document.getElementById("fileList");
    const mainImage = document.getElementById("mainImage");
    const imageName = document.getElementById("imageName");
    const viewerWindow = document.getElementById("viewerWindow");
    const dropZone = document.querySelector("#loaderWindow .content"); // upload scripts by drag and drop

    let images = [];
    let currentIndex = 0;
    let zoomLevel = 1;
    let isMaximized = false;
    let isMinimized = false;
    let prevViewerStyles = {};

    function handleFiles(images) {
        fileList.innerHTML = "";

        const fileCount = document.getElementById("file-count");
        fileCount.textContent = `Total: ${images.length} scripts uploaded`;

        images.forEach((file, index) => {
            const li = document.createElement("li");
            li.innerHTML = `<span style="color: blue;"><strong>${index + 1}</strong></span>. ${file.name}`;
            li.addEventListener("click", () => {
                if (isMinimized) toggleMinimize();
                viewerWindow.style.display = "flex";
                handleNavigation(document.getElementById("imageContainer"));
                showImage(index);
            });
            fileList.appendChild(li);
        });
    }

    loadImageBtn.onclick = () => imageInput.click();

    imageInput.addEventListener("change", (e) => {
        images = Array.from(e.target.files);
        handleFiles(images);
    });

    // Handle files dropped onto the drop zone
    dropZone.addEventListener("drop", (e) => {
        images = Array.from(e.dataTransfer.files); // Get the dropped files
        handleFiles(images); // Handle them
    });

    // Highlight the drop zone when dragging files over it
    ["dragenter", "dragover"].forEach((eventName) => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault(); // Prevent default browser behavior (e.g., open file)
            e.stopPropagation(); // Stop event bubbling
            dropZone.classList.add("highlight"); // Add highlight effect
        });
    });

    // Remove highlight when dragging leaves the drop zone or when dropping
    ["dragleave", "drop"].forEach((eventName) => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove("highlight"); // Remove highlight effect
        });
    });

    function showImage(index) {
        const file = images[index];
        if (!file) return;
        currentIndex = index;
        const url = URL.createObjectURL(file);
        mainImage.src = url;
        imageName.textContent = file.name;
        zoomLevel = 1;
        mainImage.style.transform = `scale(${zoomLevel})`;
    }

    function updateZoom() {
        mainImage.style.transform = `scale(${zoomLevel})`;
    }

    document.getElementById("prevBtn").onclick = () => {
        if (currentIndex > 0) showImage(currentIndex - 1);
    };

    document.getElementById("nextBtn").onclick = () => {
        if (currentIndex < images.length - 1) showImage(currentIndex + 1);
    };

    document.getElementById("zoomIn").onclick = () => {
        zoomLevel *= 1.2;
        updateZoom();
    };

    document.getElementById("zoomOut").onclick = () => {
        zoomLevel /= 1.2;
        updateZoom();
    };

    const minimizeBtn = document.getElementById("minimize");
    const maximizeBtn = document.getElementById("maximize");
    const closeBtn = document.getElementById("close");

    function toggleMinimize() {
        viewerWindow.classList.toggle("minimized");
        isMinimized = !isMinimized;
    }

    minimizeBtn.onclick = toggleMinimize;

    maximizeBtn.onclick = () => {
        if (!isMaximized) {
            prevViewerStyles = {
                top: viewerWindow.style.top,
                left: viewerWindow.style.left,
                width: viewerWindow.style.width,
                height: viewerWindow.style.height,
            };
            viewerWindow.style.top = "0";
            viewerWindow.style.left = "0";
            viewerWindow.style.width = "100vw";
            viewerWindow.style.height = "100vh";
            isMaximized = true;
        } else {
            viewerWindow.style.top = prevViewerStyles.top;
            viewerWindow.style.left = prevViewerStyles.left;
            viewerWindow.style.width = prevViewerStyles.width;
            viewerWindow.style.height = prevViewerStyles.height;
            isMaximized = false;
        }
    };

    closeBtn.onclick = () => {
        viewerWindow.style.display = "none";
    };
}
