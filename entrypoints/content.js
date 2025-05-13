export default defineContentScript({
    matches: ['<all_urls>'],
    main() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message === "ping") {
                sendResponse("pong");
                return true;
            }

            if (message.styles) {
                // Apply given styles
                for (const prop in message.styles) {
                    document.body.style[prop] = message.styles[prop] ?? null;
                }
            }
        });
    },
});
