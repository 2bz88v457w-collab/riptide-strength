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

// ─── MULTI-WEEK PLANNING ──────────────────────────────────────────────────────
// Movements stay put across a training block; only the prescription moves. So a
// plan is one weekday's workout repeated N weeks, with sets/reps/load supplied
// per week. The generated workouts are ordinary, independent workouts — editing
// one later never reaches back into the plan.

const addDays = (iso, n) => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// "Strength - Week 2 - Monday" → "Strength - Week {n} - Monday" so the numbering
// continues naturally; otherwise fall back to appending the week.
function titleTemplateFrom(title) {
  const t = (title || "").trim();
  if (/week\s*\d+/i.test(t)) return t.replace(/week\s*\d+/i, "Week {n}");
  return t ? `${t} — Week {n}` : "Week {n}";
}

// grid[weekIndex][exerciseId] = { sets, reps, load }; anything missing falls
// back to what the source workout prescribed.
//
// Week 1 IS the source workout — it keeps the workout's id (so saving updates it
// rather than creating a twin) and its block and exercise ids (logs key their
// sets by exercise id, so reissuing those would orphan anything already logged).
// Later weeks are fresh workouts with fresh ids throughout.
function buildPlannedWorkouts(source, opts, grid, makeId = uid) {
  const { weeks = 4, startDate, titleTemplate, startWeekNumber = 1, everyDays = 7 } = opts;
  return Array.from({ length: weeks }, (_, i) => {
    const isSourceWeek = i === 0;
    return {
      id: isSourceWeek ? source.id : makeId(),
      title: (titleTemplate || "Week {n}").replace(/\{n\}/g, String(startWeekNumber + i)),
      date: addDays(startDate, i * everyDays),
      season: source.season || "",
      assignees: [...(source.assignees ?? [])],
      blocks: (source.blocks ?? []).map((b) => ({
        ...b,
        id: isSourceWeek ? b.id : makeId(),
        exercises: (b.exercises ?? []).map((ex) => {
          const cell = grid?.[i]?.[ex.id] || {};
          return {
            ...ex,
            id: isSourceWeek ? ex.id : makeId(),
            sets: cell.sets ?? ex.sets,
            reps: cell.reps ?? ex.reps,
            load: cell.load ?? ex.load,
          };
        }),
      })),
    };
  });
}

// ─── LOG-DERIVED BASELINES ────────────────────────────────────────────────────
// There is no formal test day — testing 80 athletes individually was never going
// to happen. So an athlete's *first logged number* for a movement is their
// baseline, and progress is measured from there. That gives a baseline for every
// movement they touch instead of three, at no cost in coach time.
//
// Scoped by season by default: short course should start fresh rather than
// measure against long-course numbers.
//
// Honest caveat when reading these: a first log taken on a technique or
// feel-it-out day overstates the gain (45 → 95 lbs on a movement someone was
// learning reads as +111%). Good for motivating athletes, not a strength test.

// Best number an athlete hit in a single session for one movement. Loads and
// reps both go through parseLoadNum, so "12 each" and "95 lbs" both count.
function sessionBest(sets, field) {
  let best = null;
  for (const s of sets || []) {
    const n = parseLoadNum(s?.[field]);
    if (n !== null && n > 0 && (best === null || n > best)) best = n;
  }
  return best;
}
const maxOrNull = (a, b) => (a === null ? b : b === null ? a : Math.max(a, b));

