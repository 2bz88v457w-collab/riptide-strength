import { useState } from "react";
import { C, blockColor, REQUIRED_MOVE_TYPES, EXERCISE_BANK, STROKES, DISTANCES } from "../constants";
import { getMoveTypes, getWorkoutMoveTypes, uid, today, getSupersetLabels, initBlocks, emptyEx } from "../helpers";
import { useIsNarrow } from "../hooks";
import { generateWorkout } from "../ai";
import { ExRow } from "./ExRow";
import { MovePicker } from "./MovePicker";
import { PairPicker } from "./PairPicker";
import { Btn } from "./common";

// ─── WORKOUT BUILDER ──────────────────────────────────────────────────────────
function BuilderModal({ athletes, onSave, onClose, editWkt, defaultSeason }) {
  const isNarrow = useIsNarrow();
  const [title, setTitle] = useState(editWkt?.title || "");
  const [date, setDate] = useState(editWkt?.date || today());
  // Season is a display/filter label only — new workouts default to the most
  // recently used season so the coach only types it when a season turns over.
  const [season, setSeason] = useState(editWkt ? (editWkt.season || "") : (defaultSeason || ""));
  const [assignees, setAssignees] = useState(editWkt?.assignees || []);
  const [blocks, setBlocks] = useState(() => editWkt?.blocks ? JSON.parse(JSON.stringify(editWkt.blocks)) : initBlocks());
  const [focus, setFocus] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genErr, setGenErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [pairTarget, setPairTarget] = useState(null);
  const [swapTarget, setSwapTarget] = useState(null);
  const [pickerBlock, setPickerBlock] = useState(null); // block index the move picker adds to
  const [search, setSearch] = useState("");

  const updEx = (bi, ei, ex) => setBlocks((bs) => bs.map((b, i) => i === bi ? { ...b, exercises: b.exercises.map((e, j) => j === ei ? ex : e) } : b));
  const remEx = (bi, ei) => setBlocks((bs) => bs.map((b, i) => { if (i !== bi) return b; const removed = b.exercises[ei]; return { ...b, exercises: b.exercises.filter((_, j) => j !== ei).map((e) => e.pairId && e.pairId === removed?.pairId ? { ...e, pairId: null } : e) }; }));
  const addMoves = (bi, names) => setBlocks((bs) => bs.map((b, i) => i === bi ? { ...b, exercises: [...b.exercises, ...names.map((n) => ({ ...emptyEx(), name: n }))] } : b));
  const renameBlock = (bi, name) => setBlocks((bs) => bs.map((b, i) => i === bi ? { ...b, name } : b));
  // Coach instructions for the whole block (AMRAP, EMOM, tempo…), shown to
  // athletes while they log. Distinct from the notes athletes write back.
  const setBlockNote = (bi, note) => setBlocks((bs) => bs.map((b, i) => i === bi ? { ...b, note } : b));
  const addBlock = () => setBlocks((bs) => {
    // Name the new one "Block N" continuing from the highest existing number.
    const maxN = bs.reduce((m, b) => { const hit = /^Block (\d+)$/.exec(b.name?.trim() || ""); return hit ? Math.max(m, parseInt(hit[1])) : m; }, 0);
    return [...bs, { id: uid(), name: `Block ${maxN + 1}`, exercises: [] }];
  });
  // Move a block (with its exercises) up or down; dir is -1 or +1.
  const moveBlock = (bi, dir) => setBlocks((bs) => {
    const to = bi + dir;
    if (to < 0 || to >= bs.length) return bs;
    const next = [...bs];
    [next[bi], next[to]] = [next[to], next[bi]];
    return next;
  });
  const removeBlock = (bi) => setBlocks((bs) => {
    const b = bs[bi];
    if (b.exercises.length && !window.confirm(`Remove "${b.name || "this block"}" and its ${b.exercises.length} exercise${b.exercises.length !== 1 ? "s" : ""}?`)) return bs;
    return bs.filter((_, i) => i !== bi);
  });
  const handlePair = (bi, exId) => setPairTarget({ bi, exId });
  const handlePickPair = (partnerId) => {
    if (!pairTarget) return;
    const newPairId = uid();
    setBlocks((bs) => bs.map((b, i) => i !== pairTarget.bi ? b : { ...b, exercises: b.exercises.map((e) => e.id === pairTarget.exId || e.id === partnerId ? { ...e, pairId: newPairId } : e) }));
    setPairTarget(null);
  };
  const handleUnpair = (bi, exId) => setBlocks((bs) => bs.map((b, i) => { if (i !== bi) return b; const exItem = b.exercises.find((e) => e.id === exId); if (!exItem?.pairId) return b; return { ...b, exercises: b.exercises.map((e) => e.pairId === exItem.pairId ? { ...e, pairId: null } : e) }; }));
  const handleSwapConfirm = (newName) => {
    if (!swapTarget) return;
    const { bi, exId } = swapTarget;
    setBlocks((bs) => bs.map((b, i) => i !== bi ? b : { ...b, exercises: b.exercises.map((e) => e.id === exId ? { ...e, name: newName } : e) }));
    setSwapTarget(null);
  };
  const toggleAthlete = (id) => setAssignees((a) => a.includes(id) ? a.filter((x) => x !== id) : [...a, id]);
  const poolGroups = [...new Set(athletes.map((a) => a.event).filter(Boolean))];
  const champTags = ["Regional", "State"].filter((tag) => athletes.some((a) => a.champTag === tag));
  const selectGroup = (group) => { const ids = athletes.filter((a) => a.event === group).map((a) => a.id); const allOn = ids.every((id) => assignees.includes(id)); setAssignees((a) => allOn ? a.filter((x) => !ids.includes(x)) : [...new Set([...a, ...ids])]); };
  const selectTag = (tag) => { const ids = athletes.filter((a) => a.champTag === tag).map((a) => a.id); const allOn = ids.length > 0 && ids.every((id) => assignees.includes(id)); setAssignees((a) => allOn ? a.filter((x) => !ids.includes(x)) : [...new Set([...a, ...ids])]); };
  const selectByField = (field, value) => { const ids = athletes.filter((a) => a[field] === value).map((a) => a.id); const allOn = ids.length > 0 && ids.every((id) => assignees.includes(id)); setAssignees((a) => allOn ? a.filter((x) => !ids.includes(x)) : [...new Set([...a, ...ids])]); };
  // Stroke/distance quick-select groups — only ones at least one athlete has set.
  const specialtyGroups = [...STROKES.map((s) => ["stroke", s, "🏊"]), ...DISTANCES.map((d) => ["distance", d, "⏱"])].filter(([f, v]) => athletes.some((a) => a[f] === v));
  // Custom tags as one-tap assignment groups.
  const tagGroups = [...new Set(athletes.flatMap((a) => a.tags ?? []))].sort();
  const selectTagGroup = (t) => { const ids = athletes.filter((a) => (a.tags ?? []).includes(t)).map((a) => a.id); const allOn = ids.length > 0 && ids.every((id) => assignees.includes(id)); setAssignees((a) => allOn ? a.filter((x) => !ids.includes(x)) : [...new Set([...a, ...ids])]); };
  const handleGen = async () => {
    const target = athletes.find((a) => assignees.includes(a.id)) || athletes[0];
    if (!target) return;
    setGenerating(true); setGenErr("");
    try { const b = await generateWorkout(target, focus); setBlocks(b); if (!title) setTitle(`${focus || "Strength Power"} – ${target.event || "Group"}`); }
    catch { setGenErr("Generation failed — check API key in .env"); }
    setGenerating(false);
  };
  const handleSave = async () => {
    if (!title || assignees.length === 0) return;
    setSaving(true);
    await onSave({ id: editWkt?.id || uid(), title, date, season: season.trim(), assignees, blocks });
    setSaving(false);
  };
  const inp = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", width: "100%" };
  const filteredAthletes = athletes.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 100, overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 900, padding: isNarrow ? 16 : 28, boxShadow: `0 0 60px ${C.tealGlow}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ margin: 0, color: C.white, fontSize: 20, fontWeight: 800 }}>{editWkt ? "Edit workout" : "New workout"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 180px 160px", gap: 12, marginBottom: 18 }}>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>TITLE</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Strength Power – Week 5" style={inp} /></div>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>SEASON</label><input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="e.g. 2026 Long Course" style={inp} /></div>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>DATE</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} /></div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>Assign to</label>
            <span style={{ fontSize: 12, color: assignees.length > 0 ? C.teal : C.muted, fontWeight: 700 }}>{assignees.length} athlete{assignees.length !== 1 ? "s" : ""}</span>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ width: isNarrow ? "100%" : 160, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden", flexShrink: 0 }}>
              <div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Groups</div>
              <div style={{ padding: 6, display: isNarrow ? "grid" : "block", gridTemplateColumns: isNarrow ? "1fr 1fr" : undefined, gap: isNarrow ? 3 : undefined }}>
                {poolGroups.map((g) => { const gIds = athletes.filter((a) => a.event === g).map((a) => a.id); const allOn = gIds.length > 0 && gIds.every((id) => assignees.includes(id)); const someOn = gIds.some((id) => assignees.includes(id)); return (
                  <button key={g} onClick={() => selectGroup(g)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: allOn ? C.tealGlow : "transparent", border: `1px solid ${allOn || someOn ? C.teal : "transparent"}`, borderRadius: 7, padding: "6px 8px", cursor: "pointer", marginBottom: 3, fontFamily: "inherit" }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${allOn ? C.teal : someOn ? C.teal : C.muted}`, background: allOn ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{allOn && <span style={{ color: C.bg, fontSize: 9, fontWeight: 900 }}>✓</span>}{someOn && !allOn && <span style={{ color: C.teal, fontSize: 11, lineHeight: 1 }}>–</span>}</div>
                    <span style={{ fontSize: 12, color: allOn ? C.teal : C.white, flex: 1, textAlign: "left" }}>{g}</span>
                    <span style={{ fontSize: 10, color: C.muted }}>{gIds.length}</span>
                  </button>
                ); })}
                {poolGroups.length === 0 && <p style={{ color: C.muted, fontSize: 12, padding: "6px 4px", margin: 0 }}>No groups</p>}
                {champTags.length > 0 && <div style={{ height: 1, background: C.border, margin: "4px 0" }} />}
                {champTags.map((tag) => { const gIds = athletes.filter((a) => a.champTag === tag).map((a) => a.id); const allOn = gIds.length > 0 && gIds.every((id) => assignees.includes(id)); const someOn = gIds.some((id) => assignees.includes(id)); return (
                  <button key={tag} onClick={() => selectTag(tag)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: allOn ? `${C.gold}22` : "transparent", border: `1px solid ${allOn || someOn ? C.gold : "transparent"}`, borderRadius: 7, padding: "6px 8px", cursor: "pointer", marginBottom: 3, fontFamily: "inherit" }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${allOn ? C.gold : someOn ? C.gold : C.muted}`, background: allOn ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{allOn && <span style={{ color: C.bg, fontSize: 9, fontWeight: 900 }}>✓</span>}{someOn && !allOn && <span style={{ color: C.gold, fontSize: 11, lineHeight: 1 }}>–</span>}</div>
                    <span style={{ fontSize: 12, color: allOn ? C.gold : C.white, flex: 1, textAlign: "left" }}>🏆 {tag}</span>
                    <span style={{ fontSize: 10, color: C.muted }}>{gIds.length}</span>
                  </button>
                ); })}
                {specialtyGroups.length > 0 && <div style={{ height: 1, background: C.border, margin: "4px 0", gridColumn: "1/-1" }} />}
                {specialtyGroups.map(([field, val, icon]) => { const gIds = athletes.filter((a) => a[field] === val).map((a) => a.id); const allOn = gIds.length > 0 && gIds.every((id) => assignees.includes(id)); const someOn = gIds.some((id) => assignees.includes(id)); return (
                  <button key={field + val} onClick={() => selectByField(field, val)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: allOn ? C.tealGlow : "transparent", border: `1px solid ${allOn || someOn ? C.teal : "transparent"}`, borderRadius: 7, padding: "6px 8px", cursor: "pointer", marginBottom: 3, fontFamily: "inherit" }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${allOn || someOn ? C.teal : C.muted}`, background: allOn ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{allOn && <span style={{ color: C.bg, fontSize: 9, fontWeight: 900 }}>✓</span>}{someOn && !allOn && <span style={{ color: C.teal, fontSize: 11, lineHeight: 1 }}>–</span>}</div>
                    <span style={{ fontSize: 12, color: allOn ? C.teal : C.white, flex: 1, textAlign: "left" }}>{icon} {val}</span>
                    <span style={{ fontSize: 10, color: C.muted }}>{gIds.length}</span>
                  </button>
                ); })}
                {tagGroups.length > 0 && <div style={{ height: 1, background: C.border, margin: "4px 0", gridColumn: "1/-1" }} />}
                {tagGroups.map((t) => { const gIds = athletes.filter((a) => (a.tags ?? []).includes(t)).map((a) => a.id); const allOn = gIds.length > 0 && gIds.every((id) => assignees.includes(id)); const someOn = gIds.some((id) => assignees.includes(id)); return (
                  <button key={"tag-" + t} onClick={() => selectTagGroup(t)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: allOn ? C.tealGlow : "transparent", border: `1px solid ${allOn || someOn ? C.teal : "transparent"}`, borderRadius: 7, padding: "6px 8px", cursor: "pointer", marginBottom: 3, fontFamily: "inherit" }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${allOn || someOn ? C.teal : C.muted}`, background: allOn ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{allOn && <span style={{ color: C.bg, fontSize: 9, fontWeight: 900 }}>✓</span>}{someOn && !allOn && <span style={{ color: C.teal, fontSize: 11, lineHeight: 1 }}>–</span>}</div>
                    <span style={{ fontSize: 12, color: allOn ? C.teal : C.white, flex: 1, textAlign: "left" }}>🏷 {t}</span>
                    <span style={{ fontSize: 10, color: C.muted }}>{gIds.length}</span>
                  </button>
                ); })}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: isNarrow ? "100%" : 260, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ padding: "6px 10px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", whiteSpace: "nowrap" }}>Athletes</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 6, color: C.white, padding: "3px 8px", fontSize: 12, fontFamily: "inherit", flex: 1, minWidth: 0 }} />
              </div>
              <div style={{ overflowY: "auto", maxHeight: 200, padding: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                {filteredAthletes.map((a) => { const on = assignees.includes(a.id); return (
                  <button key={a.id} onClick={() => toggleAthlete(a.id)} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, background: on ? C.tealGlow : "transparent", border: `1px solid ${on ? C.teal : "transparent"}`, borderRadius: 7, padding: "5px 8px", cursor: "pointer", fontFamily: "inherit" }}>
                    <div style={{ width: 13, height: 13, borderRadius: 3, border: `2px solid ${on ? C.teal : C.muted}`, background: on ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{on && <span style={{ color: C.bg, fontSize: 8, fontWeight: 900 }}>✓</span>}</div>
                    <span style={{ fontSize: 12, color: on ? C.teal : C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                  </button>
                ); })}
              </div>
            </div>
          </div>
        </div>
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.teal, whiteSpace: "nowrap" }}>✦ AI Generate</span>
          <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. strength power — DB front squat + box jumps" style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 7, color: C.white, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", flex: 1, minWidth: 180 }} />
          <Btn onClick={handleGen} disabled={generating} small>{generating ? "Generating…" : "Generate"}</Btn>
          {genErr && <span style={{ color: C.red, fontSize: 12 }}>{genErr}</span>}
        </div>
        <datalist id="exbank">{EXERCISE_BANK.map((e) => <option key={e} value={e} label={getMoveTypes(e).join(" · ")} />)}</datalist>
        {(() => {
          const covered = getWorkoutMoveTypes(blocks);
          const count = REQUIRED_MOVE_TYPES.filter((t) => covered.has(t)).length;
          const complete = count === REQUIRED_MOVE_TYPES.length;
          return (
            <div style={{ background: C.bg, border: `1px solid ${complete ? C.teal : C.gold}44`, borderRadius: 10, padding: "8px 14px", marginBottom: 14, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: complete ? C.teal : C.gold, whiteSpace: "nowrap" }}>Move types {count}/{REQUIRED_MOVE_TYPES.length}</span>
              {REQUIRED_MOVE_TYPES.map((t) => { const on = covered.has(t); return (
                <span key={t} style={{ fontSize: 11, fontWeight: 700, textTransform: "capitalize", color: on ? C.teal : C.muted, background: on ? C.tealGlow : "transparent", border: `1px solid ${on ? C.teal : C.border}`, borderRadius: 20, padding: "2px 10px" }}>{on ? "✓ " : ""}{t.toLowerCase()}</span>
              ); })}
              {covered.has("FUNCTION") && <span style={{ fontSize: 11, fontWeight: 700, color: C.mutedUp, border: `1px solid ${C.border}`, borderRadius: 20, padding: "2px 10px" }}>✓ function</span>}
              {!complete && <span style={{ fontSize: 11, color: C.muted }}>aim for at least one squat, hinge, push, pull & brace move</span>}
            </div>
          );
        })()}
        {!isNarrow && <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 60px 46px 34px 1fr 70px 70px 24px", gap: 5, marginBottom: 6 }}>
          {["Exercise","Sets","Reps","Load","BW","Coaching cue","","",""].map((h, i) => <span key={i} style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</span>)}
        </div>}
        {blocks.map((block, bi) => {
          const labels = getSupersetLabels(block.exercises);
          const rendered = []; const seen = new Set();
          block.exercises.forEach((ex, ei) => {
            if (seen.has(ex.id)) return;
            if (ex.pairId) {
              const partner = block.exercises.find((e) => e.id !== ex.id && e.pairId === ex.pairId);
              if (partner) {
                const partnerEi = block.exercises.indexOf(partner);
                seen.add(ex.id); seen.add(partner.id);
                rendered.push(
                  <div key={ex.pairId} style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}33`, borderRadius: 10, padding: "10px 10px 6px", marginBottom: 8 }}>
                    <ExRow ex={ex} label={labels[ex.id]} blockExercises={block.exercises} onChange={(u) => updEx(bi, ei, u)} onRemove={() => remEx(bi, ei)} onPair={() => handlePair(bi, ex.id)} onUnpair={() => handleUnpair(bi, ex.id)} onSwap={() => setSwapTarget({ bi, exId: ex.id })} />
                    <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "2px 0 4px 10px" }}><div style={{ width: 1, height: 10, background: C.gold, opacity: .4 }} /><span style={{ fontSize: 10, color: C.gold, opacity: .6 }}>superset</span></div>
                    <ExRow ex={partner} label={labels[partner.id]} blockExercises={block.exercises} onChange={(u) => updEx(bi, partnerEi, u)} onRemove={() => remEx(bi, partnerEi)} onPair={() => handlePair(bi, partner.id)} onUnpair={() => handleUnpair(bi, partner.id)} onSwap={() => setSwapTarget({ bi, exId: partner.id })} />
                  </div>
                );
                return;
              }
            }
            seen.add(ex.id);
            rendered.push(<ExRow key={ex.id} ex={ex} label={null} blockExercises={block.exercises} onChange={(u) => updEx(bi, ei, u)} onRemove={() => remEx(bi, ei)} onPair={() => handlePair(bi, ex.id)} onUnpair={() => handleUnpair(bi, ex.id)} onSwap={() => setSwapTarget({ bi, exId: ex.id })} />);
          });
          return (
            <div key={block.id} style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 3, height: 16, borderRadius: 2, background: blockColor(bi), flexShrink: 0 }} />
                <input value={block.name} onChange={(e) => renameBlock(bi, e.target.value)} placeholder="Block name" title="Rename this block" style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, color: blockColor(bi), fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontFamily: "inherit", padding: "4px 8px", minWidth: 0, width: isNarrow ? "100%" : 240 }} />
                <button onClick={() => moveBlock(bi, -1)} disabled={bi === 0} title="Move block up" style={{ background: "none", border: "none", color: bi === 0 ? C.border : C.muted, fontSize: 12, cursor: bi === 0 ? "default" : "pointer", padding: "0 2px", lineHeight: 1, flexShrink: 0 }}>▲</button>
                <button onClick={() => moveBlock(bi, 1)} disabled={bi === blocks.length - 1} title="Move block down" style={{ background: "none", border: "none", color: bi === blocks.length - 1 ? C.border : C.muted, fontSize: 12, cursor: bi === blocks.length - 1 ? "default" : "pointer", padding: "0 2px", lineHeight: 1, flexShrink: 0 }}>▼</button>
                <button onClick={() => removeBlock(bi)} title="Remove block" style={{ background: "none", border: "none", color: C.muted, fontSize: 17, cursor: "pointer", padding: "0 4px", lineHeight: 1, flexShrink: 0 }}>×</button>
              </div>
              <textarea value={block.note || ""} onChange={(e) => setBlockNote(bi, e.target.value)} rows={2} placeholder="Optional instructions for this block — e.g. AMRAP in 10 min, log how many rounds you finished" style={{ background: C.bg, border: `1px solid ${block.note ? `${C.teal}55` : C.border}`, borderRadius: 8, color: C.white, padding: "7px 10px", fontSize: 12, width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", marginBottom: 8 }} />
              {rendered}
              <button onClick={() => setPickerBlock(bi)} style={{ background: "none", border: `1px dashed ${C.border}`, borderRadius: 7, color: C.muted, fontSize: 12, padding: "5px 14px", cursor: "pointer", marginTop: 4, fontFamily: "inherit" }}>+ Add exercise</button>
            </div>
          );
        })}
        <button onClick={addBlock} style={{ background: "none", border: `1px dashed ${C.borderBright}`, borderRadius: 9, color: C.teal, fontSize: 13, fontWeight: 700, padding: "9px 16px", cursor: "pointer", fontFamily: "inherit", width: "100%", marginBottom: 4 }}>+ Add block</button>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 18 }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={!title || assignees.length === 0 || saving}>{saving ? "Saving…" : `Save workout (${assignees.length} athlete${assignees.length !== 1 ? "s" : ""})`}</Btn>
        </div>
      </div>
      {pairTarget && <PairPicker exercise={blocks[pairTarget.bi].exercises.find((e) => e.id === pairTarget.exId)} blockExercises={blocks[pairTarget.bi].exercises} onPick={handlePickPair} onClose={() => setPairTarget(null)} />}
      {pickerBlock !== null && <MovePicker multi title="Add moves" subtitle={`Adding to ${blocks[pickerBlock].name}`} onAdd={(names) => { addMoves(pickerBlock, names); setPickerBlock(null); }} onClose={() => setPickerBlock(null)} />}
      {swapTarget && <MovePicker title="Swap exercise" subtitle={`Replacing: ${blocks[swapTarget.bi].exercises.find((e) => e.id === swapTarget.exId)?.name || "unnamed"}`} onPick={handleSwapConfirm} onClose={() => setSwapTarget(null)} />}
    </div>
  );
}

export { BuilderModal };
