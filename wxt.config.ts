import { defineConfig } from "wxt";

export default defineConfig({
    manifest: {
        "name": "Squeeze",
        "permissions": ["activeTab", "storage", "webNavigation"],
    },
});
