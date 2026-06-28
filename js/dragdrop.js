/**
 * dragdrop.js
 * Wires up drag-and-drop behaviour using the HTML5 Drag API (no SortableJS
 * needed for this cross-column model — SortableJS is great for lists but
 * cross-container team-pick drag needs custom logic for cascade updates).
 *
 * Strategy:
 *  - Every .team-row[draggable="true"] is a drag source.
 *  - Every .team-row (including empty TBD slots) is a drop target.
 *  - On drop, call onDrop(fromMatchId, fromSlot, toMatchId, toSlot).
 */

let dragState = null; // { matchId, slot, teamName }

/**
 * Attach drag-and-drop handlers to the entire bracket root.
 * Uses event delegation so it survives re-renders.
 *
 * @param {HTMLElement} root    - The #bracket-root element.
 * @param {Function}    onDrop  - Callback(fromMatchId, fromSlot, toMatchId, toSlot).
 */
export function initDragDrop(root, onDrop) {
  root.addEventListener('dragstart', handleDragStart);
  root.addEventListener('dragend',   handleDragEnd);
  root.addEventListener('dragover',  handleDragOver);
  root.addEventListener('dragleave', handleDragLeave);
  root.addEventListener('drop',      (e) => handleDrop(e, onDrop));
}

function handleDragStart(e) {
  const row = e.target.closest('.team-row[draggable="true"]');
  if (!row) return;

  dragState = {
    matchId:  row.dataset.matchId,
    slot:     Number(row.dataset.slot),
    teamName: row.querySelector('.team-name')?.textContent?.trim(),
  };

  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragState.teamName);

  // Ghost styling via a class on next frame
  requestAnimationFrame(() => row.classList.add('dragging'));
}

function handleDragEnd(e) {
  const row = e.target.closest('.team-row');
  if (row) row.classList.remove('dragging');
  clearHighlights();
  dragState = null;
}

function handleDragOver(e) {
  const row = e.target.closest('.team-row');
  if (!row || !dragState) return;
  if (isSameSlot(row)) return;

  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  row.classList.add('drop-target');
}

function handleDragLeave(e) {
  const row = e.target.closest('.team-row');
  if (row) row.classList.remove('drop-target');
}

function handleDrop(e, onDrop) {
  e.preventDefault();
  const row = e.target.closest('.team-row');
  if (!row || !dragState) return;
  if (isSameSlot(row)) return;

  row.classList.remove('drop-target');

  const toMatchId = row.dataset.matchId;
  const toSlot    = Number(row.dataset.slot);

  onDrop(dragState.matchId, dragState.slot, toMatchId, toSlot);
  dragState = null;
}

function isSameSlot(row) {
  return dragState &&
    row.dataset.matchId === dragState.matchId &&
    Number(row.dataset.slot) === dragState.slot;
}

function clearHighlights() {
  document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
}
