import { C } from "../constants";
import { Btn } from "./common";

// ─── PAIR PICKER ──────────────────────────────────────────────────────────────
function PairPicker({ exercise, blockExercises, onPick, onClose }) {
  const candidates = blockExercises.filter((e) => e.id !== exercise.id && !e.pairId);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 14, width: "100%", maxWidth: 380, padding: 22 }}>
        <h3 style={{ margin: "0 0 6px", color: C.white, fontSize: 16 }}>Pair with…</h3>
        <p style={{ margin: "0 0 16px", color: C.muted, fontSize: 13 }}>"{exercise.name || "this exercise"}" will be paired as a superset</p>
        {candidates.map((e) => (
          <button key={e.id} onClick={() => onPick(e.id)} style={{ display: "block", width: "100%", background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 14px", marginBottom: 7, color: C.white, fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>{e.name || "(unnamed)"}</button>
        ))}
        <Btn variant="ghost" onClick={onClose} style={{ width: "100%", marginTop: 4 }}>Cancel</Btn>
      </div>
    </div>
  );
}

export { PairPicker };
