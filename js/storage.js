/**
 * storage.js
 * Thin wrapper around localStorage for bracket persistence.
 */

const STORAGE_KEY = 'wc2026_bracket_v1';

/** Persist the entire bracket state. */
export function saveBracket(bracket) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bracket));
  } catch (e) {
    console.warn('[storage] Failed to save:', e);
  }
}

/** Load persisted bracket, or return null if none exists. */
export function loadBracket() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('[storage] Failed to load:', e);
    return null;
  }
}

/** Clear all saved data. */
export function clearBracket() {
  localStorage.removeItem(STORAGE_KEY);
}

/** Export bracket as a downloadable JSON file. */
export function exportJSON(bracket) {
  const blob = new Blob([JSON.stringify(bracket, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wc2026-prediction-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Prompt user to select a JSON file, returns parsed object or null. */
export function importJSON() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          resolve(JSON.parse(e.target.result));
        } catch {
          alert('Invalid JSON file.');
          resolve(null);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
