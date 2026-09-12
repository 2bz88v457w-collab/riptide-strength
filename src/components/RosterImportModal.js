import { useState } from "react";
import { C } from "../constants";
import { uid } from "../helpers";
import { DEFAULT_CHOICE, buildImportActions, classifyRosterImport, parseRosterPaste } from "../rosterImport";
import { useIsNarrow } from "../hooks";
import { Btn } from "./common";

const STATUS = {
  new:       { label: "New",               color: C.teal },
  move:      { label: "Group change",      color: C.gold },
  unarchive: { label: "Archived",          color: C.gold },
  close:     { label: "Close match",       color: C.red },
  unchanged: { label: "Already on roster", color: C.muted },
  duplicate: { label: "Repeated in paste", color: C.muted },
  error:     { label: "Can't read",        color: C.red },
};

// ─── ROSTER IMPORT ────────────────────────────────────────────────────────────
// Paste → preview (nothing saved) → apply → per-row results.
function RosterImportModal({ athletes, onImport, onClose }) {
  const narrow = useIsNarrow();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null);   // { rows, untouched }
  const [choices, setChoices] = useState({});
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);   // row index → { ok, error }

  const runPreview = () => {
    setPreview(classifyRosterImport(parseRosterPaste(text), athletes));
    setChoices({}); setResults(null);
  };
  const choiceFor = (r, i) => choices[i] ?? DEFAULT_CHOICE[r.status];
  const actions = preview ? buildImportActions(preview.rows, choices, uid) : [];

  const apply = async () => {
    setRunning(true);
    const out = await onImport(actions);
    const byRow = {};
    actions.forEach((a, k) => { byRow[a.row] = out[k]; });
    setResults(byRow);
    setRunning(false);
  };

  const counts = preview ? preview.rows.reduce((m, r) => ({ ...m, [r.status]: (m[r.status] || 0) + 1 }), {}) : {};
  const failed = results ? Object.values(results).filter((r) => !r.ok).length : 0;
  const succeeded = results ? Object.values(results).filter((r) => r.ok).length : 0;
  const inp = { background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontFamily: "inherit", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 100, overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))" }}>
      <div role="dialog" aria-label="Import roster" style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 760, padding: narrow ? 16 : 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ margin: 0, color: C.white, fontSize: 18, fontWeight: 800 }}>Import roster</h2>
          <button onClick={onClose} aria-label="Close import" style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>

        {!results && (<>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: C.mutedUp, lineHeight: 1.5 }}>
            Copy the <strong>Pool Group, First Name, Last Name</strong> columns from the season spreadsheet and paste them here. The header row is fine to include.
            PINs are the first four letters of the last name in capitals unless you add a fourth column.
          </p>
          <textarea value={text} onChange={(e) => { setText(e.target.value); setPreview(null); }} rows={narrow ? 6 : 8} placeholder={"7 Lane\tIvan\tKircher\n8 Lane\tPascal\tZeruhn"} aria-label="Roster rows" style={{ ...inp, width: "100%", padding: "10px 12px", fontSize: 13, fontFamily: "ui-monospace, Menlo, monospace", resize: "vertical" }} />
          <div style={{ display: "flex", gap: 10, margin: "10px 0 16px" }}>
            <Btn small onClick={runPreview} disabled={!text.trim()}>Check against roster</Btn>
            <span style={{ fontSize: 12, color: C.muted, alignSelf: "center" }}>Nothing is saved until you apply.</span>
          </div>
        </>)}

        {preview && (<>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {Object.entries(STATUS).filter(([k]) => counts[k]).map(([k, s]) => (
              <span key={k} style={{ fontSize: 12, fontWeight: 700, color: s.color, border: `1px solid ${s.color}55`, borderRadius: 20, padding: "3px 10px" }}>{counts[k]} {s.label.toLowerCase()}</span>
            ))}
          </div>

          {preview.rows.length === 0 && <p style={{ color: C.muted, fontSize: 13 }}>No rows found in the paste.</p>}

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {preview.rows.map((r, i) => {
              const s = STATUS[r.status];
              const res = results?.[i];
              return (
                <div key={i} data-testid={`import-row-${i}`} style={{ background: C.bg, border: `1px solid ${r.status === "close" ? `${C.red}66` : C.border}`, borderRadius: 10, padding: "9px 12px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.white }}>{r.name || r.raw}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>
                      {r.status === "error" && `Line ${r.line}: ${r.error}`}
                      {r.status === "new" && <>{r.group} · PIN <strong style={{ color: C.white, letterSpacing: ".08em" }}>{r.pin}</strong>{r.pinWarning && <span style={{ color: C.gold }}> · {r.pinWarning}</span>}</>}
                      {r.status === "move" && `${r.athlete.event || "no group"} → ${r.group}`}
                      {r.status === "unarchive" && `Returning swimmer${r.groupChange ? ` · ${r.athlete.event || "no group"} → ${r.group}` : ""} · keeps their PIN and history`}
                      {r.status === "unchanged" && r.group}
                      {r.status === "duplicate" && "Listed earlier in this paste"}
                      {r.status === "close" && <>Close to <strong style={{ color: C.white }}>{r.matches.map((m) => m.name + (m.archived ? " (archived)" : "")).join(", ")}</strong></>}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.color, whiteSpace: "nowrap" }}>{s.label}</span>
                  {!results && ["new", "move", "unarchive"].includes(r.status) && (
                    <label style={{ fontSize: 12, color: C.mutedUp, display: "flex", gap: 5, alignItems: "center", cursor: "pointer" }}>
                      <input type="checkbox" checked={choiceFor(r, i) !== "skip"} onChange={(e) => setChoices((c) => ({ ...c, [i]: e.target.checked ? DEFAULT_CHOICE[r.status] : "skip" }))} />
                      {r.status === "new" ? "Add" : r.status === "move" ? "Update group" : "Unarchive"}
                    </label>
                  )}
                  {!results && r.status === "close" && (
                    <select value={choiceFor(r, i)} onChange={(e) => setChoices((c) => ({ ...c, [i]: e.target.value }))} aria-label={`What to do with ${r.name}`} style={{ ...inp, padding: "5px 8px", fontSize: 12, flex: narrow ? "1 1 100%" : "0 1 260px" }}>
                      <option value="skip">Skip for now</option>
                      {r.matches.map((m) => <option key={m.id} value={`rename:${m.id}`}>Same swimmer — rename {m.name} to {r.name}</option>)}
                      <option value="add">Different swimmer — add as new</option>
                    </select>
                  )}
                  {res && <span style={{ fontSize: 12, fontWeight: 700, color: res.ok ? C.teal : C.red, flexBasis: res.ok ? "auto" : "100%" }}>{res.ok ? "✓ Done" : `✕ ${res.error}`}</span>}
                </div>
              );
            })}
          </div>

          {preview.untouched.length > 0 && !results && (
            <p style={{ margin: "0 0 14px", fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
              {preview.untouched.length} active swimmer{preview.untouched.length === 1 ? " isn't" : "s aren't"} in this list. Nothing happens to them — archive anyone who's left from their Edit screen.
            </p>
          )}

          {!results ? (
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
              <Btn onClick={apply} disabled={running || actions.length === 0} style={{ flex: 2 }}>
                {running ? "Applying…" : actions.length === 0 ? "Nothing to apply" : `Apply ${actions.length} change${actions.length === 1 ? "" : "s"}`}
              </Btn>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <p style={{ margin: 0, flex: 1, fontSize: 13, color: failed ? C.red : C.teal, fontWeight: 700 }}>
                {succeeded} applied{failed ? ` · ${failed} failed — fix those one at a time from the roster` : ""}
              </p>
              <Btn onClick={onClose}>Done</Btn>
            </div>
          )}
        </>)}
      </div>
    </div>
  );
}

export { RosterImportModal };
