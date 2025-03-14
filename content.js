// Retrieve saved settings and apply them on page load
(async () => {
    const { global, sites } = await chrome.storage.local.get(["global", "sites"]);
    const matchingSite = sites.find((site) => {
        const pattern = site.url.replace("*", ".*");
        return RegExp(pattern).test(document.URL);
    });
    if (matchingSite) {
        applyStyles(global);
    }
})();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        if (message.action === "enable" || message.action === "update") {
            applyStyles(message["styles"]);
        } else if (message.action === "disable") {
            applyStyles(null);
        }
    } catch (error) {
        console.log(error);
        sendResponse({ "error": error });
    }
});

/**
 * Takes an object with one or more CSS property names and their desired values and sets them as
 * inline styles on the body of the current website. Pass a nullish value to emove all styles
 * therein.
 * @param {object|undefined} styles - {"<css_prop>": "<css_value>", ...}
 */
function applyStyles(styles) {
    if (styles) {
        for (const prop in styles) {
            document.body.style[prop] = styles[prop] ?? null;
        }
    } else {
        for (const prop in document.body.style) {
            document.body.style[prop] = null;
        }
    }
}