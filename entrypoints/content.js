export default defineContentScript({
    matches: ['<all_urls>'],
    main() {
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.styles) {
                // Apply given styles
                for (const prop in message.styles) {
                    document.body.style[prop] = message.styles[prop] ?? null;
                }
            }
        });
    },
});
