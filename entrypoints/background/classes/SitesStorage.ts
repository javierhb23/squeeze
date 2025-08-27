import Site from './Site.js';

declare const browser: any; // TODO: use proper type

class SitesStorage {
    sites: Site[] = [];

    constructor(sites: Site[]) {
        this.sites = sites;
    }

    /**
     * Sets this instance's "sites" property and the extension storage key "sites" to the given
     * value. Returns a promise to the calling instance.
     */
    async store(sites: Site[]): Promise<SitesStorage> {
        this.sites = sites;
        sites = JSON.parse(JSON.stringify(sites)); // Fixes Firefox "DataCloneError: Function object could not be cloned."
        await browser.storage.local.set({ sites });
        return this;
    }

    /** Returns a list of sites that match a given URL pattern sorted by length (descending). */
    search(url: string): Site[] {
        if (!url) throw new TypeError("No URL specified");

        return this.sites
            .filter(site => Site.matchesURL(site, url))
            .sort((siteA, siteB) => siteB.url.length - siteA.url.length);
    }

    /** Look up an exact URL. */
    get(url: string): Site | undefined {
        return this.sites.find(site => site.url === url);
    }

    checkDuplicates(newSite: Site): void {
        const isDuplicate = this.sites.some(site => site.url === newSite.url);
        if (isDuplicate) throw new Error(`${newSite.url} already exists`);
    }

    add(url: string, includeSiblings: boolean): Promise<SitesStorage> {
        url = Site.cleanURL(url);
        Site.errorCheckURL(url);
        if (includeSiblings)
            url = Site.getURLSiblings(url);
        const site = new Site(url);
        this.checkDuplicates(site);
        const sites = this.sites;
        sites.push(site);
        return this.store(sites);
    }

    update(url: string, newSite: Site): Promise<SitesStorage> {
        url = Site.cleanURL(url);
        Site.errorCheckURL(url);
        const sites = this.sites;
        const index = sites.findIndex(site => site.url === url);

        if (index < 0) throw new Error(`${url} not found`);

        this.checkDuplicates(newSite);
        sites.splice(index, 1, newSite);
        return this.store(sites);
    }

    remove(url: string): Promise<SitesStorage> {
        if (!url) throw new TypeError("No URL specified");

        const sites = this.sites;
        const index = sites.findIndex(site => site.url === url);

        if (index < 0) throw new Error(`${url} not found`);

        sites.splice(index, 1);
        return this.store(sites);
    }
}

export default SitesStorage;
