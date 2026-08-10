import { C, BLOCKS, EXERCISE_TYPES, ASSESSMENT_MOVEMENTS } from "./constants";

function getMoveTypes(name) { return EXERCISE_TYPES[name?.toLowerCase().trim()] || []; }

// Set of move types covered by a workout's blocks.
function getWorkoutMoveTypes(blocks) {
  const covered = new Set();
  (blocks || []).forEach((b) => b.exercises.forEach((e) => getMoveTypes(e.name).forEach((t) => covered.add(t))));
  return covered;
}
// The individual score cells for a movement map ({ keyL/keyR or key: 0|1|2 }).
function assessmentCellKeys() {
  return ASSESSMENT_MOVEMENTS.flatMap((m) => m.bilateral ? [m.key + "L", m.key + "R"] : [m.key]);
}

// Total, pain flag, and completeness for one assessment's movement scores.
function computeMovementScore(movement) {
  const vals = assessmentCellKeys().map((k) => movement?.[k]);
  const entered = vals.filter((v) => v === 0 || v === 1 || v === 2);
  return {
    total: entered.reduce((s, v) => s + v, 0),
    pain: entered.some((v) => v === 0),
    complete: entered.length === vals.length,
  };
}

// Movement level buckets used for grouping athletes. Any pain overrides the
// score: those athletes need attention before level-based programming.
function movementLevel(total, pain) {
  if (pain) return { label: "Pain flagged", color: C.red };
  if (total >= 22) return { label: "Level 3", color: C.teal };
  if (total >= 18) return { label: "Level 2", color: C.gold };
  return { label: "Level 1", color: "#A78BFA" };
}
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
// ─── SUPERSET HELPERS ─────────────────────────────────────────────────────────
function getSupersetLabels(exercises) {
  const labels = {};
  const pairsSeen = {};
  let letterIdx = 0;
  exercises.forEach((ex) => {
    if (!ex.pairId) return;
    if (pairsSeen[ex.pairId] === undefined) pairsSeen[ex.pairId] = String.fromCharCode(65 + letterIdx++);
    const letter = pairsSeen[ex.pairId];
    const count = Object.values(labels).filter((l) => l && l[0] === letter).length + 1;
    labels[ex.id] = `${letter}${count}`;
  });
  return labels;
}

// ─── MOVEMENT HISTORY HELPER ──────────────────────────────────────────────────
function getLastSets(exerciseName, athleteId, allLogs, allWorkouts, currentWorkoutId) {
  if (!exerciseName) return null;
  const name = exerciseName.toLowerCase().trim();
  const athleteLogs = allLogs
    .filter((l) => l.athleteId === athleteId && l.workoutId !== currentWorkoutId)
    .sort((a, b) => (b.loggedAt || 0) - (a.loggedAt || 0));
  for (const log of athleteLogs) {
    const wkt = allWorkouts.find((w) => w.id === log.workoutId);
    if (!wkt) continue;
    const allExercises = wkt.blocks?.flatMap((b) => b.exercises) || [];
    const match = allExercises.find((e) => e.name.toLowerCase().trim() === name);
    if (match && log.sets?.[match.id]) {
      const sets = log.sets[match.id];
      const done = sets.filter((s) => s.done || s.reps || s.load);
      if (done.length > 0) return { sets: done, date: log.date };
    }
  }
  return null;
}

function initBlocks() { return BLOCKS.map((name) => ({ id: uid(), name, exercises: [] })); }
function emptyEx() { return { id: uid(), name: "", sets: "3", reps: "8", load: "", note: "", pairId: null }; }
// ─── PR DETECTION HELPERS ─────────────────────────────────────────────────────
// Parse a numeric load out of whatever the athlete typed ("95", "95 lbs", "95lb").
// Returns null for blanks and non-numeric loads like "BW".
function parseLoadNum(v) {
  if (!v) return null;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
}

// Round a computed weight to the nearest plate increment.
function roundLoad(n, inc = 2.5) { return Math.round(n / inc) * inc; }

