/* Each key is the name of a CSS property. Their values are composed of the HTML id's for both the
numeric and unit portion in the popup window's style control fields. */
export const SELECTORS = {
    maxWidth: {
        number: "#max-width",
        unit: "#max-width-unit"
    },
    marginLeft: {
        number: "#margin-left",
        unit: "#margin-left-unit"
    }
};

const testURLs = [
    "https://en.wikipedia.org/wiki/Main_Page",  // Valid
    "chrome://newtab",                          // Invalid
    "en.wikipedia.org",                         // Not parseable by URL()
    "about:blank",                              // Invalid, !URL()
    "https://*.wikipedia.org/wiki/Main_Page",   // Asterisk, !URL()
    "*.google.com/",                            // Asterisk, !URL(), trailing slash
    "*.google.com/index?arg1=abc&arg2=qwe#TOC", // Asterisk, !URL(), query, fragment
];
