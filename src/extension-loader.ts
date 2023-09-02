const APPLICABLE_PROTOCOLS = ["http:", "https:"];

function protocolIsApplicable(url: string) {
    const protocol = (new URL(url)).protocol;
    return APPLICABLE_PROTOCOLS.includes(protocol);
  }

function initializePageAction(tab: browser.tabs.Tab) {
  if ((tab.url) && (tab.id) && (protocolIsApplicable(tab.url))) {
    browser.pageAction.setIcon({tabId: tab.id, path: "icons/icon-32.png"});
    browser.pageAction.show(tab.id);
  }
}

let gettingAllTabs = browser.tabs.query({});
gettingAllTabs.then((tabs) => {
  for (let tab of tabs) {
    initializePageAction(tab);
  }
});

browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
    initializePageAction(tab);
  });

browser.pageAction.onClicked.addListener(() => {
    browser.tabs.executeScript({file: 'dist/recipe-parser.js'})
});