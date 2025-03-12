class Site {
    url;
    enabled = true;
    constructor(url) {
        this.url = url;
    }
}

const selectors = {
    "max-width": { "value": "#max-width", "unit": "#max-width-unit" },
    "margin-left": { "value": "#margin-left", "unit": "#margin-left-unit" }
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

    const { sites } = await chrome.storage.local.get(["sites"]);

    if (!sites[0]) {
        for (const url of mock_urls) {
            const site = new Site(url)
            sites.push(site);
        }
        chrome.storage.local.set({"sites": sites});
    }
    else {
        console.log("Storage already contains sites. Aborting")
    }
}

function clearStorage() {
    chrome.storage.local.clear(() => {
        console.log("Cleared storage");
    });
}

export { getStylesFromPopup, registerMockURLs, clearStorage, Site, selectors };