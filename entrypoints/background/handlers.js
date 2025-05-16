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

async function info(request) {
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
}

async function updateStyles(request) {
    const response = { request };
    try {
        await chrome.storage.local.set({ globalStyles: request.styles });
        styleTabs();
    } catch (error) {
        response.status = error.name;
        response.error = error.message;
    }
    return response;
}

async function addSite(request) {
    const storage = await chrome.storage.local.get();
    const sites = new SitesStorage(storage.sites);

    const response = { request };
    try {
        sites.add(request.url);
        styleTabs();
        response.status = `${request.url} was added to storage successfully`
    } catch (error) {
        response.status = error.name;
        response.error = error.message;
    }
    return response;
}

async function removeSite(request) {
    const response = { request };
    const storage = await chrome.storage.local.get("sites");
    const sites = new SitesStorage(storage.sites);
    try {
        sites.remove(request.url);
        styleTabs();
    } catch (error) {
        response.status = error.name;
        response.error = error.message;
    }
    return response;
}

export { messageHandler, webNavigationHandler };
