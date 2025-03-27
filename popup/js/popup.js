import "./bootstrap.min.js"

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

const chkEnable = document.querySelector("#toggle-enabled");
const chkSiteEnabled = document.querySelector("#toggle-site");
const inpUrl = document.querySelector("#url");
const btnApply = document.querySelector("#apply-btn");
// const rdoStylesSource = document.querySelector("#styles-source");
const iconBookmark = document.querySelector("#bookmark-icon");
const ulSites = document.querySelector("#sites-list-group");

document.addEventListener("DOMContentLoaded", async () => {
    filloutPopup();
    chkEnable.addEventListener("change", enableSwitchToggled);
    chkSiteEnabled.addEventListener("change", siteSwitchToggled);
    btnApply.addEventListener("click", applyButtonClicked);
});

/** Retrieves relevant data from storage into popup window. */
async function filloutPopup() {
    const response = await chrome.runtime.sendMessage({ action: "popup" });
    const data = response.data;

    chkSiteEnabled.checked = data?.matchingSite?.enabled ?? false;
    chkEnable.checked = chkSiteEnabled.checked;
    inpUrl.value = data?.matchingSite?.url ?? data.tabUrl;
    iconBookmark.className = data?.matchingSite ? 'bi-bookmark-check-fill' : 'bi-bookmark';

    // Fill out style fields
    for (const prop in data.styles) {
        const [number, unit] = data.styles[prop].match(/(\d+)(\D+)/).splice(1);
        const numberField = document.querySelector(SELECTORS[prop].number);
        const unitField = document.querySelector(SELECTORS[prop].unit);
        numberField.value = number;
        unitField.value = unit;
    }

    // Undisable apply button on input events on style fields
    document.querySelectorAll(".control").forEach((input) => {
        input.addEventListener("input", () => {
            btnApply.disabled = false;
        });
    });

    displayStoredSites(data.sites);
}

/**
 * Lists all stored sites as URLs on 'Sites' tabpanel.
 * @param {Array<Site>} sites
 */
function displayStoredSites(sites) {
    // Remove existing 'li' elements
    ulSites.querySelectorAll("li").forEach(li => li.remove());

    const template = document.querySelector("#site-list-item-template");
    for (const site of sites) {
        const li = template.content.cloneNode(true);
        const span = li.querySelector("span");
        span.innerHTML = site.url;
        ulSites.appendChild(li)
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


function enableSwitchToggled(event) {
    chrome.runtime.sendMessage({ enable: event.target.checked });
}

async function siteSwitchToggled(event) {
    const enabled = event.target.checked;
    const response = await chrome.runtime.sendMessage({ });
}

function applyButtonClicked() {
    // chrome.runtime.sendMessage({ action: "update", data: popupData });
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