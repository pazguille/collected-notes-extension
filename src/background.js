const keyStorage = 'collectednotes_create_url';
const loginUrl = 'https://collectednotes.com/users/sign_in';

// Make logs easier to use
const log = chrome.extension.getBackgroundPage().console.log;

async function createNewNote() {
  const url = await getSiteUrl();
  createTab(url);
}

function getSiteUrl() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keyStorage, (result) => {
      const url = result[keyStorage] || loginUrl;
      resolve(url);
    });
  });
}

function createTab(url) {
  chrome.tabs.create({ url, active: true }, async (tab) => {
    const siteUrl = await executeScript(tab.id);
    if (siteUrl) {
      saveUrl(siteUrl);
      updateTab(tab.id, siteUrl);
    } else {
      updateTab(tab.id, loginUrl);
    }
  });
}

function executeScript(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(tabId, { code: "document.querySelector('.floating').href" }, (result) => {
      const siteUrl = result[0];
      resolve(siteUrl);
    });
  });
}

function saveUrl(url) {
  chrome.storage.sync.set({ [keyStorage]: url });
}

function updateTab(tabId, url) {
  chrome.tabs.update(tabId, { url });
}

chrome.browserAction.onClicked.addListener(createNewNote);