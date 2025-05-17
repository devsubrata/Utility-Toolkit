if (!document.getElementById("openWeather")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("styles/weather.css");
    document.head.appendChild(link);

    const weatherDiv = document.createElement("div");
    weatherDiv.id = "weatherWidget";
    weatherDiv.classList.add("floating-window");
    weatherDiv.innerHTML = `
        <div class="title-bar">
            <span class="title">🌤 Weather</span>
            <span class="minimize-btn ctrl" title="Minimize">—</span>
            <span class="close-btn ctrl" title="Close">❌</span>
        </div>
        <div class="content">
            <div id="weatherOutput">Fetching location and weather...</div>
            <input type="text" id="cityInput" placeholder="Enter city (e.g., London)" />
            <button id="getWeatherBtn">Get Weather</button>
        </div>
    `;
    document.body.appendChild(weatherDiv);
    makeDraggable(weatherDiv);

    const API_KEY = "2285be78d7160c01e4222cf89a8f61ed"; // Replace with your OpenWeatherMap API key

    const weatherOutput = document.getElementById("weatherOutput");
    const input = document.getElementById("cityInput");
    const button = document.getElementById("getWeatherBtn");

    const displayWeather = (data) => {
        if (!data || !data.weather) {
            weatherOutput.textContent = "Weather info not found.";
            return;
        }
        const { name, main, weather } = data;
        weatherOutput.innerHTML = `
            <strong>${name}</strong><br>
            ${weather[0].main} - ${weather[0].description}<br>
            🌡 Temp: ${main.temp}°C | Humidity: ${main.humidity}%
        `;
    };

    const getWeatherByCoords = (lat, lon) => {
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
            .then((res) => res.json())
            .then(displayWeather)
            .catch(() => {
                weatherOutput.textContent = "Failed to fetch weather.";
            });
    };

    const getWeatherByCity = (city) => {
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`)
            .then((res) => res.json())
            .then(displayWeather)
            .catch(() => {
                weatherOutput.textContent = "City not found.";
            });
    };

    // On Load: Get current device location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                getWeatherByCoords(latitude, longitude);
            },
            () => {
                weatherOutput.textContent = "Location permission denied.";
            }
        );
    } else {
        weatherOutput.textContent = "Geolocation not supported.";
    }

    button.addEventListener("click", () => {
        const city = input.value.trim();
        if (city) getWeatherByCity(city);
    });

    minimizeWindow(weatherDiv.querySelector(".minimize-btn"), weatherDiv);
    closeWindow(weatherDiv.querySelector(".close-btn"), weatherDiv, null);
}
