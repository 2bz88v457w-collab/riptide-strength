import { useState } from "react";
import { C, EXERCISE_CATEGORIES, EXERCISE_BANK } from "../constants";
import { getMoveTypes } from "../helpers";
import { useIsNarrow } from "../hooks";
import { Btn } from "./common";

// ─── MOVE PICKER ──────────────────────────────────────────────────────────────
// Searchable, type-filterable list of every move in the library, alphabetical.
// multi: checkboxes + "Add N moves" footer via onAdd(names).
// single (multi=false): tapping a move calls onPick(name) immediately (used by Swap).
// Typing something not in the library offers an "add as custom move" row.
function MovePicker({ title, subtitle, multi, onAdd, onPick, onClose }) {
  const isNarrow = useIsNarrow();
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const q = search.trim().toLowerCase();
  const list = EXERCISE_BANK
    .filter((n) => (filter === "ALL" || getMoveTypes(n).includes(filter)) && (!q || n.toLowerCase().includes(q)))
    .sort((a, b) => a.localeCompare(b));
  const customName = q && !EXERCISE_BANK.some((n) => n.toLowerCase() === q) ? search.trim() : null;
  const pick = (name) => {
    if (!multi) { onPick(name); return; }
    setSelected((s) => s.includes(name) ? s.filter((x) => x !== name) : [...s, name]);
  };
  const chip = (key, label) => (
    <button key={key} onClick={() => setFilter(key)} style={{ border: `1px solid ${filter === key ? C.teal : C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: filter === key ? C.tealGlow : "transparent", color: filter === key ? C.teal : C.mutedUp, whiteSpace: "nowrap", textTransform: "capitalize" }}>{label}</button>
  );
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 300, display: "flex", alignItems: isNarrow ? "flex-end" : "center", justifyContent: "center", padding: isNarrow ? 0 : 20 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: isNarrow ? "18px 18px 0 0" : 16, width: "100%", maxWidth: 560, padding: isNarrow ? "14px 14px calc(14px + env(safe-area-inset-bottom))" : 22, display: "flex", flexDirection: "column", maxHeight: isNarrow ? "88vh" : "80vh", boxShadow: `0 0 60px ${C.tealGlow}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <h3 style={{ margin: 0, color: C.white, fontSize: 17, fontWeight: 800 }}>{title}</h3>
            {subtitle && <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 12 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {chip("ALL", "All")}
          {Object.keys(EXERCISE_CATEGORIES).map((t) => chip(t, t.toLowerCase()))}
        </div>
        <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search moves…" style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", width: "100%", marginBottom: 8 }} />
        <div style={{ overflowY: "auto", flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 6 }}>
          {list.map((n) => { const on = multi && selected.includes(n); return (
            <button key={n} onClick={() => pick(n)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: on ? C.tealGlow : "transparent", border: `1px solid ${on ? C.teal : "transparent"}`, borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontFamily: "inherit" }}>
              {multi && <div style={{ width: 15, height: 15, borderRadius: 4, border: `2px solid ${on ? C.teal : C.muted}`, background: on ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{on && <span style={{ color: C.bg, fontSize: 9, fontWeight: 900 }}>✓</span>}</div>}
              <span style={{ fontSize: 13, color: on ? C.teal : C.white, flex: 1, textAlign: "left", minWidth: 0 }}>{n}</span>
              <span style={{ fontSize: 10, color: C.muted, whiteSpace: "nowrap", flexShrink: 0 }}>{getMoveTypes(n).map((t) => t.toLowerCase()).join(" · ")}</span>
            </button>
          ); })}
          {customName && (
            <button onClick={() => { pick(customName); if (multi) setSearch(""); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "transparent", border: `1px dashed ${C.teal}66`, borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontFamily: "inherit", marginTop: 3 }}>
              <span style={{ fontSize: 13, color: C.teal, fontWeight: 700, textAlign: "left" }}>+ Add "{customName}" as custom move</span>
            </button>
          )}
          {list.length === 0 && !customName && <p style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "20px 0", margin: 0 }}>No moves match.</p>}
        </div>
        {multi && (
          <div style={{ paddingTop: 10 }}>
            {selected.length > 0 && <p style={{ margin: "0 0 8px", fontSize: 11, color: C.mutedUp, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Selected: {selected.join(" · ")}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
              <Btn onClick={() => onAdd(selected)} disabled={selected.length === 0} style={{ flex: 2 }}>Add {selected.length || ""} move{selected.length !== 1 ? "s" : ""}</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { MovePicker };
