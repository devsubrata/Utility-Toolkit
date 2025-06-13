function makeDraggable(el) {
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
        el.style.left = `${e.clientX - offsetX}px`;
        el.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        document.body.style.userSelect = "";
        titleBar.style.cursor = "grab";
    });
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
        <div class="color-swatch" data-color="#f43f5e" style="background-color: #f43f5e"></div>
        <div class="color-swatch" data-color="#9f1239" style="background-color: #9f1239"></div>
        <div class="color-swatch" data-color="#4B0001" style="background-color: #4B0001"></div>
        <div class="color-swatch" data-color="#964B00" style="background-color: #964B00"></div>
        <div class="color-swatch" data-color="#BE5103" style="background-color: #BE5103"></div>
        <div class="color-swatch" data-color="#ffa500" style="background-color: #ffa500"></div>
        <div class="color-swatch" data-color="#00ff00" style="background-color: #00ff00"></div>
        <div class="color-swatch" data-color="#009c1a" style="background-color: #009c1a"></div>
        <div class="color-swatch" data-color="#429A31" style="background-color: #429A31"></div>
        <div class="color-swatch" data-color="#84cc16" style="background-color: #84cc16"></div>
        <div class="color-swatch" data-color="#365314" style="background-color: #365314"></div>
        <div class="color-swatch" data-color="#134e4a" style="background-color: #134e4a"></div>
        <div class="color-swatch" data-color="#050372" style="background-color: #050372"></div>
        <div class="color-swatch" data-color="#0000ff" style="background-color: #0000ff"></div>
        <div class="color-swatch" data-color="#0047ab" style="background-color: #0047ab"></div>
        <div class="color-swatch" data-color="#2B0057" style="background-color: #2B0057"></div>
        <div class="color-swatch" data-color="#51158C" style="background-color: #51158C"></div>
        <div class="color-swatch" data-color="#7F00FF" style="background-color: #7F00FF"></div>
        <div class="color-swatch" data-color="#B163FF" style="background-color: #B163FF"></div>
        <div class="color-swatch" data-color="#ff00ff" style="background-color: #ff00ff"></div>
        <div class="color-swatch" data-color="#0e98ba" style="background-color: #0e98ba"></div>
        <div class="color-swatch" data-color="#00ffff" style="background-color: #00ffff"></div>
        <div class="color-swatch" data-color="#ffff00" style="background-color: #ffff00"></div>
    `;
}

function consoleLog(log) {
    chrome.runtime.sendMessage({ action: "logMessage", msg: log });
}

function uploadSongList() {
    const EnglishSongs = [
        {
            song_name: "Die With A Smile",
            artists: "Bruno Mars, Lady Gaga",
            video_id: "kPa7bsKwL-c, zgaCZOQCpp8",
        },
        {
            song_name: "Roar",
            artists: "Katy Perry",
            video_id: "CevxZvSJLk8",
        },
        {
            song_name: "Never Gonna Give You Up",
            artists: "Rick Astley",
            video_id: "dQw4w9WgXcQ",
        },
        {
            song_name: "Blank Space",
            artists: "Taylor Swift",
            video_id: "e-ORhEE9VVg, nAQ_1lTDvPQ",
        },
        {
            song_name: "Just The Way You Are",
            artists: "Bruno Mars",
            video_id: "LjhCEhWiKXk, u7XjPmN-tHw",
        },
        {
            song_name: "APT",
            artists: "ROSÉ & Bruno Mars",
            video_id: "ekr2nIex040",
        },
        {
            song_name: "Shape of You",
            artists: "Ed Sheeran",
            video_id: "JGwWNGJdvx8, liTfD88dbCo",
        },
        {
            song_name: "It's My Life",
            artists: "Bon Jovi",
            video_id: "vx2u5uUu3DE",
        },
        {
            song_name: "Faded",
            artists: "Alan Walker",
            video_id: "60ItHLz5WEA",
        },
        {
            song_name: "Hotel California",
            artists: "Eagles",
            video_id: "09839DpTctU",
        },
        {
            song_name: "(Everything I Do) I Do It For You",
            artists: "Bryan Adams",
            video_id: "Y0pdQU87dc8",
        },
        {
            song_name: "Summer Of '69",
            artists: "Bryan Adams",
            video_id: "eFjjO_lhf9c",
        },
        {
            song_name: "My Heart Will Go On",
            artists: "Céline Dion",
            video_id: "9bFHsd3o1w0",
        },
    ];

    // Save to localStorage as JSON string
    localStorage.setItem("EnglishSongs", JSON.stringify(EnglishSongs));

    consoleLog("EnglishSongs saved to localStorage!");
}
