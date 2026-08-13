import { useState } from "react";
import { C, blockColor } from "../constants";
import { fmtDate, getSupersetLabels, getLastSets, parseLoadNum, getProgressionFill, getBestLoad, parsePrescribedRpe } from "../helpers";
import { Btn } from "./common";

// ─── LOG MODAL ────────────────────────────────────────────────────────────────
function LogModal({ workout, athleteId, existingLog, allLogs, allWorkouts, progressions = [], onConsumeProgressions, onSave, onClose }) {
  // Coach bumps that fire in this session, frozen at open: { [exId]: { rule, base, target } }.
  // Only fresh logs get pre-filled — re-opening a saved log never re-fills or re-consumes.
  const [prefills] = useState(() => {
    if (existingLog) return {};
    const map = {};
    workout.blocks.forEach((b) => b.exercises.forEach((ex) => {
      if (ex.load?.trim().toUpperCase() === "BW") return;
      const fill = getProgressionFill(ex.name, athleteId, progressions, allLogs, allWorkouts, workout.id);
      if (fill) map[ex.id] = fill;
    }));
    return map;
  });
  const [sets, setSets] = useState(() => {
    const init = {};
    workout.blocks.forEach((b) => b.exercises.forEach((ex) => {
      const isBW = ex.load?.trim().toUpperCase() === "BW";
      // Pre-filled loads bypass updSet on purpose: the set stays not-done until the athlete confirms.
      // RPE prescriptions ("RPE 8") pre-fill their own box so the weight box stays free.
      const presRpe = parsePrescribedRpe(ex.load) || "";
      init[ex.id] = existingLog?.sets?.[ex.id] || Array.from({ length: parseInt(ex.sets) || 3 }, () => ({ reps: "", load: isBW ? "BW" : prefills[ex.id] ? String(prefills[ex.id].target) : "", rpe: presRpe, done: false }));
    }));
    return init;
  });
  const [note, setNote] = useState(existingLog?.note || "");
  const [blockNotes, setBlockNotes] = useState(() => { const init = {}; workout.blocks.forEach((b) => { init[b.id] = existingLog?.blockNotes?.[b.id] || ""; }); return init; });
  const [rpe, setRpe] = useState(existingLog?.rpe || "");
  const [saving, setSaving] = useState(false);
  const updSet = (exId, idx, k, v, isBW, prescribedReps) => setSets((s) => ({
    ...s,
    [exId]: s[exId].map((r, i) => {
      if (i !== idx) return r;
      const updated = { ...r, [k]: v };
      // Auto-mark complete: weighted exercises complete when a load is entered;
      // bodyweight exercises complete when reps are entered (load is pre-filled/locked).
      if (!isBW && k === "load") {
        updated.done = v.trim() !== "";
        // If they entered weight but never touched reps, fall back to the prescribed rep count
        if (v.trim() !== "" && !updated.reps.trim()) updated.reps = prescribedReps;
      }
      if (isBW && k === "reps") updated.done = v.trim() !== "";
      return updated;
    }),
  }));
  // Carry a finished weight entry forward to later sets that haven't been given their own weight yet.
  // Runs on blur (not on every keystroke) so it sees the fully-typed value instead of the first digit.
  const fillLoadForward = (exId, idx, v) => {
    if (!v.trim()) return;
    setSets((s) => ({
      ...s,
      [exId]: s[exId].map((r, i) => (i > idx && !r.load.trim()) ? { ...r, load: v } : r),
    }));
  };
  // Athletes can add or drop set rows while logging — an AMRAP block is logged
  // by adding a row per round completed, and a short session by dropping one.
  const addSet = (ex) => {
    const isBW = ex.load?.trim().toUpperCase() === "BW";
    const row = { reps: "", load: isBW ? "BW" : "", rpe: parsePrescribedRpe(ex.load) || "", done: false };
    setSets((s) => ({ ...s, [ex.id]: [...(s[ex.id] || []), row] }));
  };
  const removeSet = (ex) => setSets((s) => {
    const rows = s[ex.id] || [];
    if (rows.length <= 1) return s;
    const last = rows[rows.length - 1];
    const hasData = last.done || last.reps?.trim() || (last.load?.trim() && last.load.trim().toUpperCase() !== "BW");
    if (hasData && !window.confirm("Remove the last set? It has something logged in it.")) return s;
    return { ...s, [ex.id]: rows.slice(0, -1) };
  });
  const toggleDone = (exId, idx, prescribedReps) => {
    setSets((s) => { const current = s[exId][idx]; const nowDone = !current.done; const reps = current.reps || (nowDone ? prescribedReps : ""); return { ...s, [exId]: s[exId].map((r, i) => i === idx ? { ...r, done: nowDone, reps } : r) }; });
  };
  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave({ athleteId, workoutId: workout.id, date: workout.date, sets, note, blockNotes, rpe });
    // A bump is one-time: consume every rule that fired in this session, even if the athlete edited the value.
    if (ok !== false && onConsumeProgressions) {
      const ruleIds = [...new Set(Object.values(prefills).map((p) => p.rule.id))];
      if (ruleIds.length) await onConsumeProgressions(ruleIds);
    }
    setSaving(false);
  };
  const inpSm = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.white, padding: "4px 6px", fontSize: 13, textAlign: "center", fontFamily: "inherit", boxSizing: "border-box" };

  const renderExLog = (ex, isSupersetMember = false) => {
    const history = getLastSets(ex.name, athleteId, allLogs, allWorkouts, workout.id);
    const isBWEx = ex.load?.trim().toUpperCase() === "BW";
    const bestInfo = !isBWEx ? getBestLoad(ex.name, athleteId, allLogs, allWorkouts, workout.id) : null;
    // When the coach prescribed intensity as RPE, give it a dedicated box so the
    // athlete enters weight without typing over the prescription.
    const presRpe = parsePrescribedRpe(ex.load);
    return (
      <div key={ex.id} style={{ background: isSupersetMember ? "transparent" : C.surfaceUp, borderRadius: isSupersetMember ? 8 : 10, padding: "10px 12px", marginBottom: isSupersetMember ? 0 : 8, border: isSupersetMember ? `1px solid ${C.border}` : "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>{ex.name}</span><span style={{ color: C.muted, fontSize: 12 }}>{ex.sets}×{ex.reps}{ex.load ? ` @ ${ex.load}` : ""}</span></div>
        {(history || bestInfo) && <div style={{ display: "flex", gap: 6, marginBottom: 7, flexWrap: "wrap", alignItems: "center" }}>
          {history && <><span style={{ fontSize: 11, color: C.muted }}>Last ({fmtDate(history.date)}):</span>{history.sets.map((s, i) => <span key={i} style={{ fontSize: 11, color: C.mutedUp, background: C.bg, borderRadius: 4, padding: "1px 7px" }}>S{i + 1}: {s.reps || "—"} @ {s.load || "—"}{s.rpe ? <span style={{ color: C.gold }}> · RPE {s.rpe}</span> : null}</span>)}</>}
          {bestInfo && <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, background: `${C.gold}14`, border: `1px solid ${C.gold}33`, borderRadius: 4, padding: "1px 7px" }}>Best: {bestInfo.best}</span>}
          {prefills[ex.id] && <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, background: `${C.gold}14`, border: `1px solid ${C.gold}33`, borderRadius: 4, padding: "1px 7px" }}>⬆ Coach bump {prefills[ex.id].rule.pct > 0 ? "+" : ""}{prefills[ex.id].rule.pct}%: {prefills[ex.id].base} → {prefills[ex.id].target}</span>}
        </div>}
        {ex.note && <p style={{ margin: "0 0 8px", fontSize: 12, color: C.teal, fontStyle: "italic" }}>"{ex.note}"</p>}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {(sets[ex.id] || []).map((row, idx) => { const exIsBW = isBWEx; const loadNum = parseLoadNum(row.load); const isPR = !exIsBW && loadNum !== null && bestInfo && loadNum > bestInfo.best; return (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 4, background: row.done ? C.tealGlow : "rgba(255,255,255,.03)", border: `1px solid ${isPR ? C.gold : row.done ? C.teal : C.border}`, borderRadius: 7, padding: "4px 7px" }}>
              <span style={{ fontSize: 10, color: C.muted, width: 14 }}>S{idx + 1}</span>
              <input value={row.reps} inputMode="numeric" onChange={(e) => updSet(ex.id, idx, "reps", e.target.value, exIsBW)} placeholder={ex.reps} style={{ ...inpSm, width: 40 }} />
              <span style={{ color: C.muted, fontSize: 10 }}>@</span>
              <input value={row.load} inputMode={exIsBW ? "text" : "numeric"} disabled={exIsBW} onChange={(e) => updSet(ex.id, idx, "load", e.target.value, exIsBW, ex.reps)} onBlur={(e) => !exIsBW && fillLoadForward(ex.id, idx, e.target.value)} placeholder={exIsBW ? "BW" : presRpe ? "lbs" : (ex.load || "—")} style={{ ...inpSm, width: 50, opacity: exIsBW ? 0.6 : 1 }} />
              {presRpe && <>
                <span style={{ color: C.muted, fontSize: 9, fontWeight: 700, letterSpacing: ".03em" }}>RPE</span>
                <input value={row.rpe ?? ""} inputMode="decimal" onChange={(e) => updSet(ex.id, idx, "rpe", e.target.value, exIsBW)} placeholder={presRpe} title={`Coach prescribed RPE ${presRpe} — change it if the set felt different`} style={{ ...inpSm, width: 34, color: C.gold, fontWeight: 700 }} />
              </>}
              {isPR && <span title="New PR!" style={{ fontSize: 13 }}>🔥</span>}
              <button onClick={() => toggleDone(ex.id, idx, ex.reps)} style={{ background: "none", border: "none", cursor: "pointer", color: row.done ? C.teal : C.muted, fontSize: 17, padding: 0, lineHeight: 1 }}>{row.done ? "✓" : "○"}</button>
            </div>
          ); })}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={() => addSet(ex)} title="Add a set — use this to log extra rounds on an AMRAP" style={{ background: "none", border: `1px dashed ${C.border}`, borderRadius: 7, color: C.mutedUp, fontSize: 12, fontWeight: 700, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}>+ Set</button>
            {(sets[ex.id] || []).length > 1 && <button onClick={() => removeSet(ex)} title="Remove the last set" style={{ background: "none", border: "none", color: C.muted, fontSize: 15, padding: "0 4px", cursor: "pointer", fontFamily: "inherit", lineHeight: 1 }}>−</button>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", zIndex: 200, overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 640, padding: 26, boxShadow: `0 0 60px ${C.tealGlow}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div><h2 style={{ margin: 0, color: C.white, fontSize: 18, fontWeight: 800 }}>{workout.title}</h2><p style={{ margin: "3px 0 0", color: C.muted, fontSize: 12 }}>{fmtDate(workout.date)}</p></div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        {workout.blocks.map((block, bi) => {
          const labels = getSupersetLabels(block.exercises);
          const seen = new Set(); const rendered = [];
          block.exercises.forEach((ex) => {
            if (seen.has(ex.id)) return;
            if (ex.pairId) {
              const partner = block.exercises.find((e) => e.id !== ex.id && e.pairId === ex.pairId);
              if (partner) {
                seen.add(ex.id); seen.add(partner.id);
                rendered.push(
                  <div key={ex.pairId} style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}33`, borderRadius: 12, padding: 10, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><div style={{ width: 20, height: 20, borderRadius: 5, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 9, fontWeight: 900, color: C.bg }}>{labels[ex.id]?.[0]}</span></div><span style={{ fontSize: 11, fontWeight: 800, color: C.gold }}>SUPERSET</span></div>
                    {renderExLog(ex, true)}<div style={{ height: 6 }} />{renderExLog(partner, true)}
                  </div>
                );
                return;
              }
            }
            seen.add(ex.id);
            rendered.push(renderExLog(ex, false));
          });
          const blockComplete = block.exercises.length > 0 && block.exercises.every((ex) => {
            const exSets = sets[ex.id] || [];
            return exSets.length > 0 && exSets.every((s) => s.done);
          });
          return (
            <div key={block.id} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: blockColor(bi) }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: blockColor(bi), textTransform: "uppercase", letterSpacing: ".06em" }}>{block.name}</span>
                {blockComplete && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 800, color: C.teal, background: C.tealGlow, border: `1px solid ${C.teal}55`, borderRadius: 20, padding: "1px 8px" }}>✓ Complete</span>}
              </div>
              {block.note && <p style={{ margin: "0 0 10px", padding: "8px 11px", background: C.tealGlow, border: `1px solid ${C.teal}44`, borderRadius: 8, color: C.white, fontSize: 12.5, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>{block.note}</p>}
              {rendered}
              <textarea value={blockNotes[block.id] || ""} onChange={(e) => setBlockNotes((n) => ({ ...n, [block.id]: e.target.value }))} placeholder={block.note ? `Your answer / notes for ${block.name}…` : `Notes for ${block.name}…`} rows={2} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.mutedUp, padding: "7px 10px", fontSize: 12, width: "100%", boxSizing: "border-box", resize: "none", fontFamily: "inherit", marginTop: 8, fontStyle: "italic" }} />
            </div>
          );
        })}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 12, marginBottom: 18 }}>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>SESSION NOTES</label><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="How did it feel? Any PRs? Anything to flag?" rows={3} style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 13, width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} /></div>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>RPE 1–10</label><input value={rpe} onChange={(e) => setRpe(e.target.value)} type="number" min="1" max="10" placeholder="7" style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.gold, padding: "9px 8px", fontSize: 28, fontWeight: 800, width: "100%", boxSizing: "border-box", textAlign: "center", fontFamily: "inherit" }} /></div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save session"}</Btn></div>
      </div>
    </div>
  );
}

export { LogModal };
