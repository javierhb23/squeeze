chrome.runtime.onMessage.addListener((message) => {
    if (Object.hasOwn(message, "styles")) {
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
