import Site from './Site.js';

class SitesStorage {
    /** @type {Array<Site>} */
    #sites = [];

    /**
     * @param {Array<Site>} [sites]
     */
    constructor(sites) {
        this.sites = sites;
    }

    set sites(sites) {
        this.#sites = sites.map(Site.addMatchFunctions);
    }

    get sites() {
        return this.#sites;
    }

    /**
     * Sets this instance's "sites" property and the extension storage key "sites" to the given
     * value. Returns a promise to the calling instance.
     *
     * @param {Array<Site>} sites 
     * @returns {Promise<SitesStorage>}
     */
    async store(sites) {
        this.sites = sites;
        await chrome.storage.local.set({ sites });
        return this;
    }

    /**
     * Returns a list of sites that match a given URL pattern sorted by longest to shortest site
     * URL.
     *
     * @param {string} url 
     * @returns {Array<Site>}
     */
    search(url) {
        if (!url) throw new TypeError("No URL specified");

        return this.sites
            .filter(site => site.matchesURL(url))
            .sort((siteA, siteB) => siteA.url.length - siteB.url.length);
    }

    /**
     * Look up an exact URL.
     *
     * @param {string} url
     * @returns {Site|undefined}
     */
    get(url) {
        return this.sites.find(site => site.url === url);
    }

    checkDuplicates(newSite) {
        const isDuplicate = this.sites.some(site => site.url === newSite.url);
        if (isDuplicate) throw new Error(`${url} already exists`);
    }

    /**
     * @param {string} url
     * @returns {Promise<SitesStorage>}
     */
    add(url) {
        url = Site.parseURL(url);
        const site = new Site(url);
        this.checkDuplicates(site);
        const sites = this.sites;
        sites.push(site);
        return this.store(sites);
    }

    /**
     * @param {string} url
     * @param {Site} newSite
     * @returns {Promise<SitesStorage>}
     */
    update(url, newSite) {
        url = Site.parseURL(url);
        const sites = this.sites;
        const index = sites.findIndex(site => site.url === url);

        if (index < 0) throw new Error(`${url} not found`);

        this.checkDuplicates(newSite);
        sites.splice(index, 1, newSite);
        return this.store(sites);
    }

    /**
     * @param {string} url 
     * @returns {Promise<SitesStorage>}
     */
    remove(url) {
        if (!url) throw new TypeError("No URL specified");

        const sites = this.sites;
        const index = sites.findIndex(site => site.url === url);

        if (index < 0) throw new Error(`${url} not found`);

        sites.splice(index, 1);
        return this.store(sites);
    }
}

export default SitesStorage;
