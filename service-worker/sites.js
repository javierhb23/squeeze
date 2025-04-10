import { Site } from './classes.js';

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

export {
    matchesURL,
    matchesDisabledSite,
    addSite,
    getMatchingSite,
    updateSite,
    removeSite
};