// ─── WEIGHT PROGRESSION ("BUMPS") ─────────────────────────────────────────────
// Look up a pending coach bump for a movement and compute the pre-fill target
// from the athlete's most recent logged session: heaviest set × (1 + pct/100).
// Returns { rule, base, target } or null when there's no rule or no usable
// numeric history (the rule stays pending until the movement is logged with a weight).
function getProgressionFill(exerciseName, athleteId, progressions, allLogs, allWorkouts, currentWorkoutId) {
  const name = exerciseName?.toLowerCase().trim();
  if (!name) return null;
  const rule = progressions.find((p) => p.athleteId === athleteId && p.exerciseName.toLowerCase().trim() === name);
  if (!rule) return null;
  const hist = getLastSets(exerciseName, athleteId, allLogs, allWorkouts, currentWorkoutId);
  if (!hist) return null;
  const nums = hist.sets.map((s) => parseLoadNum(s.load)).filter((n) => n !== null && n > 0);
  if (nums.length === 0) return null;
  const base = Math.max(...nums);
  return { rule, base, target: roundLoad(base * (1 + rule.pct / 100)) };
}
// Best numeric load an athlete has ever logged for an exercise name (excluding current workout).
function getBestLoad(exerciseName, athleteId, allLogs, allWorkouts, currentWorkoutId) {
  if (!exerciseName) return null;
  const name = exerciseName.toLowerCase().trim();
  let best = null; let bestDate = null;
  for (const log of allLogs) {
    if (log.athleteId !== athleteId || log.workoutId === currentWorkoutId) continue;
    const wkt = allWorkouts.find((w) => w.id === log.workoutId);
    if (!wkt) continue;
    for (const b of wkt.blocks || []) {
      for (const e of b.exercises) {
        if (e.name.toLowerCase().trim() !== name) continue;
        for (const s of log.sets?.[e.id] || []) {
          const n = parseLoadNum(s.load);
          if (n !== null && (best === null || n > best)) { best = n; bestDate = log.date; }
        }
      }
    }
  }
  return best !== null ? { best, date: bestDate } : null;
}

// All-time PRs per movement for one athlete, from their full log history.
function computePRs(athleteId, allLogs, allWorkouts) {
  const prs = {};
  allLogs.filter((l) => l.athleteId === athleteId).forEach((log) => {
    const wkt = allWorkouts.find((w) => w.id === log.workoutId);
    if (!wkt) return;
    wkt.blocks?.forEach((b) => b.exercises.forEach((e) => {
      (log.sets?.[e.id] || []).forEach((s) => {
        const n = parseLoadNum(s.load);
        if (n === null) return;
        const key = e.name.trim();
        if (!key) return;
        if (!prs[key] || n > prs[key].best) prs[key] = { best: n, date: log.date };
      });
    }));
  });
  return prs;
}

// Coaches prescribe intensity in the load field as e.g. "RPE 8". Pull the
// number out so the logger can show a separate RPE box instead of making the
// athlete type their weight over the prescription.
function parsePrescribedRpe(load) {
  const m = /rpe\s*:?\s*(10|\d(?:\.\d)?)/i.exec(load || "");
  return m ? m[1] : null;
}

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────
// Attendance is derived from logs, not marked separately: an athlete counts as
// present for a session date if they logged any workout assigned to them that
// day. Sessions are dates that have at least one workout.
// from/to are inclusive ISO dates ("2026-09-09"); either may be omitted.
function computeSessions(workouts, logs, { season, from, to } = {}) {
  let wkts = season && season !== "All" ? workouts.filter((w) => w.season === season) : workouts;
  if (from) wkts = wkts.filter((w) => w.date >= from);
  if (to) wkts = wkts.filter((w) => w.date <= to);
  const byId = new Map(wkts.map((w) => [w.id, w]));
  const byDate = new Map();
  wkts.forEach((w) => {
    if (!byDate.has(w.date)) byDate.set(w.date, { date: w.date, titles: [], assigned: new Set(), present: new Set() });
    const s = byDate.get(w.date);
    s.titles.push(w.title);
    (w.assignees ?? []).forEach((id) => s.assigned.add(id));
  });
  logs.forEach((l) => {
    const w = byId.get(l.workoutId);
    if (!w) return;
    const s = byDate.get(w.date);
    if (s && s.assigned.has(l.athleteId)) s.present.add(l.athleteId);
  });
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
}

// Per-athlete rollup across sessions they were assigned to.
function attendanceByAthlete(sessions, athletes) {
  return athletes.map((a) => {
    const assigned = sessions.filter((s) => s.assigned.has(a.id));
    const attended = assigned.filter((s) => s.present.has(a.id));
    return {
      athlete: a,
      assigned: assigned.length,
      attended: attended.length,
      rate: assigned.length ? attended.length / assigned.length : null,
      missedDates: assigned.filter((s) => !s.present.has(a.id)).map((s) => s.date),
    };
  }).filter((r) => r.assigned > 0);
}

export { assessmentCellKeys, attendanceByAthlete, computeMovementScore, parsePrescribedRpe, computePRs, computeSessions, emptyEx, fmtDate, getBestLoad, getLastSets, getMoveTypes, getProgressionFill, getSupersetLabels, getWorkoutMoveTypes, initBlocks, movementLevel, parseLoadNum, roundLoad, today, uid };
