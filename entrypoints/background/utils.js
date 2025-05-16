import SitesStorage from "./classes/SitesStorage.js";

/** Equivalent chrome.tabs.query({ active: true, lastFocusedWindow: true }) */
async function getTab() {
    const lastFocusedWindow = await chrome.windows.getLastFocused();
    const tabs = await chrome.tabs.query({ active: true });
    const activeTab = tabs.find(t => t.windowId === lastFocusedWindow.id);
    if (!activeTab) throw new Error("Could not get active tab");
    if (!activeTab.url) throw new Error("Could not get tab's URL");
    return activeTab;
}

/** Queries all tabs and applies styles according to current settings. */
async function styleTabs() {
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => applyStyles(tab.url, tab.id));
}

async function applyStyles(url, tabId) {
    const storage = await chrome.storage.local.get();
    const sites = new SitesStorage(storage.sites);
    const site = sites.search(url)[0];
    let enabled = !!site?.enabled;
    if (storage.inverse) { enabled = !enabled }

    const chooseStyles = (site) => site?.useOwnStyles ? site.styles : storage.globalStyles;
    const styles = enabled ? chooseStyles(site) : null;

    chrome.tabs.sendMessage(tabId, { styles }).catch(error => {
        const contentScriptError = "Error: Could not establish connection. Receiving end does not exist."
        if (error.toString() === contentScriptError) {
            console.log(`Cannot modify tab with url ${url} (tab id ${tabId}).`);
        } else {
            console.error(error)
        }
    });
}

export { getTab, styleTabs, applyStyles };
