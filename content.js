// TODO: Retrieve saved settings and apply them on page load

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        console.log(message);
        if (message["global"]) {
            applyStyles(message["global"]);
        }
    } catch (error) {
        console.log(error);
        sendResponse({ "error": error });
    }
});

function applyStyles(styles = {}) {
    for (const prop in styles) {
        console.log(prop, styles[prop]);
        document.body.style[prop] = styles[prop] ?? null;
    }
}
