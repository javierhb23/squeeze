// Set defaults
chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        chrome.storage.local.set({
            "global": {
                "max-width": "1000px",
                "margin-left": "200px"
            },
            "sites": []
        });
    }
});

// Apply global styles on page load if site matches a storage URL
chrome.webNavigation.onCompleted.addListener(async ({ url, tabId }) => {
    const matchingSite = await getSite(url);
    if (matchingSite) {
        const { global } = await chrome.storage.local.get("global");
        try {
            chrome.tabs.sendMessage(tabId, { styles: global });
        } catch (error) {
            console.log(error);
        }
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const hasProperties = (obj, ...props) => props.every(prop => Object.hasOwn(obj, prop));

    if (hasProperties(request, "enable", "tabId")) {
        applyStyles(request.enable, request.tabId);
    }

    if (request.queryURL) {
        getSite(request.queryURL).then(site => sendResponse(site));
    }

    if (request.addSite) {
        addSite(request.addSite).then(sites => sendResponse(sites));
    }

    if (hasProperties(request, "updateSite", "newValue")) {
        updateSite(request.updateSite, request.newValue).then(sites => sendResponse(sites));
    }

    if (hasProperties(request, "removeSite")) {
        removeSite(request.removeSite).then(sites => sendResponse(sites));
    }

    return true;
});

async function applyStyles(enable, tabId) {
    if (enable) {
        const { global } = await chrome.storage.local.get("global");
        chrome.tabs.sendMessage(tabId, { styles: global });
    } else {
        chrome.tabs.sendMessage(tabId, { styles: null });
    }
}

/**
 * Adds a new Site object to storage, checking first that no other site shares the same exact URL to
 * avoid duplicates. Returns a promise requesting the new value of 'sites' from storage in either
 * case.
 *
 * @param {string} url - The url of the site to be added.
 * @returns {Promise<Array<Site>>} - A promise with the value of 'sites' from storage.
 */
async function addSite(url) {
    // Add site to storage
    const { sites } = await chrome.storage.local.get("sites");
    // Avoid duplicate URLs
    const duplicateURL = sites.some((site) => site.url === url);
    if (!duplicateURL)
        sites.push({ url: url, enabled: true });

    applyToAllTabsWithURL(url);
    await chrome.storage.local.set({ sites });
    return chrome.storage.local.get("sites");
}

/**
 * Looks for a URL in the extension's local storage and returns a Promise resolving to a matching
 * Site if any, otherwise resolves undefined.
 *
 * @param {string} url - The URL to be searched for.
 * @returns {Promise<Site|undefined>} - A matching Site if successful.
 */
function getSite(url) {
    return chrome.storage.local.get("sites").then(({ sites }) => {
        // TODO: Return most specific URL instead of first match
        return sites.find((site) => {
            const pattern = site.url.replaceAll("*", ".*"); // Use '*' for glob-matching
            return RegExp(pattern).test(url);
        });
    });
}

/**
 * Looks for a Site in storage with a given url, and if one is found, replaces it with the given
 * value. Returns a promise requesting the new value of 'sites' from storage in either case.
 *
 * @param {string} url - The exact url of the site that should be changed.
 * @param {Site} site - The new value for the matched site in storage.
 * @returns {Promise<Array<Site>>} - A promise with the value of 'sites' from storage.
 */
async function updateSite(url, site) {
    const { sites } = await chrome.storage.local.get("sites");
    const index = sites.findIndex((s) => s.url === url);
    if (index > -1) {
        console.log(`Updating value of ${sites[index]} to ${site}`);
        // Update with new value
        chrome.storage.local.set({
            "sites": sites.toSpliced(index, 1, site)
        });
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
 * Queries all browser tabs and filters those which match a given URL pattern -- excluding those
 * which match a Site whose 'enabled' state is set to false -- and applies the relevant styles.
 *
 * @param {string} url - The URL pattern to filter tabs with.
 */
async function applyToAllTabsWithURL(url) {
    const { sites } = await chrome.storage.local.get("sites");
    const { global } = await chrome.storage.local.get("global");
    const tabs = await chrome.tabs.query({});

    for (const tab of tabs) {
        if (!tab.url) {
            console.log(`Cannot get url for tab with id ${tab.id}, skipping`);
            continue;
        }
        /* Only those which match the given URL AND do NOT match at least one Site whose 'enabled'
        state is false*/
        const styleThisTab = matchesURL(tab.url, url) && !matchesDisabledSite(tab.url, sites);
        if (styleThisTab) {
            chrome.tabs.sendMessage(tab.id, { styles: global });
        }
    }
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
    for (const site of sites) {
        if (matchesURL(url, site.url) && site.enabled === false)
            return true;
    }
    return false;
}

