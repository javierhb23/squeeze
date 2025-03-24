import "./utils.js"
import "./bootstrap.min.js"
import { Site } from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const { sites } = await chrome.storage.local.get("sites");

    const matchingSite = findSiteByURL(tab.url, sites);

    filloutPopup(tab.url, matchingSite);
    displayStoredSites(sites);

    document.querySelector("#toggle-site").addEventListener("change", (event) => siteSwitchToggled(event, tab));
    document.querySelector("#apply-btn").addEventListener("click", () => applyButtonClicked(tab));
});

async function siteSwitchToggled(event, tab) {
    // Ensure updated value for sites
    const { sites } = await chrome.storage.local.get("sites");

    const enabled = event.target.checked;
    const styles = enabled ? getStylesFromPopup() : null;
    // Ask the content script to apply these styles
    chrome.tabs.sendMessage(tab.id, { "styles": styles });

    // Additionally if enabled, add this site if it didn't match any URL from storage
    if (enabled) {
        const url = document.querySelector("#url").value;
        const matchingSite = findSiteByURL(url, sites);
        if (!matchingSite) {
            // Use the URL provided on input field
            sites.push(new Site(url));
            chrome.storage.local.set({ "sites": sites });
            displayStoredSites(sites);
        }
    }
}

function applyButtonClicked(tab) {
    const siteToggle = document.querySelector("#toggle-site")
    if (siteToggle.checked) {
        const styles = getStylesFromPopup();
        // Ask the content script to apply these styles
        chrome.tabs.sendMessage(tab.id, { "styles": styles });
        // Save these new values into the global styles key
        chrome.storage.local.set({ "global": styles });
    }
}


/**
 * Each key is the name of a CSS property. Their values are composed of the HTML id's for both the
 * numeric and unit portion in the popup window's style control fields.
 */
const SELECTORS = {
    "max-width": { "value": "#max-width", "unit": "#max-width-unit" },
    "margin-left": { "value": "#margin-left", "unit": "#margin-left-unit" }
};

/**
 * Takes values from popup style fields and returns an oject with mappings of
 *     <css_prop>: <css_value>
 * for each style field as expected by the style related keys in storage e.g: "global" (in the
 * future also for each Site's "specific" key in later versions).
 */
function getStylesFromPopup() {
    const styles = {};
    for (const prop in SELECTORS) {
        const numberField = document.querySelector(SELECTORS[prop]["value"]);
        const unitField = document.querySelector(SELECTORS[prop]["unit"]);
        styles[prop] = numberField.value + unitField.value;
    }
    return styles;
}

/** 
 * Retrieves relevant data from storage into popup window.
 * @param {string} tabURL - Current tab's URL
 * @param {Site|undefined} site - A Site with a matching URL from the ones in storage, if any.
 */
async function filloutPopup(tabURL, site) {
    // "Enabled for this site" switch
    document.querySelector("#toggle-site").checked = site?.enabled ?? false;
    document.querySelector("#url").value = site?.url ?? tabURL; // URL field

    // Retrieve styles from 'global' into control fields
    const { global } = await chrome.storage.local.get("global");
    for (const prop in SELECTORS) {
        // Split style into numeric and unit (non-numeric) variables
        const [number, unit] = global[prop].match(/(\d+)(\D+)/).splice(1);
        const numberField = document.querySelector(SELECTORS[prop]["value"]);
        const unitField = document.querySelector(SELECTORS[prop]["unit"]);
        numberField.value = number;
        unitField.value = unit;
    }

    // Undisable apply button on input events on style fields
    document.querySelectorAll(".control").forEach((input) => {
        input.addEventListener("input", () => {
            document.querySelector("#apply-btn").disabled = false;
        });
    });

    const { sites } = await chrome.storage.local.get("sites");
    displayStoredSites(sites);
}

/** 
 * Lists all stored sites as URLs on 'Sites' tabpanel.
 * @param {Array<Site>} sites
 */
function displayStoredSites(sites) {
    const ul = document.querySelector("#sites-list-group");

    // Remove existing 'li' elements
    ul.querySelectorAll("li").forEach(li => li.remove());

    const template = document.querySelector("#site-list-item-template");
    for (const site of sites) {
        const li = template.content.cloneNode(true);
        const span = li.querySelector("span");
        span.innerHTML = site.url;
        ul.appendChild(li)
    }

    // Define Remove site ('x') button behavior on each list element
    document.querySelectorAll(".remove-site-btn").forEach((btn) => {
        btn.addEventListener("click", async (event) => {
            const li = event.target.parentNode;
            const url = li.querySelector(".url-span").innerHTML;
            const { sites } = await chrome.runtime.sendMessage({ removeSite: url });
            displayStoredSites(sites);
        });
    });
}
