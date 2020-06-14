import logger from './logger.js';

// Load template
chrome.storage.sync.get('template', ({ template }) => {
  if (template) {
    document.querySelector('#template').value = template;
  }
});

// Save Note template.
document.querySelector('#saveTemplate').addEventListener('click', () => {
  const template = document.querySelector('#template').value;
  chrome.storage.sync.set({ template }, () => {
    alert('Done!');
  });
});

// Remove Note template.
document.querySelector('#removeTemplate').addEventListener('click', () => {
  document.querySelector('#template').value = '';
  chrome.storage.sync.set({ template: '' }, () => {
    alert('Removed!');
  });
});

// Clear extension storage (it should be an option).
document.querySelector('#clear').addEventListener('click', () => {
  chrome.storage.sync.clear(() => {
    document.querySelector('#template').value = '';
    alert('Done!');
  });
});
