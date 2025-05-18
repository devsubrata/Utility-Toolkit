function makeDraggable(el) {
    const titleBar = el.querySelector(".title") || el;
    let isDragging = false;
    let offsetX, offsetY;

    titleBar.style.cursor = "grab";

    titleBar.addEventListener("mousedown", (e) => {
        isDragging = true;
        offsetX = e.clientX - el.offsetLeft;
        offsetY = e.clientY - el.offsetTop;
        document.body.style.userSelect = "none";
        titleBar.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        el.style.left = `${e.clientX - offsetX}px`;
        el.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        document.body.style.userSelect = "";
        titleBar.style.cursor = "grab";
    });
}

function closeWindow(elm, ui, interval) {
    elm.addEventListener("click", () => {
        ui.remove();
        if (interval) clearInterval(interval);
    });
}

function minimizeWindow(elm, ui) {
    elm.addEventListener("click", () => {
        ui.classList.toggle("minimized");
    });
}

function lookUpLinks() {
    return {
        "Google search": "https://www.google.com/search?q={search_term}",
        "Cambridge dictionary": "https://dictionary.cambridge.org/dictionary/english/{search_term}",
        "Longman dictionary": "https://www.ldoceonline.com/dictionary/{search_term}",
        "Oxford dictionary": "https://www.oxfordlearnersdictionaries.com/definition/english/{search_term}",
        "Webster dictionary": "https://www.merriam-webster.com/dictionary/{search_term}",
        "Collins dictionary": "https://www.collinsdictionary.com/dictionary/english/{search_term}",
        "vocabulary.com": "https://www.vocabulary.com/dictionary/{search_term}",
        "dictionary.com": "https://www.dictionary.com/browse/{search_term}",
        "Youglish.com": "https://youglish.com/pronounce/{search_term}/english",
        "Image search": "https://www.google.com/search?tbm=isch&q={search_term}",
        "Google Map": "https://www.google.com/maps/place/{search_term}",
        Wikipedia: "https://en.wikipedia.org/wiki/{search_term}",
        "Youtube search": "https://www.youtube.com/results?search_query={search_term}",
        "Facebook search": "https://www.facebook.com/search/top/?q={search_term}",
        "News search": "https://www.google.com/search?tbm=nws&q={search_term}",
        "Pdf search": "https://www.google.com/search?q={search_term}&as_filetype=pdf",
        "Book library": "https://www.libgen.is/search.php?req={search_term}",
        Github: "https://github.com/search?q={search_term}",
    };
}
