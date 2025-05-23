import SitesStorage from "./classes/SitesStorage.js";
import { getTab, applyStyles, styleTabs, splitCSSValues, parseStyle } from "./utils.js";

function messageHandler(request, sender, sendResponse) {
    const actions = {
        "info": info,
        "add_site": addSite,
        "remove": removeSite,
        "update_styles": updateStyles,
        "toggle_inverse": toggleInverse,
    };
    const requestHandler = actions[request.action];
    requestHandler(request).then(sendResponse);

    return true;
}

function webNavigationHandler({ url, tabId }) {
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
                error: {
                    name: error.name,
                    message: error.message
                }
            }
        });
    }
}

const info = errorHandler(async (request) => {
    const tab = await getTab();
    const storage = await chrome.storage.local.get();
    const sites = new SitesStorage(storage.sites);
    const matchingSite = sites.search(tab.url)[0];
    const globalStyles = splitCSSValues(storage.globalStyles);

    const response = {
        request,
        tabUrl: tab.url,
        matchingSite: matchingSite ?? null,
        storage: storage,
        globalStyles
    };
    return response;
});

const updateStyles = errorHandler(async (request) => {
    const styles = request.styles;

    // Check for errors in request
    if (!styles) throw new Error("Expected 'styles' in request object");

    // Check for errors in each style declaration
    for (const prop in styles) {
        parseStyle(styles[prop]); // Will throw an Error if a style is invalid
    }

    await chrome.storage.local.set({ globalStyles: request.styles });
    styleTabs();
    const response = {
        request: request,
        status: "Successfully updated global styles"
    };
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

const toggleInverse = errorHandler(async (request) => {
    const value = (() => {
        // Convert string to boolean
        switch (request.value) {
            case "true": return true;
            case "false": return false;
            default: throw new Error("Hey pal, what's the big idea here?");
        }
    })();

    await chrome.storage.local.set({
        inverse: value
    });

    styleTabs();
    const response = {
        request: request,
        status: `Inverse has been set to ${value}`
    };
    return response;
});

export { messageHandler, webNavigationHandler };
