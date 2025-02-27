import "./utils.js"
import "./bootstrap.min.js"
import { getStylesFromPopup, registerMockURLs, clearStorage, Site } from "./utils.js";

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

let isInStorage = false;
let matchedUrl;

async function popupOpen() {
    const storage = await chrome.storage.local.get();
    const urls = storage.sites?.map((site) => site.url);
    for (const url of urls) {
        // Use '*' for glob matching
        isInStorage = new RegExp(url.replace("*", ".*")).test(tab.url);
        if (isInStorage) {
            matchedUrl = url;
            break;
        }
    }
    displayStoredSites(urls);
    document.querySelector("#url").value = matchedUrl ?? tab.url;
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

    for (const li of listItems){
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

    for (const i in sites) {
        if (sites[i].url === url) {
            sites.splice(i, 1);
            break;
        }
    }

    await chrome.storage.local.set({ "sites": sites });
    li.remove();
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

        //
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
document.querySelectorAll(".control").forEach((input) => {
    input.addEventListener("input", handleStyleInputChanged);
});

// DEBUG
// document.querySelector("#clear").addEventListener("click", clearStorage);
document.querySelector("#mock").addEventListener("click", registerMockURLs);

popupOpen();