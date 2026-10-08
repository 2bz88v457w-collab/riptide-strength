// ─── ATHLETE NOTES ────────────────────────────────────────────────────────────
// Athletes write in two places: the session note, and a note under each block.
// Block notes were only visible by opening a session, so the notes feed pulls
// everything into one place and scans it for pain and injury words.

// Words that mean "look at this". Flags stay up until the coach marks the
// session addressed. Deliberately no negation handling: "no pain today" still
// flags — a false alarm costs one tap, a missed injury costs much more.
const PAIN_TERMS = [
  /\bhurt(?:s|ing)?\b/gi,
  /\bpain(?:s|ful)?\b/gi,
  /\binjur(?:y|ies|ed)\b/gi,
  /\bach(?:e|es|ing|y)\b/gi,
  /\btweak(?:ed|s)?\b/gi,
  /\bpulled\b/gi,
  /\bstrain(?:ed|s)?\b/gi,
  /\bsprain(?:ed|s)?\b/gi,
  /\bswollen\b/gi,
  /\bswelling\b/gi,
  /\bnumb(?:ness)?\b/gi,
  /\bpopped\b/gi,
];
// Soreness is normal after lifting, so it flags too but clears on its own.
const SORE_TERMS = [/\bsore(?:ness)?\b/gi];
const SORE_DAYS = 7;

// Notes from before short course started don't raise flags (they still show in
// the feed). Summer notes are history, not something to act on today.
const NOTE_FLAGS_SINCE = "2026-09-09";

const matchAll = (text, patterns) => patterns.flatMap((re) => [...(text || "").matchAll(re)].map((m) => m[0]));

function scanNote(text) {
  const pain = matchAll(text, PAIN_TERMS);
  const sore = matchAll(text, SORE_TERMS);
  return { level: pain.length ? "pain" : sore.length ? "sore" : null, terms: [...pain, ...sore] };
}

// Split text into plain and flagged pieces so the UI can highlight the words.
const ALL_TERMS = new RegExp([...PAIN_TERMS, ...SORE_TERMS].map((re) => re.source).join("|"), "gi");
function highlightParts(text) {
  const parts = [];
  let last = 0;
  for (const m of (text || "").matchAll(ALL_TERMS)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), hit: false });
    parts.push({ text: m[0], hit: true });
    last = m.index + m[0].length;
  }
  if (last < (text || "").length) parts.push({ text: text.slice(last), hit: false });
  return parts;
}

// One card per logged session that has any athlete-written text.
// A card is `active` (a live alert) when it mentions pain and hasn't been
// addressed since the athlete last saved, or mentions soreness within the last
// SORE_DAYS and hasn't been addressed.
function buildNoteFeed(logs, workouts, athletes, reviews = [], { now = Date.now(), since = NOTE_FLAGS_SINCE } = {}) {
  const wktById = new Map(workouts.map((w) => [w.id, w]));
  const athById = new Map(athletes.map((a) => [a.id, a]));
  const reviewByLog = new Map(reviews.map((r) => [r.log_id, r]));

  return logs.map((log) => {
    const athlete = athById.get(log.athleteId);
    if (!athlete) return null;
    const workout = wktById.get(log.workoutId);
    const entries = [];
    if (log.note?.trim()) entries.push({ label: "Session note", text: log.note.trim() });
    Object.entries(log.blockNotes || {}).forEach(([blockId, text]) => {
      if (!text?.trim()) return;
      const block = workout?.blocks?.find((b) => b.id === blockId);
      entries.push({ label: block?.name || "Block note", text: text.trim() });
    });
    if (!entries.length) return null;
    entries.forEach((e) => { e.scan = scanNote(e.text); });

    const date = workout?.date || log.date || "";
    const loggedAt = Number(log.loggedAt) || (date ? new Date(date + "T12:00:00").getTime() : 0);
    const level = entries.some((e) => e.scan.level === "pain") ? "pain"
      : entries.some((e) => e.scan.level === "sore") ? "sore" : null;
    const review = reviewByLog.get(log.id) || null;
    const addressed = !!review && Number(review.reviewed_logged_at) >= loggedAt;
    const inWindow = !!date && date >= since;
    const soreFresh = now - loggedAt <= SORE_DAYS * 86400000;
    const active = !!level && inWindow && !addressed && (level === "pain" || soreFresh);

    return { log, athlete, workout, date, loggedAt, entries, level, review, addressed, active };
  }).filter(Boolean)
    .sort((a, b) => b.loggedAt - a.loggedAt);
}

// The athlete's own notes from their last session that had any — shown back to
// them while they log, so "shoulder felt off last week" is in front of them
// instead of only in the coach's feed. Block notes are matched by block NAME,
// not id: every week's workout is a fresh row with fresh block ids, but the
// names ("Block 2", "Cool Down") carry across.
function lastSessionNotes(athleteId, logs, workouts, currentWorkoutId) {
  if (!athleteId) return null;
  const wktById = new Map(workouts.map((w) => [w.id, w]));
  const mine = logs
    .filter((l) => l.athleteId === athleteId && l.workoutId !== currentWorkoutId)
    .map((l) => ({ log: l, workout: wktById.get(l.workoutId) }))
    .filter((x) => x.workout)
    .sort((a, b) => (b.workout.date || "").localeCompare(a.workout.date || "") || (Number(b.log.loggedAt) || 0) - (Number(a.log.loggedAt) || 0));

  for (const { log, workout } of mine) {
    const byBlockName = {};
    Object.entries(log.blockNotes || {}).forEach(([blockId, text]) => {
      const name = workout.blocks?.find((b) => b.id === blockId)?.name;
      if (name && text?.trim()) byBlockName[name] = text.trim();
    });
    const sessionNote = log.note?.trim() || "";
    if (sessionNote || Object.keys(byBlockName).length) {
      return { date: workout.date, title: workout.title, sessionNote, byBlockName, rpe: log.rpe || "" };
    }
  }
  return null;
}

// Live alerts only, pain before soreness, newest first within each.
function activeNoteFlags(feed) {
  return feed.filter((c) => c.active).sort((a, b) => (a.level === b.level ? b.loggedAt - a.loggedAt : a.level === "pain" ? -1 : 1));
}

export { NOTE_FLAGS_SINCE, SORE_DAYS, activeNoteFlags, buildNoteFeed, highlightParts, lastSessionNotes, scanNote };
