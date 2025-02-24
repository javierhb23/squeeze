// TODO: Retrieve saved settings and apply them on page load
chrome.storage.local.get().then(storage => {
    console.log("chrome.storage.local.get()");
    console.log(storage);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        /*
        if (message.action === "enable") {
            // TODO: Retrieve styles for website URL
            // TODO: Apply retrieved styles
        }
        if (message.action === "disable") {
            // TODO: Remove styles
        }
        if (message.action === "update") {
            if (message.site) {
                if (message.url) { }
            }
        }
    }
    */
    } catch (error) {
        console.log(error);
        sendResponse({ "error": error });
    }
});

function applyStyles(styles = {}) {
    for (const prop of []) {
        document.body.style[prop] = styles[prop] ?? null;
    }
}
