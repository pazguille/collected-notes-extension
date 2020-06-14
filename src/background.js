/**
 * Note constructor
 */
import Note from './note.js';

/**
 * Create a new Note with an optional text selection
 */
function createNewNoteFactory(noteFromSelection) {
  return new Note({ noteFromSelection });
}

/**
 * Add toolbar icon click listener to create a new Note
 */
chrome.browserAction.onClicked.addListener(() => createNewNoteFactory());

/**
 * Add conext menu option to create a new Note from selected text
 */
chrome.contextMenus.create({
  id: 'collected-notes-cm',
  title: 'Add Note',
  contexts: ['selection'],
}, () => {
  chrome.contextMenus.onClicked.addListener((noteFromSelection) => createNewNoteFactory(noteFromSelection));
});
