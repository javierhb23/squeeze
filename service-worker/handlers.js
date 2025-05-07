import SitesStorage from "./classes/SitesStorage.js";
import { getTab, applyStyles } from "./utils.js";

function messageHandler(request, sender, sendResponse) {
    const actions = {
        "info": info,
        "add_site": addSite,
        // "toggle_site": siteSwitchToggled,
        "remove": removeSite,
        "update_styles": updateStyles,
    };
    const requestHandler = actions[request.action];
    requestHandler(request).then(sendResponse);

    return true;
}

function webNavigationHandler({ url, tabId }) {
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
        applyStyles();
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
    } catch (error) {
        response.status = error.name;
        response.error = error.message;
    }
    return response;
}

async function siteSwitchToggled(request) {
    const storage = await chrome.storage.local.get(["sites", "globalStyles"]);
    const sites = new SitesStorage(storage.sites);
    const matchingSite = sites.search(request.url)[0];

    if (request.checked && !matchingSite) {
        sites.add(request.url);
    } else if (matchingSite) {
        matchingSite.enabled = request.checked;
        sites.update(request.url, matchingSite);
    }
    return response;
}

export { messageHandler, webNavigationHandler };
