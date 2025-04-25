import SitesStorage from "./classes/SitesStorage.js";
import { getTab, applyStyles } from "./utils.js";

export async function popup() {
    const tab = await getTab();
    const storage = await chrome.storage.local.get();
    const sites = new SitesStorage(storage.sites);
    const matchingSite = sites.search(tab.url)[0];

    const styles = matchingSite?.useOwnStyles
        ? matchingSite?.styles
        : storage.globalStyles;

    const response = {};
    response.data = {
        tabUrl: tab.url,
        sites: sites.sites,
        matchingSite: matchingSite,
        styles: styles
    };
    return response;
}

export async function applyButtonClicked(request) {
    await chrome.storage.local.set({ globalStyles: request.styles });
    applyStyles();
}

export async function removeSiteClicked(request) {
    const storage = await chrome.storage.local.get("sites");
    const sites = new SitesStorage(storage.sites);
    sites.remove(request.url);
}

export async function siteSwitchToggled(request) {
    const storage = await chrome.storage.local.get("sites", "globalStyles");
    const sites = new SitesStorage(storage.sites);
    const matchingSite = sites.search(request.url)[0];

    if (request.checked && !matchingSite) {
        sites.add(request.url);
    } else if (matchingSite) {
        matchingSite.enabled = request.checked;
        sites.update(request.url, matchingSite);
    }
}

export async function navigation({url, tabId}) {
    console.log("detected navigation");
    console.log(url);
    console.log(tabId);
}