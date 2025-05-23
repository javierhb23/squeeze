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

    const response = {
        request,
        tabUrl: tab.url,
        matchingSite: matchingSite ?? null,
        storage: storage
    };
    return response;
});

const updateStyles = errorHandler(async (request) => {
    const styles = request.styles;

    // Check for errors in request
    if (!styles) throw new Error("Expected 'styles' in request object");
    for (const prop in styles) {
        const number = styles[prop].match(/\d+/);
        const unit = styles[prop].match(/\D+/);
        if (!number) throw new Error("Missing numeric value");
        if (!unit) throw new Error("Missing unit value");
        const isInvalidNumber = string => isNaN(parseFloat(string));
        const isInvalidUnit = string => !["%", "px"].includes(string);
        if (isInvalidNumber(number[0])) throw new Error("Invalid numeric value");
        if (isInvalidUnit(unit[0])) throw new Error("Invalid unit. Must be one of 'px', '%'");
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

export { messageHandler, webNavigationHandler };
