import { useState } from "react";
import { C, TEST_METRICS } from "../constants";
import { uid, today } from "../helpers";
import { Btn } from "./common";

// ─── TEST SCORE MODAL ─────────────────────────────────────────────────────────
function TestScoreModal({ athletes, onSave, onClose }) {
  const [selectedId, setSelectedId] = useState(athletes[0]?.id || "");
  const [selectedName, setSelectedName] = useState(athletes[0]?.name || "");
  const [date, setDate] = useState(today());
  const [scores, setScores] = useState({ pushups: "", pullups: "", rdl: "" });
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const filtered = athletes.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
  const inp = { background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", width: "100%" };
  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    await onSave({ id: uid(), athleteId: selectedId, date, pushups: scores.pushups ? parseInt(scores.pushups) : null, pullups: scores.pullups ? parseInt(scores.pullups) : null, rdl: scores.rdl ? parseFloat(scores.rdl) : null, notes, createdAt: Date.now() });
    setScores({ pushups: "", pullups: "", rdl: "" }); setNotes(""); setSaving(false);
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 100, overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 520, padding: 28, boxShadow: `0 0 60px ${C.tealGlow}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ margin: 0, color: C.white, fontSize: 20, fontWeight: 800 }}>Enter test scores</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 12, marginBottom: 18 }}>
          <div style={{ position: "relative" }}>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>ATHLETE</label>
            <input value={search || selectedName} onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} placeholder="Search athlete…" style={inp} />
            {showDropdown && search && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, zIndex: 10, maxHeight: 180, overflowY: "auto", marginTop: 4 }}>
                {filtered.map((a) => <button key={a.id} onClick={() => { setSelectedId(a.id); setSelectedName(a.name); setSearch(""); setShowDropdown(false); }} style={{ display: "block", width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${C.border}`, color: C.white, padding: "8px 12px", textAlign: "left", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>{a.name} <span style={{ color: C.muted, fontSize: 11 }}>{a.event}</span></button>)}
              </div>
            )}
          </div>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>DATE</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
          {TEST_METRICS.map((m) => (
            <div key={m.key} style={{ background: C.bg, borderRadius: 12, padding: 14, border: `1px solid ${C.border}`, textAlign: "center" }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, color: m.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{m.label}</p>
              <input value={scores[m.key]} onChange={(e) => setScores((s) => ({ ...s, [m.key]: e.target.value }))} inputMode="numeric" placeholder="—" style={{ background: "transparent", border: "none", borderBottom: `2px solid ${m.color}`, color: C.white, fontSize: 28, fontWeight: 800, width: "100%", textAlign: "center", fontFamily: "inherit", outline: "none", padding: "4px 0" }} />
              <p style={{ margin: "6px 0 0", fontSize: 10, color: C.muted }}>{m.unit}</p>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 18 }}><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>NOTES (optional)</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any context — injury, conditions, etc." rows={2} style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 13, width: "100%", boxSizing: "border-box", resize: "none", fontFamily: "inherit" }} /></div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave} disabled={!selectedId || saving || (!scores.pushups && !scores.pullups && !scores.rdl)}>{saving ? "Saving…" : "Save scores"}</Btn></div>
      </div>
    </div>
  );
}

export { TestScoreModal };
