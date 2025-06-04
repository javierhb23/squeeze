import { messageHandler, webNavigationHandler } from "./handlers.js";

export default defineBackground(() => {
    // Executed when background is loaded
    browser.webNavigation.onCompleted.addListener(webNavigationHandler);
    browser.runtime.onMessage.addListener(messageHandler);

    browser.runtime.onInstalled.addListener(({ reason }) => {
        if (reason === 'install') {
            browser.storage.local.set({
                inverse: false,
                globalStyles: {
                    maxWidth: "1000px",
                    marginLeft: "200px"
                },
                sites: []
            });
        }
    });
});
