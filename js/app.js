/**
 * app.js
 * Orchestrator — wires state, rendering, drag-drop, and toolbar actions.
 */

import { getInitialBracket }       from './data.js';
import { renderBracket, drawConnectors } from './bracket.js';
import { initDragDrop }            from './dragdrop.js';
import { setWinner, findMatch }    from './logic.js';
import { saveBracket, loadBracket, clearBracket, exportJSON, importJSON } from './storage.js';

// ─── State ───────────────────────────────────────────────────────────────────

let bracket = loadBracket() || getInitialBracket();

// ─── Boot ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  render();
  bindToolbar();
  bindDragDrop();

  // Redraw connectors on resize
  const ro = new ResizeObserver(() => drawConnectors());
  ro.observe(document.getElementById('bracket-root'));
});

// ─── Render ──────────────────────────────────────────────────────────────────

function render() {
  renderBracket(bracket, handleTeamSelect);
  // Allow one animation frame so layout is computed before drawing lines
  requestAnimationFrame(() => requestAnimationFrame(drawConnectors));
}

// ─── Team Click → Toggle Winner ──────────────────────────────────────────────

function handleTeamSelect(matchId, slot, teamName) {
  const found = findMatch(bracket, matchId);
  if (!found) return;

  const { match } = found;

  // Clicking the current winner un-sets it; otherwise set as winner
  const newWinner = match.winner === teamName ? null : teamName;
  bracket = setWinner(bracket, matchId, newWinner);

  persist();
  render();
}

// ─── Drag & Drop ─────────────────────────────────────────────────────────────

function bindDragDrop() {
  const root = document.getElementById('bracket-root');
  initDragDrop(root, handleDrop);
}

/**
 * Handle a completed drag from one team-row to another.
 * The dragged team occupies the destination slot;
 * cascade logic handles displaced teams automatically.
 */
function handleDrop(fromMatchId, fromSlot, toMatchId, toSlot) {
  const fromFound = findMatch(bracket, fromMatchId);
  if (!fromFound) return;

  const { match: fromMatch } = fromFound;
  const draggedTeam = fromSlot === 1 ? fromMatch.team1 : fromMatch.team2;
  if (!draggedTeam) return;

  const toFound = findMatch(bracket, toMatchId);
  if (!toFound) return;
  const { match: toMatch } = toFound;

  // Don't allow placing into the same match (prevents duplicates)
  if (fromMatchId === toMatchId) return;

  // Team at destination (will be displaced)
  const displaced = toSlot === 1 ? toMatch.team1 : toMatch.team2;

  // 1. Remove dragged team from source slot (clear winner cascade)
  bracket = setWinner(bracket, fromMatchId, null);
  const fromMatchNow = findMatch(bracket, fromMatchId);
  if (fromMatchNow) {
    const m = fromMatchNow.match;
    if (fromSlot === 1) m.team1 = null;
    else                m.team2 = null;
  }

  // 2. Place dragged team into destination slot
  const toFoundNow = findMatch(bracket, toMatchId);
  if (toFoundNow) {
    const m = toFoundNow.match;
    if (toSlot === 1) m.team1 = draggedTeam;
    else              m.team2 = draggedTeam;

    // If this slot had a winner that was displaced, cascade clear it
    if (m.winner === displaced || m.winner === draggedTeam) {
      bracket = setWinner(bracket, toMatchId, null);
      const mRefresh = findMatch(bracket, toMatchId);
      if (mRefresh) {
        if (toSlot === 1) mRefresh.match.team1 = draggedTeam;
        else              mRefresh.match.team2 = draggedTeam;
      }
    }
  }

  persist();
  render();
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function bindToolbar() {
  document.getElementById('btn-reset')?.addEventListener('click', handleReset);
  document.getElementById('btn-export-json')?.addEventListener('click', () => exportJSON(bracket));
  document.getElementById('btn-import-json')?.addEventListener('click', handleImport);
  document.getElementById('btn-export-png')?.addEventListener('click', handleExportPNG);
}

function handleReset() {
  if (!confirm('Reset all predictions? This cannot be undone.')) return;
  clearBracket();
  bracket = getInitialBracket();
  persist();
  render();
}

async function handleImport() {
  const imported = await importJSON();
  if (!imported) return;
  bracket = imported;
  persist();
  render();
}

async function handleExportPNG() {
  if (!window.html2canvas) {
    alert('html2canvas not loaded. Check your internet connection.');
    return;
  }
  const root = document.getElementById('bracket-root');
  const canvas = await html2canvas(root, {
    backgroundColor: '#0B1020',
    scale: 2,
    useCORS: true,
  });
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `wc2026-bracket-${Date.now()}.png`;
  a.click();
}

// ─── Persist ─────────────────────────────────────────────────────────────────

function persist() {
  saveBracket(bracket);
}
