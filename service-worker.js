class Site {
    constructor(url, enabled = true, useOwnStyles = false, styles = {}) {
        this.url = url;
        this.enabled = enabled;
        this.useOwnStyles = useOwnStyles;
        this.styles = styles
    }
}

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
    const matchingSite = getMatchingSite(url, sites);
    if (matchingSite?.enabled) {
        const styles = matchingSite.useOwnStyles ? matchingSite.styles : globalStyles;
        chrome.tabs.sendMessage(tabId, { styles: styles });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "popup") {
        popup().then(sendResponse);
    }
    if (request.action === "site_switch_toggled") {
        siteSwitchToggled(request.url, request.checked).then(sendResponse);
    }
    return true;
});

async function popup() {
    const response = {};
    try {
        const tab = await getTab();
        const { sites, globalStyles } = await chrome.storage.local.get();
        if (!tab) throw new Error("Could not get active tab");
        if (!tab.url) throw new Error("Could not get tab's URL");
        const matchingSite = getMatchingSite(tab.url, sites);
        response.data = {
            tabUrl: tab.url,
            sites: sites,
            matchingSite: matchingSite,
            styles: matchingSite?.useOwnStyles ? matchingSite?.styles : globalStyles
        };
    } catch (e) {
        response.error = e.message;
    }
    return response;
}

/** Equivalent chrome.tabs.query({ active: true, lastFocusedWindow: true }) */
async function getTab() {
    const lastFocusedWindow = await chrome.windows.getLastFocused();
    const tabs = await chrome.tabs.query({ active: true });
    return tabs.find(t => t.windowId === lastFocusedWindow.id);
}

async function siteSwitchToggled(url, checked) {
    const { sites, globalStyles } = await chrome.storage.local.get(["sites", "globalStyles"]);
    const matchingSite = getMatchingSite(url, sites);

    let sitesNew;
    if (matchingSite) {
        matchingSite.enabled = checked;
        sitesNew = await updateSite(url, sites, matchingSite);
    } else {
        if (checked) {
            sitesNew = await addSite(url, sites);
        } else {
            sitesNew = sites;
        }
    }
    const styles = checked
        ? (matchingSite.useOwnStyles ? matchingSite.styles : globalStyles)
        : null;
    styleTabs(url, styles, sitesNew);

    const response = {
        data: {
            sites: sitesNew
        }
    }

    return response;
}

/**
 * Looks for a URL in the given list of sites and returns the best matching Site if any, otherwise
 * returns undefined.
 *
 * @param {string} url - The URL to be searched for.
 * @param {Array<Site>} sites - A list of sites.
 * @returns {Site|undefined} - The Site with the best matching URL or undefined if none matches.
 */
function getMatchingSite(url, sites) {
    return sites
        .filter(site => matchesURL(url, site.url))
        // Consider the longest matched URL as the best match
        .sort((a, b) => a.url.length - b.url.length)[0];
}

/**
 * Adds a new Site to storage with a given URL if none matches exactly. Returns a promise requesting
 * the new value of 'sites' from storage in either case.
 *
 * @param {string} url - The url of the site to be added.
 * @param {Array<Site>} sites
 * @returns {Promise<Array<Site>>} - A promise with the value of 'sites' from storage.
 */
function addSite(url, sites) {
    const duplicates = sites.find(site => site.url === url);
    if (!duplicates) {
        sites.push(new Site);
        chrome.storage.local.set({ sites });
    }
    return chrome.storage.local.get("sites");;
}

/**
 * Looks for a Site in storage with a given url, and if one is found, replaces it with the given
 * value. Returns a promise requesting the new value of 'sites' from storage in either case.
 *
 * @param {string} url - The exact url of the site that should be changed.
 * @param {Array<Site>} sites - The original array of sites.
 * @param {Site} site - The new value for the matched site in storage.
 *
 * @returns {Promise<Array<Site>>} - A promise with the value of 'sites' from storage.*/
async function updateSite(url, sites, site) {
    const index = sites.findIndex((s) => s.url === url);
    if (index > -1) {
        await chrome.storage.local.set({ sites: sites.with(index, site) });
    }
    return chrome.storage.local.get("sites");
}

/**
 * Looks for a Site in storage with a given url, and if one is found, deletes it from storage.
 * Returns a promise requesting the new value of 'sites' from storage in either case.
 *
 * @param {string} url - The exact url of the site that should be removed.
 * @returns {Promise<Array<Site>>} - A promise with the value of 'sites' from storage.
 */
async function removeSite(url) {
    const { sites } = await chrome.storage.local.get("sites");
    const index = sites.findIndex((site) => site.url === url);
    if (index > -1) {
        await chrome.storage.local.set({ "sites": sites.toSpliced(index, 1) });
    }
    return chrome.storage.local.get("sites");
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
    tabs.filter(tab => matchesURL(tab.url, url))
        .forEach(tab => {
            const _styles = matchesDisabledSite(url, sites) ? null : styles;
            chrome.tabs.sendMessage(tab.id, { styles: _styles });
        });
}

/**
 * Checks a URL against a given pattern and returns true if it matches or false otherwise. The
 * pattern may contain asterisks ('*'), which will be treated as wildcards.
 *
 * @param {string} url - The URL to check.
 * @param {string} pattern - The pattern to match against.
 * @returns {boolean}
 */
function matchesURL(url, pattern) {
    return RegExp(pattern.replaceAll("*", ".*")).test(url);
}

/**
 * Checks a URL against a list of Sites and returns true if it matches at least one Site whose
 * 'enabled' state is false, meaning it should not be styled. Returns false otherwise.
 *
 * @param {string} url
 * @param {Array<Site>} sites
 * @returns {boolean}
 */
function matchesDisabledSite(url, sites) {
    return sites.some(site => matchesURL(url, site.url) && site.enabled === false)
}