// One entry per movement, each holding a row per athlete who has logged it:
// first → best, with the change. Movements with any weight logged are measured
// in load; bodyweight movements (push-ups, pull-ups) fall back to reps, which is
// what the old three-metric test day measured two of anyway.
function computeMovementProgress(athletes, workouts, logs, { season, from, to } = {}) {
  let wkts = season && season !== "All" ? workouts.filter((w) => w.season === season) : workouts;
  if (from) wkts = wkts.filter((w) => w.date >= from);
  if (to) wkts = wkts.filter((w) => w.date <= to);

  const wktById = new Map(wkts.map((w) => [w.id, w]));
  const moveOfExercise = new Map();   // exercise id → movement key
  const displayName = new Map();      // movement key → name as the coach wrote it
  wkts.forEach((w) => (w.blocks || []).forEach((b) => (b.exercises || []).forEach((e) => {
    const name = (e.name || "").trim();
    if (!name) return;
    const key = name.toLowerCase();
    moveOfExercise.set(e.id, key);
    if (!displayName.has(key)) displayName.set(key, name);
  })));

  const athleteById = new Map(athletes.map((a) => [a.id, a]));
  // movement key → athlete id → session date → { load, reps }. Keying by date
  // collapses a movement that appears in two blocks of the same session.
  const acc = new Map();
  logs.forEach((l) => {
    const w = wktById.get(l.workoutId);
    if (!w || !athleteById.has(l.athleteId)) return;
    Object.entries(l.sets || {}).forEach(([exId, sets]) => {
      const key = moveOfExercise.get(exId);
      if (!key) return;
      const load = sessionBest(sets, "load");
      const reps = sessionBest(sets, "reps");
      if (load === null && reps === null) return;
      if (!acc.has(key)) acc.set(key, new Map());
      const byAthlete = acc.get(key);
      if (!byAthlete.has(l.athleteId)) byAthlete.set(l.athleteId, new Map());
      const byDate = byAthlete.get(l.athleteId);
      const prev = byDate.get(w.date) || { load: null, reps: null };
      byDate.set(w.date, { load: maxOrNull(prev.load, load), reps: maxOrNull(prev.reps, reps) });
    });
  });

  return [...acc.entries()].map(([key, byAthlete]) => {
    const anyLoad = [...byAthlete.values()].some((byDate) => [...byDate.values()].some((v) => v.load !== null));
    const metric = anyLoad ? "load" : "reps";
    const rows = [...byAthlete.entries()].map(([athleteId, byDate]) => {
      const points = [...byDate.entries()]
        .map(([date, v]) => ({ date, value: v[metric] }))
        .filter((p) => p.value !== null)
        .sort((a, b) => a.date.localeCompare(b.date));
      if (points.length === 0) return null;
      const first = points[0];
      const best = points.reduce((m, p) => (p.value > m.value ? p : m), points[0]);
      const delta = best.value - first.value;
      return {
        athlete: athleteById.get(athleteId),
        first, best, latest: points[points.length - 1],
        sessions: points.length, delta,
        pct: first.value ? (delta / first.value) * 100 : null,
      };
    }).filter(Boolean);
    return { key, movement: displayName.get(key), metric, rows: rows.sort((a, b) => b.delta - a.delta || a.athlete.name.localeCompare(b.athlete.name)) };
  }).filter((m) => m.rows.length > 0)
    .sort((a, b) => b.rows.length - a.rows.length || a.movement.localeCompare(b.movement));
}

// ─── NEEDS ATTENTION ──────────────────────────────────────────────────────────
// Thresholds live here so they are easy to retune once a season of data exists.
const ATTENTION = {
  quietDays: 7,        // no log for this many days, having had work assigned
  minRpeSessions: 4,   // never judge a trend on fewer sessions than this
  rampDelta: 1.5,      // recent average this much above the earlier average
  rampFloor: 7,        // …and recent average at least this high, else it is not overreach
  flatCeiling: 5,      // every recent session at or below this reads as under-challenged
  window: 3,           // sessions per comparison window
};

const daysBetween = (a, b) => Math.floor((a - b) / 86400000);

// Session RPE as the athlete recorded it. Blank stays blank — an unanswered
// RPE box is not a data point.
function sessionRpe(log) {
  const n = parseFloat(log?.rpe);
  return isNaN(n) ? null : n;
}

