import Site from "./classes/Site.js"
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
    try {
        url = Site.parseURL(url);

        const storage = await chrome.storage.local.get();
        const sites = new SitesStorage(storage.sites);
        const site = sites.search(url)[0];
        let enabled = !!site?.enabled;
        if (storage.inverse) { enabled = !enabled }

        const supportedStyles = [
            "maxWidth",
            "marginLeft",
        ];

        const styles = {};
        const chosenStyles = site?.useOwnStyles ? site.styles : storage.globalStyles;
        for (const prop of supportedStyles) {
            styles[prop] = enabled ? chosenStyles[prop] : null;
        }

        chrome.tabs.sendMessage(tabId, { styles }).catch(error => {
            const contentScriptError = "Error: Could not establish connection. Receiving end does not exist."
            if (error.toString() === contentScriptError) {
                console.log(`Cannot modify tab with url ${url} (tab id ${tabId}).`);
            } else {
                console.error(error)
            }
        });
    } catch (error) {
        console.log(error);
        console.log("Skipping", url);
    }
}

/**
 * @param {string} style - a CSS-Like length value (e.g: "100px", "33.3%")
 *
 * @typedef {Object} Style
 * @property {string} number
 * @property {string} unit
 *
 * @returns {Style}
 */
function parseStyle(style) {
    const match = style
        .replace(/\s+/g, "")
        .match(/(?<number>-?\d*\.?\d*)(?<unit>\D*)/);

    const number = match.groups.number;
    const unit = match.groups.unit;

    if (!number) {
        throw new Error("Missing numeric value");
    }

    if (isNaN(parseFloat(number))) {
        throw new Error("Invalid numeric value");
    }

    if (parseFloat(number) < 0) {
        throw new Error("Value must not be negative");
    }

    if (!unit) {
        throw new Error("Missing unit");
    }

    if (!["%", "px"].includes(unit)) {
        throw new Error("Invalid unit. Must be one of 'px', '%'");
    }

    return match.groups
}

function splitCSSValues(styles) {
    const split = {}
    for (const prop in styles) {
        split[prop] = parseStyle(styles[prop]);
    }
    return split;
}

export { getTab, styleTabs, applyStyles, parseStyle, splitCSSValues };
