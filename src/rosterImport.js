// ─── ROSTER IMPORT ────────────────────────────────────────────────────────────
// Rosters turn over twice a year. The coach pastes rows straight from the
// season spreadsheet (Pool Group | First Name | Last Name), and every row is
// checked against the current roster *before* anything is saved — the check
// that caught "Brian" vs "Bryan" Stankey by hand in Sept 2026.

// Letters only, lowercased: "Anh-na Le" and "anhna le" compare equal.
const normName = (s) => (s || "").toLowerCase().replace(/[^a-z]/g, "");

// Team convention: PIN is the first four letters of the last name in capitals.
// Login is case-sensitive, so this must match what swimmers are told exactly.
function pinFromLastName(last) {
  return (last || "").replace(/[^a-z]/gi, "").slice(0, 4).toUpperCase();
}

function splitName(full) {
  const parts = (full || "").trim().split(/\s+/);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") };
}

function editDistance(a, b) {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return prev[b.length];
}
const similarity = (a, b) => {
  const m = Math.max(a.length, b.length);
  return m ? 1 - editDistance(a, b) / m : 1;
};

// Accepts what Excel puts on the clipboard (tab-separated) or typed commas.
// Three or more columns: group, first, last[, pin] — the spreadsheet's layout.
// Two columns: group, "First Last". A header row ("Pool Group, …") is skipped.
function parseRosterPaste(text) {
  const rows = [];
  (text || "").split(/\r?\n/).forEach((raw, i) => {
    if (!raw.trim()) return;
    const cells = (raw.includes("\t") ? raw.split("\t") : raw.split(",")).map((c) => c.trim());
    if (/pool\s*group|first\s*name/i.test(cells.join(" "))) return;
    const line = i + 1;
    let group, first, last, pin;
    if (cells.length === 2) {
      group = cells[0];
      ({ first, last } = splitName(cells[1]));
    } else {
      [group, first, last, pin] = cells;
    }
    if (!group || !first || !last) {
      rows.push({ line, raw: raw.trim(), error: "Needs a pool group, first name, and last name" });
      return;
    }
    const derived = !pin;
    pin = pin || pinFromLastName(last);
    rows.push({
      line, raw: raw.trim(), group, first, last, name: `${first} ${last}`, pin, pinDerived: derived,
      pinWarning: pin.length < 4 ? `PIN is only ${pin.length} letter${pin.length === 1 ? "" : "s"}` : null,
    });
  });
  return rows;
}

// Two names are "close" when the last names match and the first names are near
// (Brian/Bryan, Ben/Benjamin, Madeline/Madelyn), or the whole name is one typo
// away (Pierskala/Pierskalla). Siblings — Freja and Filip Symreng — are not.
function isCloseName(a, b) {
  const x = splitName(a); const y = splitName(b);
  const fx = normName(x.first); const fy = normName(y.first);
  const firstNear = fx && fy && (fx.startsWith(fy) || fy.startsWith(fx) || similarity(fx, fy) >= 0.7);
  if (normName(x.last) === normName(y.last) && firstNear) return true;
  return similarity(normName(a), normName(b)) >= 0.85;
}

const sameGroup = (a, b) => (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();

// Status per row:
//   new        — no one like them on the roster; added with their PIN
//   unchanged  — already on the roster, same group; nothing to do
//   move       — already on the roster, different group; group updated
//   unarchive  — on the roster but archived (returning swimmer)
//   close      — a near-match exists; held back until the coach decides
//   duplicate  — appears earlier in the same paste
//   error      — row couldn't be read
// `untouched` lists active swimmers not in the paste. Nothing happens to them —
// in the fall that is mostly high school swimmers who are coming back.
function classifyRosterImport(rows, athletes) {
  const seen = new Set();
  const matchedIds = new Set();
  const out = rows.map((r) => {
    if (r.error) return { ...r, status: "error" };
    const key = normName(r.name);
    if (seen.has(key)) return { ...r, status: "duplicate" };
    seen.add(key);

    const exact = athletes.find((a) => normName(a.name) === key);
    if (exact) {
      matchedIds.add(exact.id);
      if (exact.archived) return { ...r, status: "unarchive", athlete: exact, groupChange: !sameGroup(exact.event, r.group) };
      if (!sameGroup(exact.event, r.group)) return { ...r, status: "move", athlete: exact };
      return { ...r, status: "unchanged", athlete: exact };
    }
    const close = athletes.filter((a) => isCloseName(a.name, r.name));
    if (close.length) {
      close.forEach((a) => matchedIds.add(a.id));
      return { ...r, status: "close", matches: close };
    }
    return { ...r, status: "new" };
  });
  const untouched = athletes.filter((a) => !a.archived && !matchedIds.has(a.id));
  return { rows: out, untouched };
}

// Which rows act by default. Close matches never do — adding a near-duplicate
// creates an empty twin beside the swimmer who has all the logs.
const DEFAULT_CHOICE = { new: "add", move: "move", unarchive: "unarchive", close: "skip" };

// Turn the coach's per-row choices into roster-admin calls.
function buildImportActions(classified, choices, makeId) {
  const actions = [];
  classified.forEach((r, i) => {
    const choice = choices[i] ?? DEFAULT_CHOICE[r.status];
    if (!choice || choice === "skip") return;
    if (choice === "add") {
      actions.push({ kind: "create", row: i, athlete: { id: makeId(), name: r.name, event: r.group }, pin: r.pin });
    } else if (choice === "move") {
      actions.push({ kind: "update", row: i, athlete: { ...r.athlete, event: r.group } });
    } else if (choice === "unarchive") {
      actions.push({ kind: "update", row: i, athlete: { ...r.athlete, event: r.group, archived: false } });
    } else if (choice.startsWith("rename:")) {
      // Renaming keeps the swimmer's logs, PIN, and login (roster-admin moves
      // the auth email to the new name).
      const target = r.matches.find((a) => a.id === choice.slice(7));
      if (target) actions.push({ kind: "update", row: i, athlete: { ...target, name: r.name, event: r.group } });
    }
  });
  return actions;
}

export { DEFAULT_CHOICE, buildImportActions, classifyRosterImport, isCloseName, parseRosterPaste, pinFromLastName };
