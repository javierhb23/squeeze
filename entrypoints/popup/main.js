import './styles.scss';
import 'bootstrap';

const inpUrl = document.querySelector("#url");
const btnApply = document.querySelector("#apply-btn");
const btnSave = document.querySelector("#save-btn");
const spanSaveStatus = document.querySelector("#save-btn-text");
const iconSaveStatus = document.querySelector("#save-btn-icon");
const ulSites = document.querySelector("#sites-list-group");
const templateSite = document.querySelector("#site-list-item-template");

btnSave.addEventListener("click", saveButtonClicked);
btnApply.addEventListener("click", applyButtonClicked);
document.querySelectorAll(".control").forEach(input => {
    // Undisable apply button on input events on style fields
    input.addEventListener("input", () => btnApply.disabled = false);
});

filloutPopup();

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

/** Retrieves relevant data from storage into popup window. */
async function filloutPopup() {
    const response = await chrome.runtime.sendMessage({ action: "info" });
    const { tabUrl, matchingSite, storage } = response;

    // chkSiteEnabled.checked = !!matchingSite?.enabled;
    inpUrl.value = matchingSite?.url ?? tabUrl;
    iconSaveStatus.className = !!matchingSite ? 'bi-bookmark-check-fill' : 'bi-bookmark';
    spanSaveStatus.innerText = !!matchingSite ? "Saved" : "Save";

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
    const searchFunction = (input) => input.value === searchValue;
    const inverseRadioInputs = document.querySelectorAll("[name=inverse]");
    const activeRadio = Array.from(inverseRadioInputs).find(searchFunction);
    activeRadio.checked = true; // Toggle the proper radio input

    displayStoredSites(storage.sites);
}

/**
 * Lists all stored sites as URLs on 'Sites' tabpanel.
 * @param {Array<Site>} sites
 */
function displayStoredSites(sites) {
    // Remove existing list elements
    Array.from(ulSites.children).forEach(el => el.remove());

    if (!sites[0]) {
        const spanEmpty = document.createElement("span");
        spanEmpty.innerText = "Saved sites will appear here"
        ulSites.append(spanEmpty);
        return;
    }

    sites.forEach(appendSite);

    // Define Remove site ('x') button behavior on each list element
    document.querySelectorAll("button.btn-close").forEach((btn) => {
        btn.addEventListener("click", removeSiteClicked);
    });

    function appendSite(site) {
        const li = templateSite.content.cloneNode(true);
        const span = li.querySelector("span");
        span.innerHTML = site.url;
        ulSites.appendChild(li);
    }
}

async function removeSiteClicked(event) {
    const li = event.target.parentNode;
    const url = li.querySelector("[name=site-url]").innerHTML;
    const response = await chrome.runtime.sendMessage({
        action: "remove",
        url: url
    });
    console.log(response);
    filloutPopup();
};

async function saveButtonClicked() {
    const response = await chrome.runtime.sendMessage({
        action: "add_site",
        url: inpUrl.value
    });
    console.log(response);
    filloutPopup();
}

async function applyButtonClicked() {
    const styles = getStylesFromPopup();
    await chrome.runtime.sendMessage({
        action: "update_styles",
        styles: styles
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
