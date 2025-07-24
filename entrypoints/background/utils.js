import Site from "./classes/Site.js"
import SitesStorage from "./classes/SitesStorage.js";
import { SELECTORS } from "/utils/definitions.js";

/** Equivalent browser.tabs.query({ active: true, lastFocusedWindow: true }) */
async function getTab() {
    const lastFocusedWindow = await browser.windows.getLastFocused();
    const tabs = await browser.tabs.query({ active: true });
    const activeTab = tabs.find(t => t.windowId === lastFocusedWindow.id);
    if (!activeTab) throw new Error("Could not get active tab");
    if (!activeTab.url) throw new Error("Could not get tab's URL");
    return activeTab;
}

/** Queries all tabs and applies styles according to current settings. */
async function styleTabs() {
    const tabs = await browser.tabs.query({});
    tabs.forEach(tab => applyStyles(tab.url, tab.id));
}

async function applyStyles(url, tabId) {
    try {
        url = Site.cleanURL(url);
        Site.errorCheckURL(url);

        const storage = await browser.storage.local.get();
        const sites = new SitesStorage(storage.sites);
        const site = sites.search(url)[0];
        let enabled = !!site?.enabled;
        if (storage.inverse) { enabled = !enabled }

        const supportedStyles = Object.keys(SELECTORS);

        const styles = {};
        const chosenStyles = site?.useOwnStyles ? site.styles : storage.globalStyles;
        for (const prop of supportedStyles) {
            styles[prop] = enabled ? chosenStyles[prop] : null;
        }

        browser.tabs.sendMessage(tabId, { styles });
    } catch (error) {
        console.log("Cannot apply styles to", url);
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
