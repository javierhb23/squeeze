class Site {
    constructor(url, enabled = true, useOwnStyles = false, styles = {}) {
        if (!url) throw new TypeError("No URL specified");
        if (url.length < 1) throw new Error("URL length must be at least 1");
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
}

export default Site;
