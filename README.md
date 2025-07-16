# Squeeze
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

## Ramblings
This section is me just box-checking a requirement for CS50's Final Project. It may be of interest
to someone out there, but otherwise just skip it.

### Some things I learned

**JavaScript**: Before making this project I already had some experience in programming: some from
college, some from other online courses such as [FreeCodeCamp](www.freecodecamp.org)'s Reactive Web
Design series. If you look at the Javascript portion of the code you may see some *fancy* (as in
admittedly just syntactically sugary) techniques such as functional patterns using `map()`,
`forEach()` and static functions. Outside of that though, for this project I had to learn
asynchronous JavaScript, as this is heavily relied upon for doing stuff with the Web Extensions API.
To this end there are mainly two ways of handling asynchronous code, those are callbacks and the
relatively new `Promise`s, the latter of which I opted for, mainly because I liked the idea of
avoiding potentially spaghetti code/"callback hell".

**Manifest V3 and the WebExtensions API**: Web Extensions use a common API that you access through
the Javascript `chrome.*` (or more generally `browser.*`, but both are synonyms, sort of) namespace.
There are ton of classes and functions inside here, but for this extension I only used functions
under `scripting`, `tabs`, `storage` and `webNavigation`. It was a bit intimidating at first, and
for me at least, as a beginner, the Chrome Developer Documentation gets a bit too technical too
quick, but it all clicks eventually. 

However, there was a bit of musing over how to handle "Message Passing", or how the different
components (see below) should communicate with each other, that is, choosing a message "schema" (or
whether to use Javascript objects or plain strings) that both sending and receiving ends should
 agree upon. here I ultimately chose a schema that resembles HTTP GET/POST requests, using
 Javascript objects, which include a key called `action:` and other keys serving as "arguments". For
 instance, the popup window can message the service worker to add a site to storage like:

```
browser.runtime.sendMessage({
  action: "add_site",
  url: "https://www.google.com",
  includeSiblings: false
});
```
where `"add_site"` is mapped to a function in the service worker code that expects a `url` (more
specifically a `request` object that includes this key), in this case `"www.google.com"`.
`includeSiblings` is a special switch that, if `true`, will call an external function so that the
`url` is modified to include its "siblings" (in this case `"https://www.google.com"` would
become `"https://www.google.com/*"`), but here we chose not to.

In reality, for the popup window we wouldn't use `browser.runtime.sendMessage`, but
`messageServiceWorker()` instead since we need a way to check for errors (like user input related)
that may be present in the response as a result of invalid arguments or other "server-side" errors,
for example. `messageServiceWorker()` (inside `entrypoints/popup/main.js`) does just that, and will
display an error message if needed. Otherwise, it will refresh the popup window with the new info.

Some other things of note:
- VS Code Debugger
- Chrome Debugger (a.k.a.: I DID PUT IN `debugger;`, LOOK, IT'S RIGHT THERE IN THE SOURCES TAB, WHY
  AREN'T YOU PAUSING EXECUTION?!)
- Node.js: `npm install`, `npm run`. Nothing too complicated though.
- Bootstrap (a.k.a: could you please just do the thing I'm telling you to do?!) + Bootstrap Icons
- The WXT framework + stuff involving cross-browser headaches (JSON related, you can find it in the
  source code as a comment).

### The code

The extension itself is comprised of three key components, all located under `entrypoints/*`:

1. **Action (toolbar icon/popup window):** The main interface of the extension, which is split into
   two tabs:
   - The first tab allows the user to choose which websites the extension should try to add a width
     limit and margin to. These are added to the extension's local storage and displayed below as a
     list.
   - The second tab displays the available width and margin length settings. Here the user can set
     custom style settings by choosing a numeric amount and unit type, either pixels or a
     percentage.


2. **Background scripts (service worker):** A set of javascript helpers, classes and functions which
   will intermediate user actions with the rest of the extension and try to prevent user input that
   could cause issues or unexpected behavior, in which case the code for handling user interactions
   (request handlers dealing with `browser.runtime.onMessage` events) should return an error message
   to be displayed in the popup window. This component is also responsible for handling
   `webNavigation` events, i.e: detecting when the user navigates to a website which should be
   affected by the extension.

3. **Content script:** A simple listener resposible for injecting the desired CSS styles to each web
   page. It does this by modifying the HTML body's `style` attribute via the DOM API. The smallest
   yet most important piece of code and the foundation for the core functionality of this extension.


### Conclusion
This took WAAAAAY longer than anticipated (I started work on this project last year). I never
suspected that making an extension with such a simple goal could be this complicated. Although in
practice the logic for adding style rules to web pages wasn't that complicated, what caused me
tremendous headaches was everything else around it: determining the logic for **when** and when
**not** to add styles, trying to account for invalid URLs, duplicates, and generally dealing with
trying to get every component to work in tandem while handling responses from async code.

> As a sidenote, I mentioned when talking about the Chrome Debugger an issue I had with it that I
want to clarify here: Yes, I found it very useful to get to know it, and it got me through some very
annoying bugs, but while I was working on this extension there were many times when I would add
`debugger;` in my service worker code expecting that it would let me step through the mess that I
had made, but didn't. It was only recently that I found out that I was supposed to open the DevTools
using the link directly inside the extension management page for it to do what it was meant to do,
but to add to the confusion, this mostly happened when using [Chrome for
Testing](https://developer.chrome.com/blog/chrome-for-testing/) and not with my main browser Brave,
which has the additional benefit of opening DevTools for me when opening the extension popup window.

There are definitely some missing features that for the sake of just getting this thing
out there I had to leave hanging out there in the code, for example per-site styles, the ability to
edit saved URLs and to have another setting for having sites be either left or right justified or
simply be in the center.

That being said I am definitely happy with the way this project is turning out, I will most likely
keep working on it, as this is an extension I wanted for my own use for a very long time.
