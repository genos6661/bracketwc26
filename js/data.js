/**
 * data.js
 * Single source of truth for bracket structure and team data.
 * Edit team names here — no logic changes needed elsewhere.
 *
 * nextMatch : ID of the match in the next round this winner feeds into
 * nextSlot  : 1 = top slot, 2 = bottom slot of that match
 */

export const ROUNDS = ['r32', 'r16', 'qf', 'sf', 'final'];

export const ROUND_LABELS = {
  r32:   'Round of 32',
  r16:   'Round of 16',
  qf:    'Quarter-finals',
  sf:    'Semi-finals',
  final: 'Final',
  third: '3rd Place',
};

/** Canonical initial bracket. Deep-copied on every reset. */
export const INITIAL_BRACKET = {

  // ── Round of 32 ─────────────────────────────────────────────────────────
  r32: [
    { id: 'r32-1',  team1: 'South Africa',     team2: 'Canada',       winner: 'Canada', nextMatch: 'r16-1', nextSlot: 1 },
    { id: 'r32-2',  team1: 'Netherlands',     team2: 'Morocco',      winner: 'Morocco', nextMatch: 'r16-1', nextSlot: 2 },
    { id: 'r32-3',  team1: 'Germany',        team2: 'Paraguay',       winner: 'Paraguay', nextMatch: 'r16-2', nextSlot: 1 },
    { id: 'r32-4',  team1: 'France',       team2: 'Sweden',  winner: null, nextMatch: 'r16-2', nextSlot: 2 },
    { id: 'r32-5',  team1: 'Belgium',        team2: 'Senegal',        winner: null, nextMatch: 'r16-3', nextSlot: 1 },
    { id: 'r32-6',  team1: 'USA',         team2: 'Bosnia',      winner: null, nextMatch: 'r16-3', nextSlot: 2 },
    { id: 'r32-7',  team1: 'Spain',       team2: 'Austria',         winner: null, nextMatch: 'r16-4', nextSlot: 1 },
    { id: 'r32-8',  team1: 'Portugal',   team2: 'Croatia',      winner: null, nextMatch: 'r16-4', nextSlot: 2 },
    { id: 'r32-9',  team1: 'Brazil',         team2: 'Japan',     winner: 'Brazil', nextMatch: 'r16-5', nextSlot: 1 },
    { id: 'r32-10', team1: 'Cote D Ivoire',       team2: 'Norway',   winner: null, nextMatch: 'r16-5', nextSlot: 2 },
    { id: 'r32-11', team1: 'Mexico',      team2: 'Ecuador',        winner: null, nextMatch: 'r16-6', nextSlot: 1 },
    { id: 'r32-12', team1: 'England',   team2: 'Congo',     winner: null, nextMatch: 'r16-6', nextSlot: 2 },
    { id: 'r32-13', team1: 'Switzerland',           team2: 'Algeria',       winner: null, nextMatch: 'r16-7', nextSlot: 1 },
    { id: 'r32-14', team1: 'Colombia',       team2: 'Ghana',      winner: null, nextMatch: 'r16-7', nextSlot: 2 },
    { id: 'r32-15', team1: 'Australia',       team2: 'Egypt',      winner: null, nextMatch: 'r16-8', nextSlot: 1 },
    { id: 'r32-16', team1: 'Argentina',        team2: 'Cabo Verde',     winner: null, nextMatch: 'r16-8', nextSlot: 2 },
  ],

  // ── Round of 16 ──────────────────────────────────────────────────────────
  r16: [
    { id: 'r16-1', team1: 'Canada', team2: 'Morocco', winner: null, nextMatch: 'qf-1', nextSlot: 1 },
    { id: 'r16-2', team1: 'Paraguay', team2: null, winner: null, nextMatch: 'qf-1', nextSlot: 2 },
    { id: 'r16-3', team1: null, team2: null, winner: null, nextMatch: 'qf-2', nextSlot: 1 },
    { id: 'r16-4', team1: null, team2: null, winner: null, nextMatch: 'qf-2', nextSlot: 2 },
    { id: 'r16-5', team1: 'Brazil', team2: null, winner: null, nextMatch: 'qf-3', nextSlot: 1 },
    { id: 'r16-6', team1: null, team2: null, winner: null, nextMatch: 'qf-3', nextSlot: 2 },
    { id: 'r16-7', team1: null, team2: null, winner: null, nextMatch: 'qf-4', nextSlot: 1 },
    { id: 'r16-8', team1: null, team2: null, winner: null, nextMatch: 'qf-4', nextSlot: 2 },
  ],

  // ── Quarter-finals ───────────────────────────────────────────────────────
  qf: [
    { id: 'qf-1', team1: null, team2: null, winner: null, nextMatch: 'sf-1', nextSlot: 1 },
    { id: 'qf-2', team1: null, team2: null, winner: null, nextMatch: 'sf-1', nextSlot: 2 },
    { id: 'qf-3', team1: null, team2: null, winner: null, nextMatch: 'sf-2', nextSlot: 1 },
    { id: 'qf-4', team1: null, team2: null, winner: null, nextMatch: 'sf-2', nextSlot: 2 },
  ],

  // ── Semi-finals ──────────────────────────────────────────────────────────
  sf: [
    { id: 'sf-1', team1: null, team2: null, winner: null, nextMatch: 'final-1', nextSlot: 1, loserNext: 'third-1', loserSlot: 1 },
    { id: 'sf-2', team1: null, team2: null, winner: null, nextMatch: 'final-1', nextSlot: 2, loserNext: 'third-1', loserSlot: 2 },
  ],

  // ── Final ────────────────────────────────────────────────────────────────
  final: [
    { id: 'final-1', team1: null, team2: null, winner: null, nextMatch: null, nextSlot: null },
  ],

  // ── Third Place ──────────────────────────────────────────────────────────
  third: [
    { id: 'third-1', team1: null, team2: null, winner: null, nextMatch: null, nextSlot: null },
  ],
};

/** Returns a deep copy so mutations don't affect the canonical data. */
export function getInitialBracket() {
  return JSON.parse(JSON.stringify(INITIAL_BRACKET));
}
