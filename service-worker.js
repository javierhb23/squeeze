// Set defaults
chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        console.log("setting defaults");
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
