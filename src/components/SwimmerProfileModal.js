import { useState } from "react";
import { C, STROKES, DISTANCES } from "../constants";
import { Btn } from "./common";

// ─── SWIMMER PROFILE MODAL ────────────────────────────────────────────────────
function SwimmerProfileModal({ athlete, onSave, onClose }) {
  const [school, setSchool] = useState(athlete.school || "");
  const [grade, setGrade] = useState(athlete.grade || "");
  const [stroke, setStroke] = useState(athlete.stroke || "");
  const [distance, setDistance] = useState(athlete.distance || "");
  const [saving, setSaving] = useState(false);
  const GRADES = ["6th","7th","8th","9th","10th","11th","12th"];
  const inp = { background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", width: "100%" };
  const handleSave = async () => { setSaving(true); await onSave({ ...athlete, school, grade, stroke, distance }); setSaving(false); onClose(); };
  const chipRow = (label, options, value, setValue) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 8 }}>{label}</label>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {options.map((o) => <button key={o} onClick={() => setValue(value === o ? "" : o)} style={{ border: `1px solid ${value === o ? C.teal : C.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: value === o ? C.tealGlow : "transparent", color: value === o ? C.teal : C.mutedUp }}>{o}</button>)}
      </div>
    </div>
  );
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 380, padding: 26, boxShadow: `0 0 60px ${C.tealGlow}`, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: C.white, fontSize: 18, fontWeight: 800 }}>Your profile</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>SCHOOL</label>
          <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. Farmington High School" style={inp} />
        </div>
        {chipRow("GRADE", GRADES, grade, setGrade)}
        {chipRow("MAIN STROKE", STROKES, stroke, setStroke)}
        {chipRow("DISTANCE", DISTANCES, distance, setDistance)}
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving} style={{ flex: 1 }}>{saving ? "Saving…" : "Save profile"}</Btn>
        </div>
      </div>
    </div>
  );
}

export { SwimmerProfileModal };
