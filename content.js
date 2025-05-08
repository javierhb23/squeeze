chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === "ping") {
        sendResponse("pong");
        return true;
    }

    if (message.styles) {
        // Remove existing inline styles
        for (const prop in document.body.style) {
            document.body.style[prop] = null;
        }
        // Apply given styles
        for (const prop in message.styles) {
            document.body.style[prop] = message.styles[prop] ?? null;
        }
    }
});
