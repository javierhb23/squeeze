class Site {
    constructor(url, enabled = true, useOwnStyles = false, styles = {}) {
        this.url = url;
        this.enabled = enabled;
        this.useOwnStyles = useOwnStyles;
        this.styles = styles
    }

    /**
     * Since objects saved to storage do not preserve their methods (functions), this function must
     * be called to attach functionality to them.
     */
    static addMatchFunctions(target) {
        if (!target.url) throw new Error("Target does not have 'url' property");

        target.matchesURL = function (url) {
            return RegExp(url.replaceAll("*", ".*")).test(this.url);
        }

        target.matchesDisabledSite = function (sites) {
            return sites.some(site => this.matchesURL(site.url) && site.enabled === false);
        }

        return target;
    }

    /**
     * Do error checking on given url and return a clean version of it. Throws an Error if one of
     * the checks fail.
     *
     * @param {string} url
     * @returns {string}
     */
    static parseURL(url) {
        // Check that url was given
        if (!url) throw new TypeError("No URL specified");

        // Check that url type is 'string'
        if (typeof url !== "string") throw new TypeError("URL is not a string");

        // Remove all whitespaces
        url = url.replaceAll(/\s/g, "");

        // Check url length
        if (url.length < 1) throw new Error("URL length must be at least 1");

        // Check for invalid scheme
        const invalidSchemes = ["brave://", "chrome://"];
        const hasInvalidScheme = (url) => invalidSchemes.some(scheme => url.startsWith(scheme));
        if (hasInvalidScheme(url)) throw new Error(`${url} is not a valid URL`);

        return url;
    }
}

export default Site;
