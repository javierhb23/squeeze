class Site {
    constructor(url, enabled = true, useOwnStyles = false, styles = {}) {
        if (!url) throw new TypeError("No URL specified");
        if (url.length < 1) throw new Error("URL length must be at least 1");
        this.url = url;
        this.enabled = enabled;
        this.useOwnStyles = useOwnStyles;
        this.styles = styles
    }
}

export default Site;
