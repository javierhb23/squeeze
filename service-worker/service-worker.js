import { getTab, styleTabs } from './utils.js';
import * as Sites from './sites.js';

// Set defaults
chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        chrome.storage.local.set({
            globalStyles: {
                maxWidth: "1000px",
                marginLeft: "200px"
            },
            sites: []
        });
    }
});

// Apply globalStyles styles on page load if site matches a storage URL
chrome.webNavigation.onCompleted.addListener(async ({ url, tabId }) => {
    const { sites, globalStyles } = await chrome.storage.local.get();
    const matchingSite = Sites.getMatchingSite(sites, url);
    if (matchingSite?.enabled) {
        const styles = matchingSite.useOwnStyles ? matchingSite.styles : globalStyles;
        chrome.tabs.sendMessage(tabId, { styles: styles });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const actions = {
        "popup": popup,
        "toggle_page": enableSwitchToggled,
        "toggle_site": siteSwitchToggled,
        "remove": removeSiteClicked,
        "update_styles": applyButtonClicked,
    };
    const requestHandler = actions[request.action];
    requestHandler(request).then(sendResponse);

    return true;
});

async function popup() {
    const tab = await getTab();
    const { sites, globalStyles } = await chrome.storage.local.get();
    if (!tab) throw new Error("Could not get active tab");
    if (!tab.url) throw new Error("Could not get tab's URL");
    const matchingSite = Sites.getMatchingSite(sites, tab.url);
    const response = {};
    response.data = {
        tabUrl: tab.url,
        sites: sites,
        matchingSite: matchingSite,
        styles: matchingSite?.useOwnStyles ? matchingSite?.styles : globalStyles
    };
    return response;
}

async function applyButtonClicked(request) {
    const { styles, checked } = request;
    const tab = await getTab();
    // If the 'enable for this page' switch was active, style the current tab with the new styles
    if (checked) {
        chrome.tabs.sendMessage(tab.id, { styles: styles });
    }
    chrome.storage.local.set({ globalStyles: styles });
}

async function removeSiteClicked(request) {
    const { url } = request;
    const { sites } = await chrome.storage.local.get("sites");
    const response = {};
    response.data = {
        sites: Sites.removeSite(sites, url)
    }
    return response;
}

async function enableSwitchToggled(request) {
    const { checked } = request;
    const { sites, globalStyles } = await chrome.storage.local.get(["sites", "globalStyles"]);
    const tab = await getTab();
    const matchingSite = Sites.getMatchingSite(sites, tab.url);
    const styles = checked
        ? (matchingSite?.useOwnStyles ? matchingSite.styles : globalStyles)
        : null;
    chrome.tabs.sendMessage(tab.id, { styles: styles });
}

async function siteSwitchToggled(request) {
    const { url, checked } = request;
    const { sites, globalStyles } = await chrome.storage.local.get(["sites", "globalStyles"]);
    const matchingSite = Sites.getMatchingSite(sites, url);

    let sitesNew = sites;
    if (matchingSite) {
        matchingSite.enabled = checked;
        sitesNew = Sites.updateSite(sites, url, matchingSite);
    } else {
        if (checked) {
            sitesNew = Sites.addSite(sites, url);
        }
    }
    const styles = checked
        ? (matchingSite?.useOwnStyles ? matchingSite?.styles : globalStyles)
        : null;
    styleTabs(url, styles, sitesNew);

    const response = {}
    response.data = {
        sites: sitesNew
    }
    return response;
}
