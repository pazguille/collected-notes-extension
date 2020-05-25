// Clear extension storage (it should be an option).
document.querySelector('#clear').addEventListener('click', () => {
  chrome.storage.sync.clear(() => {
    alert('Done!');
  });
});