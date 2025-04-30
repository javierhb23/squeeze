const chkSiteEnabled = document.querySelector("#toggle-site");
const inpUrl = document.querySelector("#url");
const btnApply = document.querySelector("#apply-btn");
const iconBookmark = document.querySelector("#bookmark-icon");
const ulSites = document.querySelector("#sites-list-group");
const templateSite = document.querySelector("#site-list-item-template");

/* Each key is the name of a CSS property. Their values are composed of the HTML id's for both the
numeric and unit portion in the popup window's style control fields. */
const SELECTORS = {
    maxWidth: {
        number: "#max-width",
        unit: "#max-width-unit"
    },
    marginLeft: {
        number: "#margin-left",
        unit: "#margin-left-unit"
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    filloutPopup();
    // chkEnable.addEventListener("change", enableSwitchToggled);
    chkSiteEnabled.addEventListener("change", siteSwitchToggled);
    btnApply.addEventListener("click", applyButtonClicked);
    // Undisable apply button on input events on style fields
    document.querySelectorAll(".control").forEach(input =>
        input.addEventListener("input", () => btnApply.disabled = false));
});

/** Retrieves relevant data from storage into popup window. */
async function filloutPopup() {
    const response = await chrome.runtime.sendMessage({ action: "info" });
    console.log(response);
    const { tabUrl, matchingSite, storage } = response;

    chkSiteEnabled.checked = !!matchingSite?.enabled;
    inpUrl.value = matchingSite?.url ?? tabUrl;
    iconBookmark.className = !!matchingSite ? 'bi-bookmark-check-fill' : 'bi-bookmark';

    const styles = storage.globalStyles;

    // Fill out style fields
    for (const prop in styles) {
        const [number, unit] = styles[prop].match(/(\d+)(\D+)/).slice(1);
        const numberField = document.querySelector(SELECTORS[prop].number);
        const unitField = document.querySelector(SELECTORS[prop].unit);
        numberField.value = number;
        unitField.value = unit;
    }

    // Determine which radio input should be checked for "Apply limits to"
    const searchValue = storage.inverse ? "true" : "false";
    const searchFunction = input => input.value === searchValue;
    const inverseRadioInputs = [...document.querySelectorAll("[name=inverse]")];
    inverseRadioInputs.find(searchFunction).checked = true;

    displayStoredSites(storage.sites);
}

/**
 * Lists all stored sites as URLs on 'Sites' tabpanel.
 * @param {Array<Site>} sites
 */
function displayStoredSites(sites) {
    // Remove existing 'li' elements
    ulSites.querySelectorAll("li").forEach(li => li.remove());

    if (!sites[0]) {
        const empty = { url: "No sites found" };
        appendSite(empty, true);
        return;
    }

    sites.forEach(appendSite);

    // Define Remove site ('x') button behavior on each list element
    document.querySelectorAll(".remove-site-btn").forEach((btn) => {
        btn.addEventListener("click", async (event) => {
            const li = event.target.parentNode;
            const url = li.querySelector(".url-span").innerHTML;
            await chrome.runtime.sendMessage({
                action: "remove",
                url: url
            });
            filloutPopup();
        });
    });

    function appendSite(site, noCloseButton = false) {
        const li = templateSite.content.cloneNode(true);
        if (noCloseButton) { li.querySelector(".btn-close").remove(); }
        const span = li.querySelector("span");
        span.innerHTML = site.url;
        ulSites.appendChild(li);
    }
}

async function siteSwitchToggled(event) {
    await chrome.runtime.sendMessage({
        action: "toggle_site",
        checked: event.target.checked,
        url: inpUrl.value
    });
    filloutPopup();
}

async function applyButtonClicked() {
    const styles = getStylesFromPopup();
    await chrome.runtime.sendMessage({
        action: "update_styles",
        styles: styles,
        checked: chkEnable.checked
    });
    filloutPopup();
}

function getStylesFromPopup() {
    const styles = {};
    for (const prop in SELECTORS) {
        const numberField = document.querySelector(SELECTORS[prop]["number"]);
        const unitField = document.querySelector(SELECTORS[prop]["unit"]);
        styles[prop] = numberField.value + unitField.value;
    }
    return styles;
}