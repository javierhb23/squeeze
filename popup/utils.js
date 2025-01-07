async function getStylesFromPopup() {
    const styles = {};
    const props = ["max-width", "margin-left"];
    for (const prop of props) {
        const value = document.querySelector(`#${prop}`)?.value;
        const unit = document.querySelector(`#${prop}-unit`)?.value ?? 'px';
        if (value) styles[prop] = value + unit;
    }
    return styles;
}

function readAttribute(name) {
    const selectors = {
        "max-width": { "value": "#max_width", "unit": "#max_width_unit" }
    }

    const value = document.querySelector(selectors[name].value)?.value;
    const unit = document.querySelector(selectors[name].unit)?.value;

    return { "name": name, "value": value + unit };
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
    if (!sites)
        chrome.storage.local.set({ sites: [] });
    if (!sites[0]) {
        for (const url of mock_urls) {
            const site = new Site(url)
            storage.sites.push(site);
        }
    }
    chrome.storage.local.set(storage);
    console.log(storage.sites[0]);
}

export { getStylesFromPopup, registerMockURLs, readAttribute };