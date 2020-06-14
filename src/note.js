import logger from './logger.js';

/**
 * Note
 */
export default class Note {
  keyStorage = 'collectednotes_create_url';
  loginUrl = 'https://collectednotes.com/users/sign_in';

  constructor(options) {
    this.fromSelection = options.noteFromSelection;
    // A helper method to make the constructor async
    this.init();
  };

  /**
   * Create a new tab or go to the login page first.
   */
  async init() {
    this.tab = null;
    this.url = await this.getUrlFromStorage();

    if (!this.url) {
      this.goToLogin();
    } else {
      this.createTab();
    }
  }

  /**
   * Get the user notes url from the storage
   */
  async getUrlFromStorage() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(this.keyStorage, (result) => {
        const url = result[this.keyStorage];
        resolve(url);
      });
    });
  };

  /**
   * Create a new tab to login page to get the user notes url.
   */
  goToLogin() {
    chrome.tabs.create({ url: this.loginUrl, active: true }, async (tab) => {
      const url = await this.getUrlFromDOM(tab);
      if (url) {
        chrome.tabs.remove(tab.id);
        this.saveUrl(url);
        this.url = url;
        this.createTab();
      }
    });
  };

  /**
   * Get the user notes url from the login page DOM.
   */
  async getUrlFromDOM(tab) {
    return new Promise((resolve, reject) => {
      chrome.tabs.executeScript(tab.id, {
        code: 'document.querySelector(".floating").href'
      }, result => resolve(result[0]));
    });
  };


  /**
   * Create a Tab to write a new note
   */
  async createTab() {
    chrome.tabs.create({ url: this.url, active: true }, (tab) => {
      this.tab = tab;
      this.updateTabListener = this.updateTabListener.bind(this);
      chrome.tabs.onUpdated.addListener(this.updateTabListener);
    });
  };

  /**
   * Load the inital note when the tab's status is complete
   */
  updateTabListener(tabId , info) {
    if (this.tab.id === tabId && info.status === 'complete') {
      chrome.tabs.onUpdated.removeListener(this.updateTabListener);
      this.load();
    }
  }

  /**
   * Save the user notes url into the storage
   */
  saveUrl(url) {
    chrome.storage.sync.set({ [this.keyStorage]: url });
  };

  /**
   * Load an initial note using the selected text or a custom template
   */
  load() {
    if (this.fromSelection) {
      this.write(`> ${this.fromSelection.selectionText}`);
      // If selected text exists, will copy to the clipboard the page url.
      this.copyToClipboard();
    } else {
      chrome.storage.sync.get('template', ({ template }) => {
        if (template) {
          this.write(template);
        }
      });
    }
  };

  /**
   * Copy to the clipboard the page url.
   */
  copyToClipboard() {
    chrome.tabs.executeScript(this.tab.id, {
      code: `navigator.clipboard.writeText("Quote taken from ${this.fromSelection.pageUrl}");`,
    });
  }

  /**
   * Write a note with a give body.
   */
  write(body) {
    body = '`\\n\\n'+body+'`';
    chrome.tabs.executeScript(this.tab.id, { code: `
      setTimeout(() => {
        document.querySelector('textarea').value += ${body};
        const eve = new Event('change', { bubbles: true })
        document.querySelector('textarea').dispatchEvent(eve);
      }, 500);
    `});
  };
}
