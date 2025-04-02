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
    const matchingSite = getMatchingSite(sites, url);
    if (matchingSite?.enabled) {
        const styles = matchingSite.useOwnStyles ? matchingSite.styles : globalStyles;
        chrome.tabs.sendMessage(tabId, { styles: styles });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "popup") {
        popup().then(sendResponse);
    }
    if (request.action === "enable_switch_toggled") {
        enableSwitchToggled(request.checked) // No response needed
    }
    if (request.action === "site_switch_toggled") {
        siteSwitchToggled(request.url, request.checked).then(sendResponse);
    }
    if (request.action === "remove_site_clicked") {
        removeSiteClicked(request.url).then(sendResponse);
    }
    if (request.action === "apply_button_clicked") {
        applyButtonClicked(request.styles);
    }
    return true;
});

async function popup() {
    const response = {};
    const tab = await getTab();
    const { sites, globalStyles } = await chrome.storage.local.get();
    if (!tab) throw new Error("Could not get active tab");
    if (!tab.url) throw new Error("Could not get tab's URL");
    const matchingSite = getMatchingSite(sites, tab.url);
    response.data = {
        tabUrl: tab.url,
        sites: sites,
        matchingSite: matchingSite,
        styles: matchingSite?.useOwnStyles ? matchingSite?.styles : globalStyles
    };
    return response;
}

async function applyButtonClicked(styles) {
    chrome.storage.local.set({ globalStyles: styles });
}

async function removeSiteClicked(url) {
    const { sites } = await chrome.storage.local.get("sites");
    const response = {};
    response.data = {
        sites: removeSite(sites, url)
    }
    return response;
}

async function enableSwitchToggled(checked) {
    const { sites, globalStyles } = await chrome.storage.local.get(["sites", "globalStyles"]);
    const tab = await getTab();
    const matchingSite = getMatchingSite(sites, tab.url);
    const styles = checked
        ? (matchingSite?.useOwnStyles ? matchingSite.styles : globalStyles)
        : null;
    chrome.tabs.sendMessage(tab.id, { styles: styles });
}

/** Equivalent chrome.tabs.query({ active: true, lastFocusedWindow: true }) */
async function getTab() {
    const lastFocusedWindow = await chrome.windows.getLastFocused();
    const tabs = await chrome.tabs.query({ active: true });
    return tabs.find(t => t.windowId === lastFocusedWindow.id);
}

async function siteSwitchToggled(url, checked) {
    const { sites, globalStyles } = await chrome.storage.local.get(["sites", "globalStyles"]);
    const matchingSite = getMatchingSite(sites, url);

    let sitesNew = sites;
    if (matchingSite) {
        matchingSite.enabled = checked;
        sitesNew = updateSite(sites, url, matchingSite);
    } else {
        if (checked) {
            sitesNew = addSite(sites, url);
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

/**
 * Looks for a URL in the given list of sites and returns the best matching Site if any, otherwise
 * returns undefined.
 *
 * @param {Array<Site>} sites - The original array of sites.
 * @param {string} url - The URL to be searched for.
 * @returns {Site|undefined} - The Site with the best matching URL or undefined if none matches.
 */
function getMatchingSite(sites, url) {
    return sites
        .filter(site => matchesURL(url, site.url))
        // Consider the longest matched URL as the best match
        .sort((a, b) => a.url.length - b.url.length)[0];
}

/**
 * Adds a new Site to storage with a given URL if none matches exactly. Returns the new value of
 * 'sites' from storage in either case.
 *
 * @param {Array<Site>} sites- The original array of sites.
 * @param {string} url - The url of the site to be added.
 * @returns {Array<Site>} - The new array of 'sites'.
 */
function addSite(sites, url) {
    const duplicates = sites.find(site => site.url === url);
    if (!duplicates && url) {
        sites.push(new Site(url));
        chrome.storage.local.set({ sites: sites });
    }
    return sites;
}

/**
 * Looks for a Site with an exact url within a given array of 'sites'. If one is found, its value is
 * replaced with the given 'site' and writes this new array to storage. Returns the new value of
 * 'sites'.
 *
 * @param {Array<Site>} sites - The original array of sites.
 * @param {string} url - The exact url of the site that should be changed.
 * @param {Site} site - The new value for the matched site in storage.
 *
 * @returns {Array<Site>} - The value of 'sites'.
 */
function updateSite(sites, url, site) {
    const index = sites.findIndex((s) => s.url === url);
    if (index > -1) {
        sites = sites.with(index, site)
        chrome.storage.local.set({ sites: sites });
    }
    return sites;
}

/**
 * Looks for a Site with an exact url within a given array of 'sites'. If one is found, it gets
 * removed from the array and writes this new array to storage. Returns the new value of 'sites'.
 *
 * @param {Array<Site>} sites - The original array of sites.
 * @param {string} url - The exact url of the site that should be removed.
 * @returns {Array<Site>} - The value of sites.
 */
function removeSite(sites, url) {
    const index = sites.findIndex((site) => site.url === url);
    if (index > -1) {
        sites = sites.toSpliced(index, 1)
        chrome.storage.local.set({ sites: sites });
    }
    return sites;
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
            styles = !matchesDisabledSite(sites, url) ? styles : null;
            chrome.tabs.sendMessage(tab.id, { styles: styles });
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
function matchesDisabledSite(sites, url) {
    return sites.some(site => matchesURL(url, site.url) && site.enabled === false)
}
