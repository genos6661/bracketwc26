/**
 * logic.js
 * Pure bracket state management — no DOM, no side effects.
 * All functions receive the bracket object and return a mutated copy.
 */

import { ROUNDS } from './data.js';

/** Find a match by its id, searching all rounds. */
export function findMatch(bracket, matchId) {
  for (const round of [...ROUNDS, 'third']) {
    const match = bracket[round]?.find(m => m.id === matchId);
    if (match) return { match, round };
  }
  return null;
}

/**
 * Set the winner of a match, propagate to the next round,
 * and cascade-clear any downstream picks that become invalid.
 *
 * @param {object} bracket  - Current bracket state (will be mutated on a clone).
 * @param {string} matchId  - ID of the match being decided.
 * @param {string|null} team - Winning team name, or null to clear.
 * @returns {object} New bracket state.
 */
export function setWinner(bracket, matchId, team) {
  const state = deepClone(bracket);
  const found = findMatch(state, matchId);
  if (!found) return state;

  const { match } = found;
  const prevWinner = match.winner;
  match.winner = team;

  // Propagate into next round
  if (match.nextMatch) {
    placeTeam(state, match.nextMatch, match.nextSlot, team, prevWinner);
  }

  // Handle loser slot (third place from SF)
  if (match.loserNext && team) {
    const loser = getLoser(match, team);
    const prevLoser = prevWinner ? getLoser(match, prevWinner) : null;
    placeTeam(state, match.loserNext, match.loserSlot, loser, prevLoser);
  }

  return state;
}

/**
 * Place a team into a slot of a target match,
 * clearing any downstream picks caused by the displaced team.
 */
function placeTeam(state, targetMatchId, slot, newTeam, displaced) {
  const found = findMatch(state, targetMatchId);
  if (!found) return;

  const { match } = found;
  const slotKey = slot === 1 ? 'team1' : 'team2';
  match[slotKey] = newTeam || null;

  // If winner of this match was the displaced team, cascade clear
  if (displaced && match.winner === displaced) {
    cascadeClear(state, match);
  }

  // If current winner is no longer a participant, clear it
  if (match.winner && match.winner !== match.team1 && match.winner !== match.team2) {
    cascadeClear(state, match);
  }
}

/**
 * Recursively clear the winner of a match and all downstream picks.
 */
function cascadeClear(state, match) {
  const prevWinner = match.winner;
  match.winner = null;

  if (match.nextMatch && prevWinner) {
    const found = findMatch(state, match.nextMatch);
    if (found) {
      const next = found.match;
      const slotKey = match.nextSlot === 1 ? 'team1' : 'team2';
      if (next[slotKey] === prevWinner) {
        next[slotKey] = null;
        cascadeClear(state, next);
      }
    }
  }

  if (match.loserNext && prevWinner) {
    const loser = getLoser(match, prevWinner);
    // When winner is cleared, loser is also unknown
    const found = findMatch(state, match.loserNext);
    if (found) {
      const next = found.match;
      const slotKey = match.loserSlot === 1 ? 'team1' : 'team2';
      if (next[slotKey] === loser) {
        next[slotKey] = null;
        cascadeClear(state, next);
      }
    }
  }
}

/**
 * Given a match and a winner name, return the other team (loser).
 */
function getLoser(match, winner) {
  if (match.team1 === winner) return match.team2;
  if (match.team2 === winner) return match.team1;
  return null;
}

/**
 * Set a team name directly into a match slot (team1 or team2).
 * Used when drag-dropping the initial R32 picks.
 */
export function setTeamInSlot(bracket, matchId, slot, teamName) {
  const state = deepClone(bracket);
  const found = findMatch(state, matchId);
  if (!found) return state;
  const { match } = found;
  const slotKey = slot === 1 ? 'team1' : 'team2';
  match[slotKey] = teamName;
  return state;
}

/** Utility: structured deep clone via JSON. */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