// One row per athlete describing why (or whether) they need a look.
function computeAttention(athletes, workouts, logs, { today = new Date(), cfg = ATTENTION } = {}) {
  const wktById = new Map(workouts.map((w) => [w.id, w]));
  const todayISO = today.toISOString().slice(0, 10);
  return athletes.map((a) => {
    const mine = logs
      .filter((l) => l.athleteId === a.id)
      .map((l) => ({ ...l, date: wktById.get(l.workoutId)?.date || l.date }))
      .filter((l) => l.date)
      .sort((x, y) => x.date.localeCompare(y.date));
    const last = mine[mine.length - 1];
    const daysSinceLog = last ? daysBetween(new Date(todayISO + "T12:00:00"), new Date(last.date + "T12:00:00")) : null;

    // Assigned but unlogged inside the quiet window — the difference between
    // "gone quiet" and "nothing was on the schedule".
    const loggedWorkoutIds = new Set(mine.map((l) => l.workoutId));
    const missed = workouts.filter((w) => {
      if (!(w.assignees ?? []).includes(a.id) || loggedWorkoutIds.has(w.id)) return false;
      const age = daysBetween(new Date(todayISO + "T12:00:00"), new Date(w.date + "T12:00:00"));
      return age >= 0 && age <= cfg.quietDays;
    });

    const rpes = mine.map(sessionRpe).filter((n) => n !== null);
    const enoughRpe = rpes.length >= cfg.minRpeSessions;
    const recent = rpes.slice(-cfg.window);
    const prior = rpes.slice(-cfg.window * 2, -cfg.window);
    const avg = (xs) => xs.reduce((s, n) => s + n, 0) / xs.length;
    const recentAvg = recent.length ? avg(recent) : null;
    const priorAvg = prior.length ? avg(prior) : null;

    const flags = [];
    if (missed.length > 0 && (daysSinceLog === null || daysSinceLog >= cfg.quietDays)) {
      flags.push({
        kind: "quiet",
        label: `No log in ${daysSinceLog === null ? "any" : daysSinceLog} day${daysSinceLog === 1 ? "" : "s"}`,
        detail: `${missed.length} assigned session${missed.length === 1 ? "" : "s"} not logged`,
        severity: 3 + Math.min(missed.length, 3),
      });
    }
    if (enoughRpe && priorAvg !== null && recentAvg - priorAvg >= cfg.rampDelta && recentAvg >= cfg.rampFloor) {
      flags.push({
        kind: "ramp",
        label: "RPE trending up",
        detail: `last ${recent.length} averaged ${recentAvg.toFixed(1)}, up from ${priorAvg.toFixed(1)} — possible overreach`,
        severity: 5,
      });
    }
    if (enoughRpe && recent.length === cfg.window && recent.every((n) => n <= cfg.flatCeiling)) {
      flags.push({
        kind: "flat",
        label: "RPE flat and low",
        detail: `last ${recent.length} sessions all at or below ${cfg.flatCeiling} — may be under-challenged`,
        severity: 2,
      });
    }

    return {
      athlete: a, flags, daysSinceLog, missedCount: missed.length,
      logCount: mine.length, rpeCount: rpes.length, enoughRpe,
      severity: flags.reduce((m, f) => Math.max(m, f.severity), 0),
    };
  }).filter((r) => r.flags.length > 0)
    .sort((x, y) => y.severity - x.severity || x.athlete.name.localeCompare(y.athlete.name));
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

export { ATTENTION, addDays, buildPlannedWorkouts, titleTemplateFrom, assessmentCellKeys, attendanceByAthlete, computeAttention, computeMovementProgress, sessionRpe, computeMovementScore, parsePrescribedRpe, computePRs, computeSessions, emptyEx, fmtDate, getBestLoad, getLastSets, getMoveTypes, getProgressionFill, getSupersetLabels, getWorkoutMoveTypes, initBlocks, movementLevel, parseLoadNum, roundLoad, today, uid };
