import { C } from "../constants";
import { useIsNarrow } from "../hooks";

// ─── EXERCISE ROW ─────────────────────────────────────────────────────────────
function ExRow({ ex, label, blockExercises, onChange, onRemove, onPair, onUnpair, onSwap }) {
  const isNarrow = useIsNarrow();
  const f = (k) => (e) => onChange({ ...ex, [k]: e.target.value });
  const inp = (w) => ({ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, color: C.white, padding: "6px 8px", fontSize: 13, width: w, fontFamily: "inherit", boxSizing: "border-box" });
  const isPaired = !!ex.pairId;
  const canPair = blockExercises.filter((e) => e.id !== ex.id && !e.pairId).length > 0;
  const isBW = ex.load?.trim().toUpperCase() === "BW";
  const toggleBW = () => onChange({ ...ex, load: isBW ? "" : "BW" });
  const nameInput = <input list="exbank" value={ex.name} onChange={f("name")} placeholder="Exercise" style={{ ...inp("100%"), minWidth: 0, flex: 1 }} />;
  const setsInput = <input value={ex.sets} onChange={f("sets")} placeholder="Sets" inputMode="numeric" style={inp(isNarrow ? 52 : "100%")} />;
  const repsInput = <input value={ex.reps} onChange={f("reps")} placeholder="Reps" style={inp(isNarrow ? 60 : "100%")} />;
  const loadInput = <input value={ex.load} onChange={f("load")} placeholder="Load" disabled={isBW} style={{ ...inp("100%"), opacity: isBW ? 0.5 : 1, ...(isNarrow ? { flex: 1, minWidth: 0 } : {}) }} />;
  const bwBtn = <button onClick={toggleBW} title="Bodyweight only" style={{ background: isBW ? C.teal : "none", border: `1px solid ${isBW ? C.teal : C.border}`, borderRadius: 6, color: isBW ? C.bg : C.mutedUp, fontSize: 10, fontWeight: 800, padding: isNarrow ? "7px 8px" : "6px 2px", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>BW</button>;
  const noteInput = <input value={ex.note} onChange={f("note")} placeholder="Coaching cue" style={{ ...inp("100%"), ...(isNarrow ? { flex: 1, minWidth: 0 } : {}) }} />;
  const swapBtn = <button onClick={onSwap} style={{ background: "none", border: `1px dashed ${C.border}`, borderRadius: 6, color: C.mutedUp, fontSize: 11, padding: "4px 6px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>⇄ Swap</button>;
  const pairBtn = isPaired ? <button onClick={onUnpair} style={{ background: "none", border: `1px solid ${C.gold}33`, borderRadius: 6, color: C.gold, fontSize: 11, padding: "4px 6px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>Unpair</button>
    : canPair ? <button onClick={onPair} style={{ background: "none", border: `1px dashed ${C.border}`, borderRadius: 6, color: C.muted, fontSize: 11, padding: "4px 6px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>+ Super</button>
    : <div />;
  const removeBtn = <button onClick={onRemove} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>;
  return (
    <div style={{ marginBottom: isNarrow ? 12 : 6 }}>
      {label && <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 4 }}><div style={{ width: 20, height: 20, borderRadius: 5, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 10, fontWeight: 900, color: C.bg }}>{label}</span></div><span style={{ fontSize: 10, color: C.gold, fontWeight: 700 }}>SUPERSET</span></div>}
      {isNarrow ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>{nameInput}{removeBtn}</div>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>{setsInput}{repsInput}{loadInput}{bwBtn}</div>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>{noteInput}{swapBtn}{pairBtn}</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 60px 46px 34px 1fr 70px 70px 24px", gap: 5, alignItems: "center" }}>
          {nameInput}{setsInput}{repsInput}{loadInput}{bwBtn}{noteInput}{swapBtn}{pairBtn}{removeBtn}
        </div>
      )}
    </div>
  );
}

export { ExRow };
