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
async function applyStyles() {
    const storage = await chrome.storage.local.get();
    const sites = new SitesStorage(storage.sites);

    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
        const matchingSite = sites.search(tab.url)[0];
        let enabled = matchingSite?.enabled ?? false;

        if (storage.inverse === true) enabled = !enabled;

        const styles = enabled ? chooseStyles(matchingSite) : null;

        try {
            const tabResponse = await chrome.tabs.sendMessage(tab.id, "ping");
            if (tabResponse === "pong") {
                chrome.tabs.sendMessage(tab.id, { styles });
            }
        } catch (error) {
            // An error that says "Could not establish connection. Receiving end does not exist"
            // likely means the content script for that tab has not been registered.
            console.error(error);
        }

    }

    function chooseStyles(site) {
        return site?.useOwnStyles
            ? site.styles
            : storage.globalStyles;
    }
}

export { getTab, applyStyles };
