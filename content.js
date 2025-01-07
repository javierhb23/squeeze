chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        if (message.action === "enable") applyStyles(message.styles);
        else if (message.action === "disable") applyStyles(null);

        if (message.request === "lookup") {
            if (message.url) {
                // TODO: lookup saved urls for matches
            } else {
                throw new Error("URL not specified");
            }
        }

    } catch (error) {
        console.log(error);
        sendResponse(error);
    }
});

function applyStyles(styles = {}) {
    for (const prop of properties) {
        document.body.style[prop] = styles[prop] ?? null;
    }
}
