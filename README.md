# Squeeze
### Video Demo:  <URL HERE>
### Description
Squeeze is a browser extension for Chrome and Firefox built with the [WXT Framework](https://wxt.dev/).

It is meant to improve viewing simplistic/old-school websites that are too wide for comfortable reading on widescreen displays by applying a width limit and optionally adding a custom margin, letting the user adjust the horizontal alignment of the page to their preference.

**Note**: Due to the simple method of applying these limits (see below), this extension will not work properly with more complex websites such as Github.

## The code

The extension itself is comprised of three key components:

1. **Action (toolbar icon/popup window):** The main interface of the extension, which is split into two tabs:
   - The first tab allows the user to choose which websites the extension should try to add a width limit and margin to. These are added to the extension's local storage and displayed below as a list.
   - The second tab displays the available width and margin length settings. Here the user can set custom style settings by choosing a numeric amount and unit type, either pixels or a percentage.


2. **Background scripts (service worker):** A set of javascript helpers, classes and functions which will intermediate user actions with the rest of the extension and try to prevent user input which could cause issues or unexpected behavior, in which case the code for handling user interactions (request handlers dealing with `chrome.runtime.onMessage` events) should return an error message to be displayed in the popup window. This component is also responsible for handling `webNavigation` events, i.e: detecting when the user navigates to a website which should be affected by the extension.

3. **Content script:** A simple listener resposible for injecting the desired CSS styles to each web page. It does this by modifying the HTML body's `style` attribute via the DOM API. The smallest yet most important piece of code and the foundation for the core functionality of this extension.


### AI disclosure
All the code, project structure (including this README) and logic for this extension was written 100% by me. The logo was designed by me using Inkscape. No use of LLMs or any other "AI models" was involved at any point during the development of this extension with the **only** exception being to brainstorm ideas for the extension name. 

## How to use this extension
This project uses Node.js `npm` for dependency management. If you don't already have it, download and install [Node.js](https://nodejs.org/) for your platform and open a terminal in the same folder as this README file.

To build and use this extension, first install its dependencies:
```
npm install
```

### Building and loading in the browser
The most straightforward way to use this extension is by directly building it and loading it into your browser.

Build the extension with
```
npm run build
```

If successful, you should now have a `.output` folder in your working directory, and inside you should find a folder called `chrome-mv3`.

Open a Google Chrome (or any Chromium based browser) window and navigate to [chrome://extensions](chrome://extensions). Here, enable "Developer mode", click "Load unpacked", and open the the `chrome-mv3` folder you just created. The extension should now be installed.

### Running in dev mode (advanced)
You also have the option to run the extension in a development session, allowing you to make changes to it and seeing them live by running
```
npm run dev
```
However this won't work with regular Google Chrome, and the setup and config process for this method is outside of the scope of this README. If you're interested, see [more info here](https://wxt.dev/guide/essentials/config/browser-startup.html).