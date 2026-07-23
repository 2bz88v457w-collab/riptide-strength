import { useState } from "react";
import { C, STROKES, DISTANCES } from "../constants";
import { Btn } from "./common";

// ─── EDIT ATHLETE MODAL ───────────────────────────────────────────────────────
function EditAthleteModal({ athlete, allTags = [], onSave, onArchive, onDelete, onUnarchive, onClose }) {
  const [eName, setEName] = useState(athlete.name);
  const [eEvent, setEEvent] = useState(athlete.event || "");
  const [ePin, setEPin] = useState(""); // blank = keep current PIN (PINs are auth passwords now)
  const [eTag, setETag] = useState(athlete.champTag || "");
  const [eSchool, setESchool] = useState(athlete.school || "");
  const [eGrade, setEGrade] = useState(athlete.grade || "");
  const [eStroke, setEStroke] = useState(athlete.stroke || "");
  const [eDistance, setEDistance] = useState(athlete.distance || "");
  const [eTags, setETags] = useState(athlete.tags || []);
  const [tagInput, setTagInput] = useState("");
  const addTag = () => {
    const t = tagInput.trim();
    if (!t || eTags.some((x) => x.toLowerCase() === t.toLowerCase())) { setTagInput(""); return; }
    setETags([...eTags, t]);
    setTagInput("");
  };
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const isArchived = !!athlete.archived;
  const GRADES = ["6th","7th","8th","9th","10th","11th","12th"];
  const handleSave = async () => { if (!eName) return; setSaving(true); await onSave({ ...athlete, name: eName, event: eEvent, pin: ePin.trim() || null, champTag: eTag, school: eSchool, grade: eGrade, stroke: eStroke, distance: eDistance, tags: eTags }); setSaving(false); };
  const inp = { background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", width: "100%" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 440, padding: 26, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: C.white, fontSize: 18, fontWeight: 800 }}>Edit athlete</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={{ gridColumn: "1/-1" }}><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>FULL NAME</label><input value={eName} onChange={(e) => setEName(e.target.value)} style={inp} /></div>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>POOL GROUP</label><input value={eEvent} onChange={(e) => setEEvent(e.target.value)} style={inp} /></div>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>NEW PIN</label><input value={ePin} onChange={(e) => setEPin(e.target.value)} placeholder="Blank = unchanged" style={inp} /></div>
          <div style={{ gridColumn: "1/-1" }}><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>SCHOOL</label><input value={eSchool} onChange={(e) => setESchool(e.target.value)} placeholder="e.g. Farmington High School" style={inp} /></div>
        </div>
        {[["GRADE", GRADES, eGrade, setEGrade], ["MAIN STROKE", STROKES, eStroke, setEStroke], ["DISTANCE", DISTANCES, eDistance, setEDistance]].map(([label, options, value, setValue]) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 8 }}>{label}</label>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {options.map((g) => <button key={g} onClick={() => setValue(value === g ? "" : g)} style={{ border: `1px solid ${value === g ? C.teal : C.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: value === g ? C.tealGlow : "transparent", color: value === g ? C.teal : C.mutedUp }}>{g}</button>)}
            </div>
          </div>
        ))}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 8 }}>TAGS</label>
          {eTags.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
              {eTags.map((t) => (
                <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: C.teal, background: C.tealGlow, border: `1px solid ${C.border}`, borderRadius: 14, padding: "3px 6px 3px 10px" }}>
                  🏷 {t}
                  <button onClick={() => setETags(eTags.filter((x) => x !== t))} aria-label={`Remove ${t}`} style={{ background: "none", border: "none", color: C.teal, fontSize: 14, cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
                </span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 6 }}>
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag()} list="tagbank-edit" placeholder="e.g. aug-clinic" style={{ ...inp, flex: 1 }} />
            <datalist id="tagbank-edit">{allTags.filter((t) => !eTags.includes(t)).map((t) => <option key={t} value={t} />)}</datalist>
            <Btn variant="ghost" small onClick={addTag} disabled={!tagInput.trim()}>+ Add</Btn>
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>CHAMPIONSHIP TAG</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[["", "None"], ["Regional", "Regional"], ["State", "State"]].map(([val, label]) => (
              <button key={val} onClick={() => setETag(val)} style={{ flex: 1, border: `1px solid ${eTag === val ? C.teal : C.border}`, borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: eTag === val ? C.tealGlow : "transparent", color: eTag === val ? C.teal : C.mutedUp }}>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!isArchived ? (
            !confirming
              ? <button onClick={() => setConfirming(true)} style={{ background: "none", border: `1px solid rgba(255,183,0,0.3)`, borderRadius: 10, color: C.gold, fontSize: 12, fontWeight: 700, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>Archive</button>
              : <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={onArchive} style={{ background: C.gold, border: "none", borderRadius: 10, color: C.bg, fontSize: 12, fontWeight: 700, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>Confirm archive</button>
                  <button onClick={() => setConfirming(false)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted, fontSize: 12, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                </div>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={onUnarchive} style={{ background: "none", border: `1px solid ${C.teal}`, borderRadius: 10, color: C.teal, fontSize: 12, fontWeight: 700, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>Unarchive</button>
              {!confirming
                ? <button onClick={() => setConfirming(true)} style={{ background: "none", border: `1px solid rgba(255,77,77,0.3)`, borderRadius: 10, color: C.red, fontSize: 12, fontWeight: 700, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>Delete permanently</button>
                : <button onClick={onDelete} style={{ background: C.red, border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 700, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>Confirm delete</button>}
            </div>
          )}
          <div style={{ flex: 1 }} />
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={!eName || saving}>{saving ? "Saving…" : "Save"}</Btn>
        </div>
      </div>
    </div>
  );
}

export { EditAthleteModal };
