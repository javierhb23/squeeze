import { messageHandler, webNavigationHandler } from "./handlers.js";

chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        chrome.storage.local.set({
            inverse: false,
            globalStyles: {
                maxWidth: "1000px",
                marginLeft: "200px"
            },
            sites: []
        });
    }
});

chrome.webNavigation.onCompleted.addListener(webNavigationHandler);

chrome.runtime.onMessage.addListener(messageHandler);
