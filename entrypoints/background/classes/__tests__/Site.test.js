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
