import { useState } from "react";
import { C, ASSESSMENT_MOVEMENTS, ASSESSMENT_MAX, PERFORMANCE_TESTS } from "../constants";
import { computeMovementScore, uid, today } from "../helpers";
import { useIsNarrow } from "../hooks";
import { Btn } from "./common";

// ─── ASSESSMENT ENTRY MODAL ───────────────────────────────────────────────────
function AssessmentModal({ athletes, onSave, onClose }) {
  const isNarrow = useIsNarrow();
  const [athleteId, setAthleteId] = useState(athletes[0]?.id || "");
  const [date, setDate] = useState(today());
  const [movement, setMovement] = useState({});
  const [performance, setPerformance] = useState({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { total, pain, complete } = computeMovementScore(movement);
  const inp = { background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "8px 11px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", width: "100%" };
  const setCell = (k, v) => setMovement((m) => ({ ...m, [k]: v }));

  const ScoreButtons = ({ cellKey, options }) => (
    <div style={{ display: "flex", gap: 4 }}>
      {options.map((o) => { const on = movement[cellKey] === o; return (
        <button key={o} onClick={() => setCell(cellKey, on ? undefined : o)} style={{ width: 30, height: 28, borderRadius: 6, border: `1px solid ${on ? (o === 0 ? C.red : C.teal) : C.border}`, background: on ? (o === 0 ? `${C.red}22` : C.tealGlow) : "transparent", color: on ? (o === 0 ? C.red : C.teal) : C.mutedUp, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{o}</button>
      ); })}
    </div>
  );

  const handleSave = async () => {
    if (!athleteId) return;
    setSaving(true);
    await onSave({ id: uid(), athleteId, date, movement, performance, notes, createdAt: Date.now() });
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 100, overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 620, padding: isNarrow ? 16 : 26, boxShadow: `0 0 60px ${C.tealGlow}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0, color: C.white, fontSize: 19, fontWeight: 800 }}>Movement assessment</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 150px", gap: 12, marginBottom: 18 }}>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>ATHLETE</label>
            <select value={athleteId} onChange={(e) => setAthleteId(e.target.value)} style={inp}>{athletes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>DATE</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} /></div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>Movement screens</label>
          <span style={{ fontSize: 13, fontWeight: 800, color: pain ? C.red : complete ? C.teal : C.muted }}>{total}/{ASSESSMENT_MAX}{pain ? " · pain" : ""}{!complete ? " · incomplete" : ""}</span>
        </div>
        {ASSESSMENT_MOVEMENTS.map((m) => (
          <div key={m.key} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ color: C.white, fontWeight: 700, fontSize: 13 }}>{m.label}</span>
              {m.bilateral ? (
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}><span style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>L</span><ScoreButtons cellKey={m.key + "L"} options={m.options} /></div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}><span style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>R</span><ScoreButtons cellKey={m.key + "R"} options={m.options} /></div>
                </div>
              ) : <ScoreButtons cellKey={m.key} options={m.options} />}
            </div>
            <p style={{ margin: "5px 0 0", fontSize: 11, color: C.muted }}>{m.guide}</p>
          </div>
        ))}

        <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em", display: "block", margin: "16px 0 8px" }}>Performance tests</label>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {PERFORMANCE_TESTS.map((t) => (
            <div key={t.key} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ flex: 1, color: C.white, fontSize: 13 }}>{t.label}</span>
              <input value={performance[t.key] || ""} onChange={(e) => setPerformance((p) => ({ ...p, [t.key]: e.target.value }))} placeholder={t.unit} style={{ ...inp, width: 82, padding: "5px 8px", fontSize: 13, textAlign: "center" }} />
            </div>
          ))}
        </div>

        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes — what stood out, follow-ups…" rows={2} style={{ ...inp, resize: "vertical", marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving || !athleteId} style={{ flex: 1 }}>{saving ? "Saving…" : "Save assessment"}</Btn>
        </div>
      </div>
    </div>
  );
}

export { AssessmentModal };
