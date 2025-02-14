import "./utils.js"

document.addEventListener("DOMContentLoaded", handlePopupLoaded);
document.querySelector("#toggle-extension").addEventListener("change", handleToggleExtension);
document.querySelectorAll("[name=select-config]").forEach((element) => {
    element.addEventListener("change", handleSelectConfig);
});
document.querySelectorAll(".control").forEach((input) => {
    input.addEventListener("input", handleInputChanged);
});

// Set default settings
chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        chrome.storage.local.set({
            "enabled": true,
            "global": {
                "max-width": "1000px",
                "margin-left": "200px"
            },
            "sites": []
        });
    }
});

async function getTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

async function handlePopupLoaded(event) {
    // TODO: Retrieve saved settings and apply them on page load
    // TODO: Retrieve saved settings into popup inputs

    const tab = await getTab();
    const { sites } = await chrome.storage.local.get(["sites"]);

    if (!sites)
        chrome.storage.local.set({ sites: [] });

    const urls = sites.map((site) => site.url);
    for (const url of urls) {
        const isMatch = new RegExp(url.replace("*", ".*")).test(tab.url);
        document.querySelector("#url").value = isMatch ? url : tab.url;
    }
}

async function handleSelectConfig(event) {
    const tab = await getTab();

    const selectConfig = event.target.value;

    if (selectConfig === "useGlobal") { }
    if (selectConfig === "useSpecific") { }
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

