// Set defaults
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
