import { useState } from "react";
import { C, blockColor } from "../constants";
import { fmtDate, addDays, buildPlannedWorkouts, titleTemplateFrom } from "../helpers";
import { useIsNarrow } from "../hooks";
import { Btn } from "./common";

// Plan one weekday across several weeks. The movements come from a workout the
// coach already built; only sets/reps/load vary week to week. Generates ordinary
// independent workouts, so per-week tweaks afterwards are just normal edits.
function PlanWeeksModal({ source, athletes, onSaveWorkout, onClose }) {
  const isNarrow = useIsNarrow();
  const sourceWeekNo = parseInt((/week\s*(\d+)/i.exec(source.title || "") || [])[1]);
  const [weeks, setWeeks] = useState(4);
  const [startDate, setStartDate] = useState(addDays(source.date, 7));
  const [startWeekNumber, setStartWeekNumber] = useState(isNaN(sourceWeekNo) ? 1 : sourceWeekNo + 1);
  const [titleTemplate, setTitleTemplate] = useState(titleTemplateFrom(source.title));
  const [busy, setBusy] = useState(null);

  const rows = (source.blocks ?? []).flatMap((b, bi) => (b.exercises ?? []).map((ex) => ({ ex, block: b, bi })));
  // Every cell starts as a copy of the source prescription; the coach edits only
  // what actually changes week to week.
  const cellFrom = (ex) => ({ sets: ex.sets ?? "", reps: ex.reps ?? "", load: ex.load ?? "" });
  const [grid, setGrid] = useState(() =>
    Object.fromEntries(Array.from({ length: 8 }, (_, i) => [i, Object.fromEntries(rows.map((r) => [r.ex.id, cellFrom(r.ex)]))]))
  );
  const setCell = (wi, exId, field, value) =>
    setGrid((g) => ({ ...g, [wi]: { ...g[wi], [exId]: { ...g[wi][exId], [field]: value } } }));
  // Push one week's prescription rightwards — the usual "this holds for the rest
  // of the block" move.
  const copyAcross = (wi, exId) =>
    setGrid((g) => {
      const src = g[wi][exId];
      const next = { ...g };
      for (let i = wi + 1; i < weeks; i++) next[i] = { ...next[i], [exId]: { ...src } };
      return next;
    });

  const dates = Array.from({ length: weeks }, (_, i) => addDays(startDate, i * 7));
  const assigneeCount = (source.assignees ?? []).length;

  const handleCreate = async () => {
    const planned = buildPlannedWorkouts(source, { weeks, startDate, titleTemplate, startWeekNumber }, grid);
    for (let i = 0; i < planned.length; i++) {
      setBusy(`Creating ${i + 1} of ${planned.length}…`);
      const ok = await onSaveWorkout(planned[i]);
      if (ok === false) { setBusy(null); return; }   // error already surfaced
    }
    setBusy(null);
    onClose();
  };

  const inp = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", width: "100%" };
  const cellInp = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.white, padding: "4px 5px", fontSize: 12.5, textAlign: "center", fontFamily: "inherit", boxSizing: "border-box" };

  const cell = (wi, ex) => {
    const c = grid[wi]?.[ex.id] || cellFrom(ex);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <input value={c.sets} onChange={(e) => setCell(wi, ex.id, "sets", e.target.value)} inputMode="numeric" title="Sets" style={{ ...cellInp, width: 30 }} />
        <span style={{ color: C.muted, fontSize: 10 }}>×</span>
        <input value={c.reps} onChange={(e) => setCell(wi, ex.id, "reps", e.target.value)} title="Reps" style={{ ...cellInp, width: 36 }} />
        <span style={{ color: C.muted, fontSize: 10 }}>@</span>
        <input value={c.load} onChange={(e) => setCell(wi, ex.id, "load", e.target.value)} placeholder="—" title="Load or RPE" style={{ ...cellInp, width: 62 }} />
        {wi < weeks - 1 && (
          <button onClick={() => copyAcross(wi, ex.id)} title="Copy this to every later week" style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>→</button>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 120, overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 980, padding: isNarrow ? 16 : 26, boxShadow: `0 0 60px ${C.tealGlow}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <h2 style={{ margin: 0, color: C.white, fontSize: 19, fontWeight: 800 }}>Plan weeks</h2>
            <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 12.5 }}>Same movements as <strong style={{ color: C.mutedUp }}>{source.title}</strong>, repeated weekly. Change only the numbers that move.</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr 1fr" : "90px 150px 110px 1fr", gap: 10, margin: "16px 0 6px" }}>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>WEEKS</label>
            <select value={weeks} onChange={(e) => setWeeks(parseInt(e.target.value))} style={inp}>{[2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>FIRST DATE</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inp} /></div>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>WEEK NO.</label>
            <input value={startWeekNumber} onChange={(e) => setStartWeekNumber(parseInt(e.target.value) || 1)} inputMode="numeric" title="The number the first planned week is called" style={inp} /></div>
          <div style={{ gridColumn: isNarrow ? "1/-1" : "auto" }}><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>TITLE — {"{n}"} BECOMES THE WEEK NUMBER</label>
            <input value={titleTemplate} onChange={(e) => setTitleTemplate(e.target.value)} style={inp} /></div>
        </div>

        <p style={{ margin: "0 0 16px", fontSize: 12, color: C.mutedUp, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px" }}>
          Creates <strong style={{ color: C.teal }}>{weeks} workouts</strong> on {dates.map((d) => fmtDate(d)).join(" · ")} — each assigned to the same {assigneeCount} athlete{assigneeCount === 1 ? "" : "s"}{source.season ? `, season "${source.season}"` : ""}.
        </p>

        {rows.length === 0 && <p style={{ color: C.muted, textAlign: "center", padding: "28px 0" }}>This workout has no exercises to plan.</p>}

        {!isNarrow && rows.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: `minmax(150px, 1fr) repeat(${weeks}, auto)`, gap: "5px 12px", alignItems: "center", minWidth: "fit-content" }}>
              <span />
              {Array.from({ length: weeks }, (_, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: C.teal }}>Week {startWeekNumber + i}</p>
                  <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{fmtDate(dates[i])}</p>
                </div>
              ))}
              {rows.map(({ ex, block, bi }, ri) => (
                <Row key={ex.id} ex={ex} block={block} bi={bi} showBlock={ri === 0 || rows[ri - 1].block.id !== block.id} weeks={weeks} cell={cell} />
              ))}
            </div>
          </div>
        )}

        {isNarrow && rows.map(({ ex, block, bi }, ri) => (
          <div key={ex.id} style={{ marginBottom: 10 }}>
            {(ri === 0 || rows[ri - 1].block.id !== block.id) && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "10px 0 6px" }}>
                <div style={{ width: 3, height: 12, borderRadius: 2, background: blockColor(bi) }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: blockColor(bi), textTransform: "uppercase", letterSpacing: ".05em" }}>{block.name}</span>
              </div>
            )}
            <div style={{ background: C.surfaceUp, borderRadius: 10, padding: "9px 11px" }}>
              <p style={{ margin: "0 0 7px", fontSize: 13, fontWeight: 700, color: C.white }}>{ex.name || "(unnamed)"}</p>
              {Array.from({ length: weeks }, (_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: C.teal, fontWeight: 700, width: 52, flexShrink: 0 }}>Wk {startWeekNumber + i}</span>
                  {cell(i, ex)}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18, borderTop: `1px solid ${C.border}`, paddingTop: 16, alignItems: "center" }}>
          {busy && <span style={{ fontSize: 12, color: C.mutedUp }}>{busy}</span>}
          <Btn variant="ghost" onClick={onClose} disabled={!!busy}>Cancel</Btn>
          <Btn onClick={handleCreate} disabled={!!busy || rows.length === 0}>{busy ? "Working…" : `Create ${weeks} workouts`}</Btn>
        </div>
      </div>
    </div>
  );
}

// One exercise across all weeks, with its block heading when the block changes.
function Row({ ex, block, bi, showBlock, weeks, cell }) {
  return (
    <>
      {showBlock && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
            <div style={{ width: 3, height: 12, borderRadius: 2, background: blockColor(bi) }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: blockColor(bi), textTransform: "uppercase", letterSpacing: ".05em" }}>{block.name}</span>
          </div>
          {Array.from({ length: weeks }, (_, i) => <span key={"sp" + i} />)}
        </>
      )}
      <span style={{ fontSize: 13, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.name || "(unnamed)"}</span>
      {Array.from({ length: weeks }, (_, i) => <div key={i}>{cell(i, ex)}</div>)}
    </>
  );
}

export { PlanWeeksModal };
