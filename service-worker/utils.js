import * as Sites from './sites.js'

/** Equivalent chrome.tabs.query({ active: true, lastFocusedWindow: true }) */
async function getTab() {
    const lastFocusedWindow = await chrome.windows.getLastFocused();
    const tabs = await chrome.tabs.query({ active: true });
    return tabs.find(t => t.windowId === lastFocusedWindow.id);
}

/**
 * Queries all browser tabs and filters those which match a given URL pattern and applies the given
 * styles.
 *
 * @param {string} url - The URL pattern to filter tabs with.
 * @param {object} styles
 * @param {Array<Site>} sites
 */
async function styleTabs(url, styles, sites) {
    const tabs = await chrome.tabs.query({});
    tabs.filter(tab => Sites.matchesURL(tab.url, url))
        .forEach(tab => {
            styles = !Sites.matchesDisabledSite(sites, url) ? styles : null;
            chrome.tabs.sendMessage(tab.id, { styles: styles });
        });
}

export { getTab, styleTabs };
