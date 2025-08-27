import regexpEscape from "regexp.escape";

class Site {
    url: string;
    enabled: boolean;
    useOwnStyles: boolean;
    styles: object;

    constructor(url: string, enabled: boolean = true, useOwnStyles: boolean = false, styles: object = {}) {
        this.url = url;
        this.enabled = enabled;
        this.useOwnStyles = useOwnStyles;
        this.styles = styles
    }

    static matchesURL(site: Site, url: string): boolean {
        // Using polyfill because RegExp.escape is not implemented in Firefox ESR v128.x
        const pattern = regexpEscape(site.url)
            .replaceAll("\\*", ".*") // Turn asterisks into RegExp wildcards
            .concat("$");            // Match until the end (exclusive)

        return RegExp(pattern).test(url);
    }

    static matchesDisabledSite(site: Site, sites: Site[]): boolean {
        return sites.some(s =>
            s.enabled === false &&
            Site.matchesURL(site, s.url)
        );
    }

    /**
     * Do error checking on given url and return a clean version of it. Throws an Error if one of
     * the checks fail.
     *
     * @throws {Error}
     */
    static errorCheckURL(url: string): string {
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
     */
    static isValidURL(url: string): boolean {
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
    static cleanURL(url: string): string {
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

    static getURLSiblings(urlString: string): string {
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
