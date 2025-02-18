const selectors = {
    "max-width": { "value": "#max-width", "unit": "#max-width-unit" },
    "left-margin": { "value": "#left-margin", "unit": "#left-margin-unit" }
};

function getStylesFromPopup() {
    const styles = {};
    for (const name in selectors) {
        const value = document.querySelector(selectors[name].value)?.value;
        const unit = document.querySelector(selectors[name].unit)?.value;
        styles[name] = { "name": name, "value": value + unit };
    }
    return styles;
}

async function registerMockURLs() {
    const mock_urls = [
        "https://www.rodsbooks.com/refind/installing.html",
        "https://www.eyrie.org/~dvandom/misc/*"
    ];

    class Site {
        url;
        enabled = true;
        useSpecific = false;
        styles = {};
        constructor(url) {
            this.url = url;
        }
    }

    const { sites } = await chrome.storage.local.get(["sites"]);

    if (!sites[0]) {
        for (const url of mock_urls) {
            const site = new Site(url)
            storage.sites.push(site);
        }
    }
    chrome.storage.local.set(storage);
}

export { getStylesFromPopup, registerMockURLs };