# Squeeze
> An archive of the CS50x Final Project version of Squeeze is available at
> [https://www.github.com/javierhb23/squeeze50]()

### Video Demo:  https://www.youtube.com/watch?v=M77vGobC8r4
### Description
Squeeze is a browser extension for Chrome and Firefox built with the [WXT
Framework](https://wxt.dev/).

It is meant to improve viewing simplistic/old-school websites that are too wide for comfortable
reading on widescreen displays by applying a width limit and optionally adding a custom margin,
letting the user adjust the horizontal alignment of the page to their preference. The latter being
especially useful to those using vertical browser tabs.

**Note**: Due to the simple method of applying these limits, this extension will not work properly
with more complex websites such as Github.

## Features
- Keep a list of websites that should be *Squeezed* automatically upon visiting or on the fly when
  adding new ones.
- Support for wildcards e.g.: `https://en.wikipedia.org/wiki/*`, `http://*.txt`.
  - Includes a convenient save option for storing web page "siblings" (web pages sharing the same
    parent URL).
- Option to invert functionality: *Squeeze* all compatible* sites except those listed.

> "compatible" meaning URLs with schemas other than `chrome://`, `brave://` or special pages like
> `about:*`.

## How to use this extension
This project uses Node.js `npm` for dependency management. If you don't already have it, download
and install [Node.js](https://nodejs.org/) for your platform and open a terminal in the same folder
as this README file.

To build and use this extension, first install its dependencies:
```
npm install
```

### Building and loading in the browser
The most straightforward way to use this extension is by directly building it and loading it into
your browser.

Build the extension with
```
npm run build
```

If successful, you should now have a `.output` folder in your working directory, and inside you
should find a folder called `chrome-mv3`.

Open a Google Chrome (or any Chromium based browser) window and navigate to
[chrome://extensions](chrome://extensions). Here, enable "Developer mode", click "Load unpacked",
and open the the `chrome-mv3` folder you just created. The extension should now be installed.

### Running in dev mode (advanced)
You also have the option to run the extension in a development session, allowing you to make changes
to it and seeing them live by running
```
npm run dev
```
However this won't work with regular Google Chrome, and the setup and config process for this method
is outside of the scope of this README. If you're interested, see [more info
here](https://wxt.dev/guide/essentials/config/browser-startup.html).

### AI disclosure
All the code, project structure (including this README) and logic for this extension was written
100% by me. The logo was designed by me using Inkscape. No use of LLMs or any other "AI models" was
involved at any point during the development of this extension with the **only** exception being to
brainstorm ideas for the extension name.
