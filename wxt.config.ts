import { defineConfig } from "wxt";

export default defineConfig({
    manifest: {
        "permissions": ["activeTab", "tabs", "scripting", "storage", "webNavigation"],
    },
    // https://wxt.dev/guide/essentials/config/vite.html#change-vite-config
    vite: () => ({
        // https://getbootstrap.com/docs/5.3/getting-started/vite/#configure-vite
        css: {
            preprocessorOptions: {
                scss: {
                    silenceDeprecations: [
                        'import',
                        'mixed-decls',
                        'color-functions',
                        'global-builtin',
                    ],
                },
            },
        }
    })
});
