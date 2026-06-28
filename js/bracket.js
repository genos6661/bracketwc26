/**
 * bracket.js
 * Renders the bracket DOM from state.
 * Positioning uses a mathematical slot-height system so every card
 * in round N is vertically centred between its two feeder cards.
 *
 * Core idea:
 *   CARD_H  = height of one match card (2 team rows + 1 divider)
 *   SLOT_H  = total vertical space one "slot" occupies per round
 *
 *   R32  → slotH = CARD_H + GAP          (16 matches)
 *   R16  → slotH = slotH_r32 * 2         (8 matches,  each spans 2 R32 slots)
 *   QF   → slotH = slotH_r16 * 2         (4 matches)
 *   SF   → slotH = slotH_qf  * 2         (2 matches)
 *   Final→ slotH = slotH_sf  * 2         (1 match)
 *
 *   Each card is placed with:
 *     margin-top = (slotH - CARD_H) / 2   ← first card of round
 *     gap between cards = slotH - CARD_H
 */

import { ROUNDS, ROUND_LABELS } from './data.js';

// ─── Layout constants (must match CSS vars) ──────────────────
const TEAM_H    = 46;   // --team-h
const DIVIDER_H = 1;    // --divider-h
const BASE_GAP  = 12;   // gap between R32 cards (px) — tune freely

const CARD_H = TEAM_H * 2 + DIVIDER_H;  // 93px

/**
 * Slot height doubles each round.
 * roundIndex 0 = R32, 1 = R16, … 4 = Final
 */
function slotH(roundIndex) {
  const base = CARD_H + BASE_GAP;      // smallest unit: one R32 card + gap
  return base * Math.pow(2, roundIndex);
}

/**
 * Top padding for the first card in a column.
 * The first card sits centred inside its slot, so:
 *   paddingTop = (slotH - CARD_H) / 2
 */
function firstCardPadding(roundIndex) {
  return (slotH(roundIndex) - CARD_H) / 2;
}

/**
 * Gap between cards in a column.
 * Subsequent cards are spaced by one full slot minus the card height.
 */
