import Site from "./classes/Site.js";
import SitesStorage from "./classes/SitesStorage.js";
import { getTab, applyStyles, styleTabs } from "./utils.js";

function messageHandler(request, sender, sendResponse) {
    const actions = {
        "info": info,
        "add_site": addSite,
        "remove": removeSite,
        "update_styles": updateStyles,
    };
    const requestHandler = actions[request.action];
    requestHandler(request).then(sendResponse);

    return true;
}

async function webNavigationHandler({ url, tabId }) {
    url = Site.parseURL(url);
    applyStyles(url, tabId);
}

/**
 * A try-catch wrapper for request handling functions (async only).
 *
 * @param {function(): Promise} fn - A request handling function
 * @returns {function(): Promise}
 */
function errorHandler(fn) {
    return async function (request) {
        return fn(...arguments).catch(error => {
            return {
                request: request,
                status: "error",
                errorName: error.name,
                errorMessage: error.message
            }
        });
    }
}

const info = errorHandler(async (request) => {
    const tab = await getTab();
    const storage = await chrome.storage.local.get();
    const sites = new SitesStorage(storage.sites);
    const matchingSite = sites.search(tab.url)[0];

    const response = {
        request,
        tabUrl: tab.url,
        matchingSite: matchingSite ?? null,
        storage: storage
    };
    return response;
});

const updateStyles = errorHandler(async (request) => {
    const response = { request };
    await chrome.storage.local.set({ globalStyles: request.styles });
    styleTabs();
    return response;
});

const addSite = errorHandler(async (request) => {
    const storage = await chrome.storage.local.get();
    const sites = new SitesStorage(storage.sites);
    const response = { request };
    await sites.add(request.url);
    styleTabs();
    response.status = `${request.url} was added to storage successfully`
    return response;
});

const removeSite = errorHandler(async (request) => {
    const response = { request };
    const storage = await chrome.storage.local.get("sites");
    const sites = new SitesStorage(storage.sites);
    await sites.remove(request.url);
    styleTabs();
    response.status = `${request.url} was removed successfully`
    return response;
});

export { messageHandler, webNavigationHandler };
