import * as Handlers from './handlers.js';

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

chrome.webNavigation.onCompleted.addListener(Handlers.navigation);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const actions = {
        "popup": Handlers.popup,
        "toggle_site": Handlers.siteSwitchToggled,
        "remove": Handlers.removeSiteClicked,
        "update_styles": Handlers.applyButtonClicked,
    };
    const requestHandler = actions[request.action];
    requestHandler(request).then(sendResponse);

    return true;
});
