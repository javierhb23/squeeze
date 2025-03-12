import "./utils.js"
import "./bootstrap.min.js"
import { getStylesFromPopup, registerMockURLs, clearStorage, Site, selectors } from "./utils.js";

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const { sites } = await chrome.storage.local.get("sites");

let isInStorage = false;
let matchingUrl;

function onOpenPopup() {
    const urls = sites.map((site) => site.url);
    retrieveMatchingURL(urls);
    displayStoredSites(urls);
    retrieveConfig();
}

async function retrieveConfig() {
    const { global } = await chrome.storage.local.get("global");
    for (const prop in selectors) {
        const valueField = document.querySelector(selectors[prop]["value"]);
        const unitField = document.querySelector(selectors[prop]["unit"]);
        const [value, unit] = global[prop].match(/(\d+)(\D+)/).splice(1);
        valueField.value = value;
        unitField.value = unit;
    }
    document.querySelectorAll(".control").forEach((input) => {
        input.addEventListener("input", handleStyleInputChanged);
    });
}

function retrieveMatchingURL(urls) {
    for (const url of urls) {
        isInStorage = new RegExp(url.replace("*", ".*")).test(tab.url);
        if (isInStorage) {
            matchingUrl = url;
            break;
        }
    }
    document.querySelector("#url").value = matchingUrl ?? tab.url;
}

function displayStoredSites(urls) {
    const ul = document.querySelector("#sites-list-group");
    const template = document.querySelector("#site-list-item-template");

    const listItems = [];

    for (const url of urls) {
        const li = template.content.cloneNode(true);
        const span = li.querySelector("span");
        span.innerHTML = url;
        listItems.push(li)
    }

    while (ul.firstChild) {
        ul.removeChild(ul.firstChild);
    }

    for (const li of listItems) {
        ul.appendChild(li);
    }

    document.querySelectorAll("#remove-site-btn").forEach((btn) => {
        btn.addEventListener("click", handleRemoveSiteButton);
    });
}

async function handleRemoveSiteButton(event) {
    const li = event.target.parentNode;
    const url = li.querySelector("span[name=url-span]").innerHTML;
    const { sites } = await chrome.storage.local.get("sites");

    const index = sites.findIndex((site) => site.url === url);

    if (index > -1) {
        await chrome.storage.local.set({ "sites": sites.splice(index, 1) });
        li.remove();
    }
}

async function handleToggleExtension(event) {
    const enabled = event.target.checked;
    if (enabled) {
        if (isInStorage) {
            // TODO: If 'enable' and site in sites
            console.log(tab.url, "already in sites");
        } else {
            // TODO: If 'enable' and site not in sites: add URL to sites
            const { sites } = await chrome.storage.local.get("sites");
            const site = new Site(tab.url);
            sites.push(site);
            chrome.storage.local.set({ "sites": sites });
        }

        const action = "enable";
        const message = { "action": action };
        const response = await chrome.tabs.sendMessage(tab.id, message);
        if (response?.error) throw new Error(response.error);

    } else {
        if (isInStorage) {
            // TODO: If 'disable' and site in sites

        } else {
            // TODO: If 'disable' and site not in sites

        }
    }

    const action = enabled ? "enable" : "disable";
    const message = { "action": action };
    const response = await chrome.tabs.sendMessage(tab.id, message);
    if (response?.error) throw new Error(response.error);
}

async function handleStyleInputChanged(event) {
    const global = getStylesFromPopup();
    const message = { "action": "update", "global": global };
    const form = document.querySelector("#style-controls");
    const formData = new FormData(form);
    console.log(formData)

    for (const [k, v] of formData) {
        console.log(k, v);
    }

    const response = await chrome.tabs.sendMessage(tab.id, message);
    if (response?.error) throw new Error(response.error);
}

document.querySelector("#toggle-extension").addEventListener("change", handleToggleExtension);

// DEBUG
// document.querySelector("#clear").addEventListener("click", clearStorage);
document.querySelector("#mock").addEventListener("click", registerMockURLs);

onOpenPopup();