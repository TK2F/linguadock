// Service Worker for LinguaDock Chrome Extension
// Opens side panel when extension icon is clicked

chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
