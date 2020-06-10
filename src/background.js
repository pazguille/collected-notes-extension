const keyStorage = 'collectednotes_create_url';
const loginUrl = 'https://collectednotes.com/users/sign_in';

// Make logs easier to use
const log = chrome.extension.getBackgroundPage().console.log;

async function createNewNote(selectedText) {
  const url = await getSiteUrl();
  createTab(url, selectedText);
}

function getSiteUrl() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keyStorage, (result) => {
      const url = result[keyStorage] || loginUrl;
      resolve(url);
    });
  });
}

function createTab(url, selectedText) {
  chrome.tabs.create({ url, active: true }, async (tab) => {
    const siteUrl = await executeScript(tab.id);
    if (siteUrl) {
      saveUrl(siteUrl);
      updateTab(tab.id, siteUrl, selectedText, loadTemplate);
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

function updateTab(tabId, url, selectedText, fn) {
  chrome.tabs.onUpdated.addListener((tabId , info) => {
    if (info.status === 'complete') {
      fn && fn(tabId, selectedText);
    }
  });
  chrome.tabs.update(tabId, { url });
}


function loadTemplate(tabId, selectedText) {
    chrome.storage.sync.get('template', ({ template }) => {
      if (selectedText) {
        fillNote(tabId, selectedText);
      } else {
        if (template) {
          template = '`'+template+'`';
          fillNote(tabId, template);
        }
      }
    });
}


function fillNote(tabId, body){
  chrome.tabs.executeScript(tabId, { code: `
        setTimeout(() => {
          document.querySelector('textarea').value = '# This is your title\\n\\n>${body}';
          const eve = new Event('change', { bubbles:true })
          document.querySelector('textarea').dispatchEvent(eve);
        }, 500);
      `});
}


chrome.contextMenus.create({
  id: "collected-notes-cm",
  title: "Collect note",
  contexts: ["selection"]
}, chrome.contextMenus.onClicked.addListener(function(info, tab) {
    createNewNote(info.selectionText);
  })
);
