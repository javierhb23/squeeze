import SitesStorage from "./classes/SitesStorage.js";
import { getTab, applyStyles } from "./utils.js";

function messageHandler(request, sender, sendResponse) {
    const actions = {
        "info": info,
        "toggle_site": siteSwitchToggled,
        "remove": removeSiteClicked,
        "update_styles": applyButtonClicked,
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
        tabUrl: tab.url,
        matchingSite: matchingSite ?? null,
        storage: storage
    };
    return response;
}

async function applyButtonClicked(request) {
    await chrome.storage.local.set({ globalStyles: request.styles });
    applyStyles();
}

async function removeSiteClicked(request) {
    const storage = await chrome.storage.local.get("sites");
    const sites = new SitesStorage(storage.sites);
    sites.remove(request.url);
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
}

export { messageHandler, webNavigationHandler };
