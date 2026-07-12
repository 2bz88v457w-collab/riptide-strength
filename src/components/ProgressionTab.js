import { useState } from "react";
import { C, EXERCISE_BANK, STROKES, DISTANCES } from "../constants";
import { getMoveTypes, uid, getLastSets, parseLoadNum, roundLoad } from "../helpers";
import { useIsNarrow } from "../hooks";
import { Avatar, Btn } from "./common";

// ─── PROGRESSION (BUMPS) TAB ──────────────────────────────────────────────────
function ProgressionTab({ athletes, progressions, logs, workouts, onSave, onDelete }) {
  const isNarrow = useIsNarrow();
  const [movement, setMovement] = useState("");
  const [pct, setPct] = useState("5");
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const poolGroups = [...new Set(athletes.map((a) => a.event).filter(Boolean))];
  const champTags = ["Regional", "State"].filter((tag) => athletes.some((a) => a.champTag === tag));
  const toggleAthlete = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const selectGroup = (group) => { const ids = athletes.filter((a) => a.event === group).map((a) => a.id); const allOn = ids.every((id) => selected.includes(id)); setSelected((s) => allOn ? s.filter((x) => !ids.includes(x)) : [...new Set([...s, ...ids])]); };
  const selectTag = (tag) => { const ids = athletes.filter((a) => a.champTag === tag).map((a) => a.id); const allOn = ids.length > 0 && ids.every((id) => selected.includes(id)); setSelected((s) => allOn ? s.filter((x) => !ids.includes(x)) : [...new Set([...s, ...ids])]); };
  const selectByField = (field, value) => { const ids = athletes.filter((a) => a[field] === value).map((a) => a.id); const allOn = ids.length > 0 && ids.every((id) => selected.includes(id)); setSelected((s) => allOn ? s.filter((x) => !ids.includes(x)) : [...new Set([...s, ...ids])]); };
  const specialtyGroups = [...STROKES.map((s) => ["stroke", s, "🏊"]), ...DISTANCES.map((d) => ["distance", d, "⏱"])].filter(([f, v]) => athletes.some((a) => a[f] === v));
  const filteredAthletes = athletes.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
  const pctNum = parseFloat(pct);
  const canCreate = movement.trim() && !isNaN(pctNum) && pctNum !== 0 && selected.length > 0;
  const inp = { background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", width: "100%" };

  // Base → target preview for one athlete, same math as getProgressionFill but without a rule yet.
  const previewFor = (athleteId, exName, p) => {
    const hist = getLastSets(exName, athleteId, logs, workouts, null);
    const nums = (hist?.sets || []).map((s) => parseLoadNum(s.load)).filter((n) => n !== null && n > 0);
    if (!nums.length) return null;
    const base = Math.max(...nums);
    return { base, target: roundLoad(base * (1 + p / 100)) };
  };

  const handleCreate = async () => {
    if (!canCreate || saving) return;
    setSaving(true);
    await onSave(selected.map((athleteId) => ({ id: uid(), athleteId, exerciseName: movement.trim(), pct: pctNum, createdAt: Date.now() })));
    setMovement(""); setPct("5"); setSelected([]); setSearch("");
    setSaving(false);
  };

  const pending = [...progressions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.white }}>Weight bumps</h1>
        <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>Pre-fill an athlete's next session of a movement with their last weight bumped by a percentage. One-time: the bump clears once they log it.</p>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 24 }}>
        <datalist id="exbank-prog">{EXERCISE_BANK.map((e) => <option key={e} value={e} label={getMoveTypes(e).join(" · ")} />)}</datalist>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 12, marginBottom: 14 }}>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>MOVEMENT</label><input value={movement} onChange={(e) => setMovement(e.target.value)} list="exbank-prog" placeholder="e.g. Back Squat" style={inp} /></div>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>INCREASE %</label>
            <div style={{ position: "relative" }}>
              <input value={pct} onChange={(e) => setPct(e.target.value)} inputMode="numeric" placeholder="5" style={{ ...inp, paddingRight: 26 }} />
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }}>%</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>Apply to</label>
          <span style={{ fontSize: 12, color: selected.length > 0 ? C.teal : C.muted, fontWeight: 700 }}>{selected.length} athlete{selected.length !== 1 ? "s" : ""}</span>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ width: isNarrow ? "100%" : 160, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden", flexShrink: 0 }}>
            <div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Groups</div>
            <div style={{ padding: 6, display: isNarrow ? "grid" : "block", gridTemplateColumns: isNarrow ? "1fr 1fr" : undefined, gap: isNarrow ? 3 : undefined }}>
              {poolGroups.map((g) => { const gIds = athletes.filter((a) => a.event === g).map((a) => a.id); const allOn = gIds.length > 0 && gIds.every((id) => selected.includes(id)); const someOn = gIds.some((id) => selected.includes(id)); return (
                <button key={g} onClick={() => selectGroup(g)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: allOn ? C.tealGlow : "transparent", border: `1px solid ${allOn || someOn ? C.teal : "transparent"}`, borderRadius: 7, padding: "6px 8px", cursor: "pointer", marginBottom: 3, fontFamily: "inherit" }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${allOn ? C.teal : someOn ? C.teal : C.muted}`, background: allOn ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{allOn && <span style={{ color: C.bg, fontSize: 9, fontWeight: 900 }}>✓</span>}{someOn && !allOn && <span style={{ color: C.teal, fontSize: 11, lineHeight: 1 }}>–</span>}</div>
                  <span style={{ fontSize: 12, color: allOn ? C.teal : C.white, flex: 1, textAlign: "left" }}>{g}</span>
                  <span style={{ fontSize: 10, color: C.muted }}>{gIds.length}</span>
                </button>
              ); })}
              {poolGroups.length === 0 && <p style={{ color: C.muted, fontSize: 12, padding: "6px 4px", margin: 0 }}>No groups</p>}
              {champTags.length > 0 && <div style={{ height: 1, background: C.border, margin: "4px 0" }} />}
              {champTags.map((tag) => { const gIds = athletes.filter((a) => a.champTag === tag).map((a) => a.id); const allOn = gIds.length > 0 && gIds.every((id) => selected.includes(id)); const someOn = gIds.some((id) => selected.includes(id)); return (
                <button key={tag} onClick={() => selectTag(tag)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: allOn ? `${C.gold}22` : "transparent", border: `1px solid ${allOn || someOn ? C.gold : "transparent"}`, borderRadius: 7, padding: "6px 8px", cursor: "pointer", marginBottom: 3, fontFamily: "inherit" }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${allOn ? C.gold : someOn ? C.gold : C.muted}`, background: allOn ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{allOn && <span style={{ color: C.bg, fontSize: 9, fontWeight: 900 }}>✓</span>}{someOn && !allOn && <span style={{ color: C.gold, fontSize: 11, lineHeight: 1 }}>–</span>}</div>
                  <span style={{ fontSize: 12, color: allOn ? C.gold : C.white, flex: 1, textAlign: "left" }}>🏆 {tag}</span>
                  <span style={{ fontSize: 10, color: C.muted }}>{gIds.length}</span>
                </button>
              ); })}
              {specialtyGroups.length > 0 && <div style={{ height: 1, background: C.border, margin: "4px 0", gridColumn: "1/-1" }} />}
              {specialtyGroups.map(([field, val, icon]) => { const gIds = athletes.filter((a) => a[field] === val).map((a) => a.id); const allOn = gIds.length > 0 && gIds.every((id) => selected.includes(id)); const someOn = gIds.some((id) => selected.includes(id)); return (
                <button key={field + val} onClick={() => selectByField(field, val)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: allOn ? C.tealGlow : "transparent", border: `1px solid ${allOn || someOn ? C.teal : "transparent"}`, borderRadius: 7, padding: "6px 8px", cursor: "pointer", marginBottom: 3, fontFamily: "inherit" }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${allOn || someOn ? C.teal : C.muted}`, background: allOn ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{allOn && <span style={{ color: C.bg, fontSize: 9, fontWeight: 900 }}>✓</span>}{someOn && !allOn && <span style={{ color: C.teal, fontSize: 11, lineHeight: 1 }}>–</span>}</div>
                  <span style={{ fontSize: 12, color: allOn ? C.teal : C.white, flex: 1, textAlign: "left" }}>{icon} {val}</span>
                  <span style={{ fontSize: 10, color: C.muted }}>{gIds.length}</span>
                </button>
              ); })}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: isNarrow ? "100%" : 260, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "6px 10px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", whiteSpace: "nowrap" }}>Athletes</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 6, color: C.white, padding: "3px 8px", fontSize: 12, fontFamily: "inherit", flex: 1 }} />
            </div>
            <div style={{ overflowY: "auto", maxHeight: 200, padding: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
              {filteredAthletes.map((a) => { const on = selected.includes(a.id); return (
                <button key={a.id} onClick={() => toggleAthlete(a.id)} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, background: on ? C.tealGlow : "transparent", border: `1px solid ${on ? C.teal : "transparent"}`, borderRadius: 7, padding: "5px 8px", cursor: "pointer", fontFamily: "inherit" }}>
                  <div style={{ width: 13, height: 13, borderRadius: 3, border: `2px solid ${on ? C.teal : C.muted}`, background: on ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{on && <span style={{ color: C.bg, fontSize: 8, fontWeight: 900 }}>✓</span>}</div>
                  <span style={{ fontSize: 12, color: on ? C.teal : C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                </button>
              ); })}
            </div>
          </div>
        </div>
        {movement.trim() && !isNaN(pctNum) && selected.length > 0 && (
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Preview</p>
            {selected.map((id) => {
              const a = athletes.find((x) => x.id === id);
              if (!a) return null;
              const pv = previewFor(id, movement, pctNum);
              return (
                <p key={id} style={{ margin: "3px 0", fontSize: 13, color: pv ? C.white : C.muted }}>
                  {a.name}: {pv ? <span style={{ fontWeight: 700 }}>{pv.base} → <span style={{ color: C.teal }}>{pv.target}</span></span> : <span style={{ fontStyle: "italic" }}>no logged weight yet — bump applies once they log this movement with a weight</span>}
                </p>
              );
            })}
          </div>
        )}
        <Btn onClick={handleCreate} disabled={!canCreate || saving}>{saving ? "Creating…" : `Create bump${selected.length > 1 ? "s" : ""}`}</Btn>
      </div>

      <h3 style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", letterSpacing: ".06em", textTransform: "uppercase" }}>Pending bumps</h3>
      {pending.length === 0 && <div style={{ textAlign: "center", padding: "36px 0", color: C.muted }}><p style={{ fontSize: 32, margin: "0 0 8px" }}>⬆</p><p style={{ margin: 0 }}>No pending bumps — create the first one above.</p></div>}
      {pending.map((rule) => {
        const a = athletes.find((x) => x.id === rule.athleteId);
        const pv = a ? previewFor(rule.athleteId, rule.exerciseName, rule.pct) : null;
        return (
          <div key={rule.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={a?.name || "?"} size={38} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, color: C.white, fontSize: 14 }}>{a?.name || "Archived athlete"} <span style={{ color: C.muted, fontWeight: 400 }}>·</span> {rule.exerciseName}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>{pv ? <>{pv.base} → <span style={{ color: C.teal, fontWeight: 700 }}>{pv.target}</span></> : "awaiting first logged weight"}</p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, background: `${C.gold}14`, border: `1px solid ${C.gold}33`, borderRadius: 20, padding: "3px 10px" }}>{rule.pct > 0 ? "+" : ""}{rule.pct}%</span>
            <button onClick={() => onDelete(rule.id)} title="Remove bump" style={{ background: "none", border: "none", color: C.red, fontSize: 20, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>×</button>
          </div>
        );
      })}
    </div>
  );
}

export { ProgressionTab };
