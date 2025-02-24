import "./utils.js"
import "./bootstrap.min.js"
import { getStylesFromPopup, registerMockURLs, clearStorage } from "./utils.js";

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

async function popupOpen() {
    document.querySelector("#url").value = tab.url;

    const storage = await chrome.storage.local.get();
    console.log(storage);
    const urls = storage.sites?.map((site) => site.url);
    if (urls) {
        for (const url of urls) {
            const isMatch = new RegExp(url.replace("*", ".*")).test(tab.url);
            if (isMatch) {
                document.querySelector("#url").value = url;
                break;
            }
        }
    }

    // TODO: Retrieve saved settings into popup inputs
}

async function handleToggleExtension(event) {
    const action = event.target.checked ? "enable" : "disable";
    const message = { "action": action };

    const response = await chrome.tabs.sendMessage(tab.id, message);
    if (response?.error) throw new Error(response.error);
}

async function handleStyleInputChanged(event) {
    const global = getStylesFromPopup();
    const message = { "action": "update", "global": global };

    const response = await chrome.tabs.sendMessage(tab.id, message);
    if (response?.error) throw new Error(response.error);
}

document.querySelector("#toggle-extension").addEventListener("change", handleToggleExtension);
document.querySelectorAll(".control").forEach((input) => {
    input.addEventListener("input", handleStyleInputChanged);
});

// DEBUG
document.querySelector("#clear").addEventListener("click", clearStorage);

popupOpen();