import { describe, it, test, expect, vi, beforeEach } from "vitest";
import Site from "../Site";

// [[url, expected], ... ]
const testURLSiblings = [
    ["https://en.wikipedia.org/wiki/Main_Page", "https://en.wikipedia.org/wiki/*" ],
    ["chrome://newtab", "chrome://newtab/*" ],
    ["en.wikipedia.org", "en.wikipedia.org/*" ],
    ["about:blank", "about:blank/*" ],
    ["https://*.wikipedia.org/wiki/Main_Page", "https://*.wikipedia.org/wiki/*" ],
    ["*.google.com/", "*.google.com/*" ],
    ["*.google.com/index?arg1=abc&arg2=qwe#TOC", "*.google.com/*" ],
];

describe("Site.getURLSiblings", () => {
    it.each(testURLSiblings)("%s => %s", (url, expected) => {
        const actual = Site.getURLSiblings(url);
        expect(actual).toBe(expected);
    });
});

describe("URL matching", () => {
    const clean = "https://www.example.com"
    const path = "https://www.example.com/abc"
    const wildcard = "https://www.example.com/*"

    const tests = [
        // [saved, given, shouldMatch]
        [clean, clean, true],
        [clean, path, false],
        [wildcard, clean, true],
        [wildcard, path, true],
    ];

    it.each(tests)("%s matches %s", (saved, given, expected) => {
        const site = new Site(saved);
        Site.addMatchFunctions(site);
        const actual = site.matchesURL(given);
        expect(actual).toBe(expected);
    })
});
