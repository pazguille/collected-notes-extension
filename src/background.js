const keyStorage = 'collectednotes_create_url';
const loginUrl = 'https://collectednotes.com/users/sign_in';

// Make logs easier to use
const log = chrome.extension.getBackgroundPage().console.log;

async function createNewNote(selectedText) {
  const siteUrl = await getSiteUrl();
  if (siteUrl) {
    createNoteTab(siteUrl, selectedText);
  } else {
    createLoginTab(loginUrl, selectedText);
  }
}

function getSiteUrl() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keyStorage, (result) => {
      const url = result[keyStorage];
      resolve(url);
    });
  });
}

function createLoginTab(url, selectedText) {
  chrome.tabs.create({ url, active: true }, async (tab) => {
    const siteUrl = await executeScript(tab.id);
    if (siteUrl) {
      saveUrl(siteUrl);
      createNoteTab(siteUrl, selectedText);
    }
  });
}

function createNoteTab(url, selectedText) {
  chrome.tabs.create({ url, active: true }, () => {
    chrome.tabs.onUpdated.addListener(function updateListener(tab , info) {
      if (info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(updateListener);
        loadTemplate(tab.id, selectedText);
      }
    });
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

function loadTemplate(tabId, selectedText) {
    chrome.storage.sync.get('template', ({ template }) => {
      if (selectedText) {
        let noteBody = '# This is your title\\n\\n>'+ selectedText;
        fillNote(tabId, noteBody);
      } else {
        if (template) {
          fillNote(tabId, template);
        }
      }
    });
}

function fillNote(tabId, body){
  body = '`'+body+'`';
  chrome.tabs.executeScript(tabId, { code: `
        setTimeout(() => {
          document.querySelector('textarea').value = ${body};
          const eve = new Event('change', { bubbles:true })
          document.querySelector('textarea').dispatchEvent(eve);
        }, 500);
      `});
}

chrome.contextMenus.create({
  id: "collected-notes-cm",
  title: "Add Note",
  contexts: ["selection"]
}, chrome.contextMenus.onClicked.addListener(function(info, tab) {
    createNewNote(info.selectionText);
  })
);

chrome.browserAction.onClicked.addListener(function (e) { createNewNote("");});
