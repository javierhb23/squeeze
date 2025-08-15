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

            const pattern = RegExp.escape(this.url)
                .replaceAll("\\*", ".*") // Turn asterisks into RegExp wildcards
                .concat("$");            // Match until the end (exclusive)

            return RegExp(pattern).test(url);
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
     * @throws {TypeError|Error}
     * @returns {string}
     */
    static errorCheckURL(url) {
        // Check that url was given
        if (!url) throw new TypeError("No URL specified");

        // Check that url type is 'string'
        if (typeof url !== "string") throw new TypeError("URL is not a string");

        // Check url length
        if (url.length < 1) throw new Error("URL length must be at least 1");

        // Check for incompatible URL prefixes
        const prefixes = ["brave://", "chrome://", "about:"];
        if (prefixes.some(prefix => url.startsWith(prefix))) {
            // Ellipsize URL if it's too long
            const maxLength = 30;
            const shortURL = url.length <= maxLength
                ? url
                : `${url.slice(0, maxLength)}...`;
            throw new Error(`URL "${shortURL}" is incompatible with this extension`);
        }

        return url;
    }

    /**
     * Do error checking on given url. Returns true if no errors were found; false otherwise.
     *
     * @param {string} url
     * @returns {boolean}
     */
    static isValidURL(url) {
        try {
            this.errorCheckURL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Returns given URL, but removes:
     * - Whitespaces
     * - Trailing slash
     * - URI query ('?', '&')
     * - Fragment ('#')
     *
     * See https://en.wikipedia.org/wiki/Uniform_Resource_Identifier#Syntax
     */
    static cleanURL(url) {
        url = url.replaceAll(/\s/g, "");                  // Remove whitespace
        url = url.endsWith("/") ? url.slice(0, -1) : url; // Remove trailing slash

        // Remove query and fragment
        for (const marker of ['?', '#']) {
            const index = url.lastIndexOf(marker);
            if (index > -1) {
                url = url.slice(0, index);
            }
        }
        return url;
    }

    static getURLSiblings(urlString) {
        // Any URL with trailing slash need only be suffixed with '*'
        if (urlString.endsWith("/"))
            return urlString + '*';

        // Split URL into protocol and rest of URL
        let [protocol, url] = urlString.includes("://") ? urlString.split("://") : [undefined, urlString];
        protocol = protocol ? `${protocol}://` : "";

        // Remove anything after the last forward-slash (including)
        const slash = url.lastIndexOf('/');
        if (slash > -1) {
            url = url.slice(0, slash);
        }

        return protocol + url + "/*";
    }
}

export default Site;
