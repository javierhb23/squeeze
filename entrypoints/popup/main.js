import './styles.scss';
import 'bootstrap';

const inpUrl = document.querySelector("#url");
const btnApply = document.querySelector("#apply-btn");
const btnSave = document.querySelector("#save-btn");
const spanSaveStatus = document.querySelector("#save-btn-text");
const iconSaveStatus = document.querySelector("#save-btn-icon");
const ulSites = document.querySelector("#sites-list-group");
const templateSite = document.querySelector("#site-list-item-template");
const templateError = document.querySelector("#error-template");
const errorContainer = document.querySelector("#error-container");

inpUrl.addEventListener("input", () => saveButtonStatus(false));
btnSave.addEventListener("click", saveButtonClicked);
btnApply.addEventListener("click", applyButtonClicked);
document.querySelectorAll(".control").forEach(input => {
    // Undisable apply button on input events on style fields
    input.addEventListener("input", () => btnApply.disabled = false);
});
document.querySelectorAll("[name=inverse]").forEach(radio => {
    radio.addEventListener("change", inverseRadioSwitched)
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
async function filloutPopup(error) {
    const response = await chrome.runtime.sendMessage({ action: "info" });
    const { tabUrl, matchingSite, storage } = response;

    inpUrl.value = matchingSite?.url ?? tabUrl;
    saveButtonStatus(!!matchingSite);

    const styles = response.globalStyles;

    // Fill out style fields
    for (const prop in styles) {
        const numberField = document.querySelector(SELECTORS[prop].number);
        const unitField = document.querySelector(SELECTORS[prop].unit);
        numberField.value = styles[prop].number;
        unitField.value = styles[prop].unit;
    }

    // Determine which radio input should be checked for "Apply limits to"
    const searchValue = storage.inverse ? "true" : "false";
    const searchFunction = (input) => input.value === searchValue;
    const inverseRadioInputs = document.querySelectorAll("[name=inverse]");
    const activeRadio = Array.from(inverseRadioInputs).find(searchFunction);
    activeRadio.checked = true; // Toggle the proper radio input

    displayStoredSites(storage.sites);

    if (!!error) {
        displayError(error);
    }
}

/**
 * Sets save button text and icon to display whether the current URL is saved or not.
 *
 * @param {boolean} isSaved - The save status of the current URL
 * - *true* - sets text to "Saved"; sets icon to bookmark with a checkmark
 * - *false* - sets text to "Save"; sets icon to bookmark outline
 */
function saveButtonStatus(isSaved) {
    spanSaveStatus.innerText = isSaved ? "Saved" : "Save";
    iconSaveStatus.className = isSaved ? 'bi-bookmark-check-fill' : 'bi-bookmark';
}

function displayError(error) {
    const errorNode = templateError.content.cloneNode(true);
    errorNode.querySelector("#error-name").innerText = error.name;
    errorNode.querySelector("#error-message").innerText = error.message;
    errorContainer.appendChild(errorNode);
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
    document.querySelectorAll("[name=btn-remove-site]").forEach((btn) => {
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
    filloutPopup(response.error);
};

async function saveButtonClicked() {
    const response = await chrome.runtime.sendMessage({
        action: "add_site",
        url: inpUrl.value
    });
    filloutPopup(response.error);
}

async function applyButtonClicked() {
    const styles = {};

    for (const prop in SELECTORS) {
        const numberField = document.querySelector(SELECTORS[prop].number);
        const unitField = document.querySelector(SELECTORS[prop].unit);
        styles[prop] = numberField.value + unitField.value;
    }

    const response = await chrome.runtime.sendMessage({
        action: "update_styles",
        styles: styles
    });
    filloutPopup(response.error);
}

async function inverseRadioSwitched(event) {
    const response = await chrome.runtime.sendMessage({
        action: "toggle_inverse",
        value: event.target.value
    });
    filloutPopup(response.error);
}
