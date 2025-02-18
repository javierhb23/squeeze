import "./utils.js"

document.addEventListener("DOMContentLoaded", handlePopupLoaded);
document.querySelector("#toggle-extension").addEventListener("change", handleToggleExtension);
document.querySelectorAll(".control").forEach((input) => {
    input.addEventListener("input", handleInputChanged);
});

// Set default settings
chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        setDefaults();
    }
});

document.querySelector("#clear").addEventListener("click", () => {
    chrome.storage.local.clear(() => {
        console.log("Cleared storage");
    });
});

function setDefaults() {
    return chrome.storage.local.set({
        "enabled": true,
        "global": {
            "max-width": "1000px",
            "margin-left": "200px"
        },
        "sites": []
    });
}

async function getTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

async function getStorage(key) {
    for (let i = 0; i < 2; i++) { // Try 2 times
        const storage = await chrome.storage.local.get();
        if (storage.hasOwnProperty("enabled")) {
            return storage;
        } else {
            await setDefaults();
        }
    }
}

async function handlePopupLoaded(event) {
    // TODO: Retrieve saved settings and apply them on page load
    // TODO: Retrieve saved settings into popup inputs

    const tab = await getTab();
    const storage = await getStorage();
    const urls = storage.sites.map((site) => site.url);
    for (const url of urls) {
        document.querySelector("#url").value = tab.url;
        const isMatch = new RegExp(url.replace("*", ".*")).test(tab.url);
        if (isMatch) {
            document.querySelector("#url").value = url;
            break;
        }
    }
}

async function handleInputChanged(event) {
    const tab = await getTab();
    message.styles = await getStylesFromPopup();
    const error = await chrome.tabs.sendMessage(tab.id, message);
    if (error) p.innerText = `${error}`;
}

async function handleToggleExtension(event) {
    const action = event.target.checked ? "enable" : "disable";
    const message = { action };

    const tab = await getTab()
    const response = await chrome.tabs.sendMessage(tab.id, message);
    if (response) throw new Error(response);
}

