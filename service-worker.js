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
    if (matchingSite) {
        const styles = matchingSite.useOwnStyles ? matchingSite.styles : globalStyles;
        chrome.tabs.sendMessage(tabId, { styles: styles });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "popup") {
        popup().then(sendResponse);
    }
    return true;
});

async function popup() {
    const response = {};
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const { sites, globalStyles } = await chrome.storage.local.get();
        if (!tab) throw new Error("Could not get active tab");
        if (!tab.url) throw new Error("Could not get tab's URL");
        const matchingSite = getMatchingSite(tab.url, sites);
        response.data = {
            tabUrl: tab.url,
            sites: sites,
            matchingSite: matchingSite,
            styles: matchingSite?.useOwnStyles ? matchingSite.styles : globalStyles
        };
    } catch (e) {
        response.error = e;
    }
    return response;
}

/**
 * Adds a new Site to storage with a given URL if none matches exactly; otherwise, toggles the
 * 'enabled' state of the matched Site to true. Returns a promise requesting the new value of
 * 'sites' from storage in either case.
 *
 * @param {string} url - The url of the site to be added.
 * @returns {Promise<Array<Site>>} - A promise with the value of 'sites' from storage.
 */
async function addSite(url) {
    // Add site to storage
    const { sites } = await chrome.storage.local.get("sites");
    // Look for already existing site
    const matchingSite = getMatchingSite(url, sites);
    if (matchingSite) {
        matchingSite.enabled = true;
    } else {
        sites.push(new Site(url));
    }

    applyToAllTabsWithURL(url);
    await chrome.storage.local.set({ sites });
    return chrome.storage.local.get("sites");
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
    return sites.filter(site => {
        const pattern = site.url.replaceAll("*", ".*"); // Use '*' for glob-matching
        return RegExp(pattern).test(url);
        // If more than one match, consider the Site with the longest URL as the best matching Site
    }).toSorted((siteA, siteB) => siteA.url.length - siteB.url.length)[0];
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
    const { globalStyles } = await chrome.storage.local.get("globalStyles");
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
            chrome.tabs.sendMessage(tab.id, { styles: globalStyles });
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

