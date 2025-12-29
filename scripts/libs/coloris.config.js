/** Default configuration **/
var swatches = [
    "#ffffff",
    "#000000",
    "#ff0000",
    "#fe3b00",
    "#f43f5e",
    "#ff0066",
    "#9f1239",
    "#4B0001",
    "#964B00",
    "#BE5103",
    "#ffa500",
    "#ffff00",
    "#00ff00",
    "#009c1a",
    "#429A31",
    "#84cc16",
    "#365314",
    "#134e4a",
    "#12c1ed",
    "#00ffff",
    "#050372",
    "#0000ff",
    "#0047ab",
    "#2B0057",
    "#51158C",
    "#7F00FF",
    "#6601ff",
    "#B163FF",
    "#cb00cc",
    "#ff00ff",
    "#cc00ff",
    "#fffee1",
];

Coloris({
    el: ".coloris",
    swatches: ["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51", "#d62828", "#023e8a", "#0077b6", "#0096c7", "#00b4d8", "#48cae4"],
});

/** Instances **/

Coloris.setInstance(".instance1", {
    theme: "pill",
    themeMode: "dark",
    formatToggle: true,
    closeButton: true,
    clearButton: true,
    swatches,
});

Coloris.setInstance(".instance2", { theme: "polaroid" });

Coloris.setInstance(".instance3", {
    theme: "polaroid",
    swatchesOnly: true,
});
