import './styles.scss';
import 'bootstrap';
import { SELECTORS } from '/utils/definitions.js';

const inpUrl = document.querySelector("#url");
const liIncludeSiblings = document.querySelector("#include-siblings");
const btnApply = document.querySelector("#apply-btn");
const btnSave = document.querySelector("#save-btn");
const btnSaveDropdown = document.querySelector("#save-btn-dropdown");
const spanSaveStatus = document.querySelector("#save-btn-text");
const iconSaveStatus = document.querySelector("#save-btn-icon");
const ulSites = document.querySelector("#sites-list-group");
const templateSite = document.querySelector("#site-list-item-template");
const templateError = document.querySelector("#error-template");
const errorContainer = document.querySelector("#error-container");

document.addEventListener("DOMContentLoaded", refreshPopup);
inpUrl.addEventListener("input", () => setSaveButtonStatus(false));
btnSave.addEventListener("click", saveButtonClicked);
liIncludeSiblings.addEventListener("click", saveButtonClicked, { capture: true });
btnApply.addEventListener("click", applyButtonClicked);
document.querySelectorAll(".control").forEach(input => {
    // Undisable apply button on input events on style fields
    input.addEventListener("input", () => btnApply.disabled = false);
});
document.querySelectorAll("[name=inverse]").forEach(radio => {
    radio.addEventListener("change", inverseRadioSwitched)
});

async function refreshPopup(event) {
    const response = await messageServiceWorker({ action: "info" }, true);
    if (!response.error)
        filloutPopup(response);
}

/** Retrieves relevant data from storage into popup window. */
async function filloutPopup(response) {
    const { tabUrl, matchingSite, storage, valid } = response;
    inpUrl.value = tabUrl;
    setSaveButtonStatus(!!matchingSite, valid);

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
}

/**
 * Sets save button text and icon to display whether the current URL is saved or not.
 *
 * @param {boolean} isSaved - The save status of the current URL
 * - *true* - sets text to "Saved"; sets icon to bookmark with a checkmark
 * - *false* - sets text to "Save"; sets icon to bookmark outline
 * @param {boolean} isValidURL - Setting this to false disables both Save button and adjacent
 * dropdown menu.
 */
function setSaveButtonStatus(isSaved, isValidURL = true) {
    spanSaveStatus.innerText = isSaved ? "Saved" : "Save";
    iconSaveStatus.className = isSaved ? 'bi-bookmark-check-fill' : 'bi-bookmark';

    if (!isValidURL) {
        btnSave.disabled = true;
        btnSaveDropdown.disabled = true;
        iconSaveStatus.className = 'bi-x-lg';
    } else {
        btnSave.disabled = false;
        btnSaveDropdown.disabled = false;
    }
}

function displayError(error) {
    for (const e of errorContainer.children) { e.remove(); } // Remove previous error message(s)
    const errorNode = templateError.content.cloneNode(true);
    errorNode.querySelector("#error-name").textContent = error.name;
    errorNode.querySelector("#error-message").textContent = error.message;
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
        btn.addEventListener("click", removeSiteClicked, { capture: true });
    });

    function appendSite(site) {
        const li = templateSite.content.cloneNode(true);
        const inpSiteURL = li.querySelector("[name=site-url]");
        inpSiteURL.value = site.url;
        inpSiteURL.onbeforeinput = e => e.preventDefault();
        ulSites.appendChild(li);
    }
}

async function removeSiteClicked(event) {
    const li = event.currentTarget.parentNode;
    const url = li.querySelector("[name=site-url]").value;
    const response = await messageServiceWorker({
        action: "remove",
        url: url
    });
};

async function saveButtonClicked(event) {
    const response = await messageServiceWorker({
        action: "add_site",
        url: inpUrl.value,
        includeSiblings: event.currentTarget === liIncludeSiblings,
    });
}

async function applyButtonClicked() {
    const styles = {};

    for (const prop in SELECTORS) {
        const numberField = document.querySelector(SELECTORS[prop].number);
        const unitField = document.querySelector(SELECTORS[prop].unit);
        styles[prop] = numberField.value + unitField.value;
    }

    const response = await messageServiceWorker({
        action: "update_styles",
        styles: styles
    });
}

async function inverseRadioSwitched(event) {
    const response = await messageServiceWorker({
        action: "toggle_inverse",
        value: event.target.value
    });
}

/**
 * Message service worker and check for errors in response. If there are no errors, refresh popup
 * unless specified otherwise by optional parameter `noRefreshPopup`. Otherwise display display
 * error message.
 *
 * @param {*} request - request to pass onto browser.runtime.sendMessage().
 * @param {boolean} noRefreshPopup - Do not refresh popup on success.
 */
async function messageServiceWorker(request, noRefreshPopup = false) {
    const response = await browser.runtime.sendMessage(request);

    if (!!response.error)
        displayError(response.error);
    else if (!noRefreshPopup)
        refreshPopup();

    return response;
}