function cardGap(roundIndex) {
  return slotH(roundIndex) - CARD_H;
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Render the full bracket into #bracket-root.
 * @param {object}   bracket
 * @param {Function} onSelect  callback(matchId, slot, teamName)
 */
export function renderBracket(bracket, onSelect) {
  const root = document.getElementById('bracket-root');
  root.innerHTML = '';

  const mainWrapper = document.createElement('div');
  mainWrapper.className = 'bracket-main';

  ROUNDS.forEach((roundKey, roundIndex) => {
    const col = buildRoundColumn(bracket, roundKey, roundIndex, onSelect);
    mainWrapper.appendChild(col);

    if (roundIndex < ROUNDS.length - 1) {
      const connector = buildConnectorColumn(roundKey);
      mainWrapper.appendChild(connector);
    }
  });

  root.appendChild(mainWrapper);

  // Third place sits below the final column
  const thirdSection = buildThirdPlace(bracket, onSelect);
  root.appendChild(thirdSection);
}

// ─── Round column ────────────────────────────────────────────

function buildRoundColumn(bracket, roundKey, roundIndex, onSelect) {
  const col = document.createElement('div');
  col.className = 'round-column';
  col.dataset.round = roundKey;

  // Label row (same height across all columns so tops align)
  const label = document.createElement('div');
  label.className = 'round-label';
  label.textContent = ROUND_LABELS[roundKey];
  col.appendChild(label);

  const wrapper = document.createElement('div');
  wrapper.className = 'matches-wrapper';

  const matches = bracket[roundKey] || [];
  const pt      = firstCardPadding(roundIndex);
  const gap     = cardGap(roundIndex);

  matches.forEach((match, i) => {
    const item = document.createElement('div');
    item.className = 'match-item';
    // First card gets top-padding to centre it in its slot;
    // subsequent cards get margin-top equal to the gap between slots.
    item.style.paddingTop = i === 0 ? `${pt}px` : '0';
    item.style.marginTop  = i === 0 ? '0' : `${gap}px`;

    const card = buildMatchCard(match, onSelect);
    item.appendChild(card);
    wrapper.appendChild(item);
  });

  col.appendChild(wrapper);
  return col;
}

// ─── Match card ──────────────────────────────────────────────

function buildMatchCard(match, onSelect) {
  const card = document.createElement('div');
  card.className = 'match-card';
  card.dataset.matchId = match.id;

  const row1    = buildTeamRow(match, 1, match.team1, onSelect);
  const divider = document.createElement('div');
  divider.className = 'match-divider';
  const row2 = buildTeamRow(match, 2, match.team2, onSelect);

  card.appendChild(row1);
  card.appendChild(divider);
  card.appendChild(row2);

  return card;
}

function buildTeamRow(match, slot, teamName, onSelect) {
  const isWinner = teamName && match.winner === teamName;
  const isEmpty  = !teamName;

  const row = document.createElement('div');
  row.className = ['team-row', isWinner ? 'team-winner' : '', isEmpty ? 'team-empty' : '']
    .filter(Boolean).join(' ');

  row.dataset.matchId = match.id;
  row.dataset.slot    = slot;
  row.draggable       = !isEmpty;

  const flag = document.createElement('span');
  flag.className   = 'team-flag';
  flag.textContent = teamName ? getFlagEmoji(teamName) : '';

  const name = document.createElement('span');
  name.className   = 'team-name';
  name.textContent = teamName || 'TBD';

  const check = document.createElement('span');
  check.className = 'winner-check';
  check.setAttribute('aria-hidden', 'true');
  check.textContent = '✓';

  row.appendChild(flag);
  row.appendChild(name);
  row.appendChild(check);

  row.setAttribute('role', 'button');
  row.setAttribute('tabindex', isEmpty ? '-1' : '0');
  row.setAttribute('aria-label',
    teamName
      ? `${teamName} – ${isWinner ? 'winner' : 'click to set as winner'}`
      : 'TBD – awaiting team'
  );

  if (!isEmpty && onSelect) {
    const handler = () => onSelect(match.id, slot, teamName);
    row.addEventListener('click', handler);
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  }

  return row;
}

// ─── Third place ─────────────────────────────────────────────

function buildThirdPlace(bracket, onSelect) {
  const section = document.createElement('div');
  section.className = 'third-place-section';

  const label = document.createElement('div');
  label.className = 'round-label third-label';
  label.textContent = ROUND_LABELS.third;
  section.appendChild(label);

  const [match] = bracket.third;
  if (match) {
    const card = buildMatchCard(match, onSelect);
    section.appendChild(card);
  }

  return section;
}

// ─── Connector column + SVG drawing ──────────────────────────

function buildConnectorColumn(roundKey) {
  const wrapper = document.createElement('div');
  wrapper.className = 'connector-col';
  wrapper.dataset.fromRound = roundKey;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('connector-svg');
  svg.setAttribute('aria-hidden', 'true');
  wrapper.appendChild(svg);

  return wrapper;
}

/**
 * Recompute and draw all connector SVGs.
 * Must be called after layout is painted (use rAF × 2 in app.js).
 */
export function drawConnectors() {
  document.querySelectorAll('.connector-col').forEach(col => {
    const svg     = col.querySelector('.connector-svg');
    const fromCol = col.previousElementSibling;
    const toCol   = col.nextElementSibling;
    if (!svg || !fromCol || !toCol) return;

    const colRect    = col.getBoundingClientRect();
    const svgH       = col.offsetHeight;
    const svgW       = col.offsetWidth;

    svg.setAttribute('width',   svgW);
    svg.setAttribute('height',  svgH);
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);

    // Clear previous paths
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const fromCards = Array.from(fromCol.querySelectorAll('.match-card'));
    const toCards   = Array.from(toCol.querySelectorAll('.match-card'));

    for (let i = 0; i < toCards.length; i++) {
      const topCard    = fromCards[i * 2];
      const bottomCard = fromCards[i * 2 + 1];
      const toCard     = toCards[i];
      if (!topCard || !bottomCard || !toCard) continue;

      // Y midpoints relative to the connector column's top
      const topMid    = midYRel(topCard,    colRect);
      const bottomMid = midYRel(bottomCard, colRect);
      const toMid     = midYRel(toCard,     colRect);
      const joinY     = (topMid + bottomMid) / 2;

      // x positions
      const x0 = 0;           // left edge (from-side)
      const x1 = svgW * 0.42; // vertical spine x
      const x2 = svgW;        // right edge (to-side)

      // Path: stub from top card → spine, stub from bottom card → spine,
      //       vertical spine joining both, horizontal line to target
      const d = `
        M ${x0} ${topMid}    H ${x1}
        M ${x0} ${bottomMid} H ${x1}
        M ${x1} ${topMid}    V ${bottomMid}
        M ${x1} ${joinY}     H ${x2}
      `.trim().replace(/\s+/g, ' ');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'var(--border)');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(path);
    }
  });
}

function midYRel(el, parentRect) {
  const r = el.getBoundingClientRect();
  return r.top + r.height / 2 - parentRect.top;
}

// ─── Flag map ────────────────────────────────────────────────

const FLAG_MAP = {
  'Argentina':   '🇦🇷', 'Poland':      '🇵🇱', 'Australia':   '🇦🇺',
  'Denmark':     '🇩🇰', 'France':      '🇫🇷', 'Mexico':      '🇲🇽',
  'Nigeria':     '🇳🇬', 'South Korea': '🇰🇷', 'Brazil':      '🇧🇷',
  'Chile':       '🇨🇱', 'Japan':       '🇯🇵', 'Senegal':     '🇸🇳',
  'England':     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Iran':        '🇮🇷', 'Netherlands': '🇳🇱',
  'Ecuador':     '🇪🇨', 'Spain':       '🇪🇸', 'Cameroon':    '🇨🇲',
  'Germany':     '🇩🇪', 'Costa Rica':  '🇨🇷', 'Portugal':    '🇵🇹',
  'Ghana':       '🇬🇭', 'Switzerland': '🇨🇭', 'USA':         '🇺🇸',
  'Sweden':      '🇸🇪', 'Uruguay':     '🇺🇾', 'Belgium':     '🇧🇪',
  'Morocco':     '🇲🇦', 'Croatia':     '🇭🇷', 'Serbia':      '🇷🇸',
  'Colombia':    '🇨🇴',
};

function getFlagEmoji(n) { return FLAG_MAP[n] || '🏳'; }
