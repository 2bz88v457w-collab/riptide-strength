import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://juwxlrbkpeluojtqcplt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_EuD_58IxNEJbIsYq7FilKg_4CVVpNnZ";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: "#060D14", surface: "#0D1B2A", surfaceUp: "#132338",
  border: "rgba(0,210,180,0.12)", borderBright: "rgba(0,210,180,0.35)",
  teal: "#00D4B8", tealGlow: "rgba(0,212,184,0.15)",
  gold: "#FFB700", red: "#FF4D4D",
  white: "#EEF4F8", muted: "#5A7A96", mutedUp: "#7A9AB6",
};

const BLOCK_COLORS = [C.teal, C.gold, "#A78BFA", C.red, C.mutedUp];
const BLOCKS = ["Warm-up", "Block 1", "Block 2", "Block 3", "Cool Down"];
const EXERCISE_BANK = [
  "Single Arm KB Front Squat",	"TRX Rows",	"Dual KB Front Squat",	"Dead Bug (Banded)",	"KB Clean",	"Box Jump",	"Single-Leg RDL",	"Step-up",
"Seated Shoulder Press",	"Banded Chest Press OH Extension",	"Squat Jump",	"Slam Ball",	"DB Thrusters",	"Romanian Deadlift",	"Trap Bar Deadlift",	"Face Pull",
"Pull Ups",	"Farmer Carry",	"Alt V Ups",	"TRX Plank Pike",	"TRX Row",	"Back Squat",	"Seated Row",	"Half-Kneeling Press",
"Hollow Hold",	"DB Box Step Up",	"Power Push Ups",	"Lunge",	"Bulgarian Split Squat",	"Lat Pulldown",	"Overhead Press",	"Copenhagen Plank",
"Seated Rows",	"Floor Chest Press",	"TRX Chest Press",	"Sled Push",	"Goblet Squat",	"DB Bench Press",	"Bird Dog",	"Hollow Body Hold",
"Single Leg Layouts",	"Reverse Fly",	"Copenhagen Plank (Variation)",	"Bicycles",	"DB Front Squat",	"Dead Bug",	"Banded Hip Extension",	"Med Ball Rotational Throw",
"Lat Pull Down",	"TRX YTWs",	"Box Jumps",	"Renegade Row",	"Pull-up / Band-Assisted",	"Nordic Curl",	"Med Ball Slam",	"Battle Rope Wave",
"Push ups",	"Banded Hamstring Curls",	"PVC OH Squat",	"Start Slam Ball Throw",	"Push-up Variation",	"Broad Jump",	"Suitcase Carry",	"Arnold Press",
"RDL",	"DB Snatch",	"Centipede",	"Toes to Bar",	"Pallof Press",	"Farmers Carry",	"Cable Pull-Through",
"Glute Bridge OH Extension",	"Quadruped Med Ball Twist",	"KB Swing",	"Half Kneeling Slam Ball Throw",	"Glute Bridge",	"Landmine Press",	"Hip Hinge"
];

const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });

// ─── SUPERSET HELPERS ─────────────────────────────────────────────────────────
// A superset pair is stored as { id, pairId } on each exercise.
// Two exercises with the same pairId are a superset.
// Label: find all pairs in block, assign A/B/C... — each pair is e.g. "A1"/"A2"
function getSupersetLabels(exercises) {
  const labels = {};
  const pairsSeen = {};
  let letterIdx = 0;
  exercises.forEach((ex) => {
    if (!ex.pairId) return;
    if (pairsSeen[ex.pairId] === undefined) {
      pairsSeen[ex.pairId] = String.fromCharCode(65 + letterIdx++);
    }
    const letter = pairsSeen[ex.pairId];
    const count = Object.values(labels).filter((l) => l && l[0] === letter).length + 1;
    labels[ex.id] = `${letter}${count}`;
  });
  return labels;
}

function initBlocks() {
  return BLOCKS.map((name) => ({ id: uid(), name, exercises: [] }));
}
function emptyEx() {
  return { id: uid(), name: "", sets: "3", reps: "8", load: "", note: "", pairId: null };
}

// ─── AI GENERATE ──────────────────────────────────────────────────────────────
async function generateWorkout(athlete, focus) {
  const prompt = `You are an expert strength coach for competitive swimmers.
Create a swim-specific strength workout for ${athlete.name}, age ${athlete.age}, group: ${athlete.event || "competitive swimmer"}.
Focus: ${focus || "general athletic development and injury prevention"}.
Return ONLY valid JSON with this exact structure — include superset pairs where appropriate by giving paired exercises the same pairId string:
{"blocks":[
  {"name":"Warm-up","exercises":[{"name":"string","sets":"2","reps":"10","load":"bodyweight","note":"cue","pairId":null}]},
  {"name":"Block 1","exercises":[{"name":"DB Front Squat","sets":"3","reps":"6","load":"moderate","note":"brace core","pairId":"p1"},{"name":"Box Jump","sets":"3","reps":"5","load":"bodyweight","note":"max height","pairId":"p1"}]},
  {"name":"Block 2","exercises":[...]},
  {"name":"Block 3","exercises":[...]},
  {"name":"Cool Down","exercises":[{"name":"string","sets":"1","reps":"30s","load":"","note":"breathe","pairId":null}]}
]}
Warm-up: 3-4 activation exercises, no supersets. Blocks 1-3: use superset pairs (strength + power). Cool Down: 2-3 mobility exercises, no supersets.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.REACT_APP_ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1400, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await res.json();
  const text = data.content?.find((b) => b.type === "text")?.text || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON");
  const parsed = JSON.parse(match[0]);
  return parsed.blocks.map((b) => ({
    id: uid(), name: b.name,
    exercises: b.exercises.map((e) => ({ id: uid(), name: e.name, sets: e.sets, reps: e.reps, load: e.load, note: e.note, pairId: e.pairId || null })),
  }));
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function Avatar({ name, size = 38 }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const hue = (name.charCodeAt(0) * 47 + (name.charCodeAt(1) || 0) * 13) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: `hsl(${hue},50%,28%)`, border: `2px solid hsl(${hue},50%,40%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.34, fontWeight: 800, color: "#fff", fontFamily: "inherit" }}>
      {initials}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled, small, style: sx }) {
  const base = { border: "none", borderRadius: 10, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all .15s", opacity: disabled ? 0.5 : 1, ...sx };
  const v = {
    primary: { background: C.teal, color: C.bg, padding: small ? "6px 14px" : "10px 22px", fontSize: small ? 12 : 14 },
    ghost: { background: "transparent", color: C.mutedUp, border: `1px solid ${C.border}`, padding: small ? "5px 13px" : "9px 21px", fontSize: small ? 12 : 14 },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...v[variant] }}>{children}</button>;
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{ background: C.surfaceUp, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.border}` }}>
      <p style={{ margin: 0, fontSize: 11, color: C.muted, letterSpacing: ".06em", textTransform: "uppercase" }}>{label}</p>
      <p style={{ margin: "5px 0 0", fontSize: 26, fontWeight: 800, color: accent || C.white }}>{value}</p>
    </div>
  );
}

// ─── EXERCISE ROW (builder) ───────────────────────────────────────────────────
function ExRow({ ex, label, blockExercises, onChange, onRemove, onPair, onUnpair }) {
  const f = (k) => (e) => onChange({ ...ex, [k]: e.target.value });
  const inp = (w) => ({ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, color: C.white, padding: "6px 8px", fontSize: 13, width: w, fontFamily: "inherit", boxSizing: "border-box" });
  const isPaired = !!ex.pairId;
  const canPair = blockExercises.filter((e) => e.id !== ex.id && !e.pairId).length > 0;

  return (
    <div style={{ marginBottom: 6 }}>
      {label && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: isPaired ? C.gold : C.border, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: isPaired ? C.bg : C.muted }}>{label}</span>
          </div>
          <span style={{ fontSize: 10, color: C.gold, fontWeight: 700 }}>SUPERSET</span>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 60px 80px 1fr 80px 24px", gap: 6, alignItems: "center" }}>
        <input list="exbank" value={ex.name} onChange={f("name")} placeholder="Exercise" style={inp("100%")} />
        <input value={ex.sets} onChange={f("sets")} placeholder="Sets" style={inp("100%")} />
        <input value={ex.reps} onChange={f("reps")} placeholder="Reps" style={inp("100%")} />
        <input value={ex.load} onChange={f("load")} placeholder="Load" style={inp("100%")} />
        <input value={ex.note} onChange={f("note")} placeholder="Coaching cue" style={inp("100%")} />
        {isPaired ? (
          <button onClick={onUnpair} style={{ background: "none", border: `1px solid ${C.gold}33`, borderRadius: 6, color: C.gold, fontSize: 11, padding: "4px 6px", cursor: "pointer", fontFamily: "inherit" }}>Unpair</button>
        ) : canPair ? (
          <button onClick={onPair} style={{ background: "none", border: `1px dashed ${C.border}`, borderRadius: 6, color: C.muted, fontSize: 11, padding: "4px 6px", cursor: "pointer", fontFamily: "inherit" }}>+ Superset</button>
        ) : (
          <div />
        )}
        <button onClick={onRemove} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1 }}>×</button>
      </div>
    </div>
  );
}

// ─── PAIR PICKER MODAL ────────────────────────────────────────────────────────
function PairPicker({ exercise, blockExercises, onPick, onClose }) {
  const candidates = blockExercises.filter((e) => e.id !== exercise.id && !e.pairId);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 14, width: "100%", maxWidth: 380, padding: 22 }}>
        <h3 style={{ margin: "0 0 6px", color: C.white, fontSize: 16 }}>Pair with…</h3>
        <p style={{ margin: "0 0 16px", color: C.muted, fontSize: 13 }}>"{exercise.name || "this exercise"}" will be paired as a superset</p>
        {candidates.map((e) => (
          <button key={e.id} onClick={() => onPick(e.id)} style={{ display: "block", width: "100%", background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 14px", marginBottom: 7, color: C.white, fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
            {e.name || "(unnamed exercise)"}
          </button>
        ))}
        <Btn variant="ghost" onClick={onClose} style={{ width: "100%", marginTop: 4 }}>Cancel</Btn>
      </div>
    </div>
  );
}

// ─── WORKOUT BUILDER MODAL ────────────────────────────────────────────────────
function BuilderModal({ athletes, onSave, onClose, editWkt }) {
  const [title, setTitle] = useState(editWkt?.title || "");
  const [date, setDate] = useState(editWkt?.date || today());
  const [assignees, setAssignees] = useState(editWkt?.assignees || []);
  const [blocks, setBlocks] = useState(() => editWkt?.blocks ? JSON.parse(JSON.stringify(editWkt.blocks)) : initBlocks());
  const [focus, setFocus] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genErr, setGenErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [pairTarget, setPairTarget] = useState(null); // {bi, exId}
  const [search, setSearch] = useState("");

  const updEx = (bi, ei, ex) => setBlocks((bs) => bs.map((b, i) => i === bi ? { ...b, exercises: b.exercises.map((e, j) => j === ei ? ex : e) } : b));
  const remEx = (bi, ei) => {
    setBlocks((bs) => bs.map((b, i) => {
      if (i !== bi) return b;
      const removed = b.exercises[ei];
      // if it was paired, unpair its partner too
      const exercises = b.exercises.filter((_, j) => j !== ei).map((e) =>
        e.pairId && e.pairId === removed?.pairId ? { ...e, pairId: null } : e
      );
      return { ...b, exercises };
    }));
  };
  const addEx = (bi) => setBlocks((bs) => bs.map((b, i) => i === bi ? { ...b, exercises: [...b.exercises, emptyEx()] } : b));

  const handlePair = (bi, exId) => setPairTarget({ bi, exId });
  const handlePickPair = (partnerId) => {
    if (!pairTarget) return;
    const newPairId = uid();
    setBlocks((bs) => bs.map((b, i) => {
      if (i !== pairTarget.bi) return b;
      return {
        ...b, exercises: b.exercises.map((e) =>
          e.id === pairTarget.exId || e.id === partnerId ? { ...e, pairId: newPairId } : e
        ),
      };
    }));
    setPairTarget(null);
  };
  const handleUnpair = (bi, exId) => {
    setBlocks((bs) => bs.map((b, i) => {
      if (i !== bi) return b;
      const ex = b.exercises.find((e) => e.id === exId);
      if (!ex?.pairId) return b;
      return { ...b, exercises: b.exercises.map((e) => e.pairId === ex.pairId ? { ...e, pairId: null } : e) };
    }));
  };

  const toggleAthlete = (id) => setAssignees((a) => a.includes(id) ? a.filter((x) => x !== id) : [...a, id]);
  const poolGroups = [...new Set(athletes.map((a) => a.event).filter(Boolean))];

  const selectGroup = (group) => {
    const ids = athletes.filter((a) => a.event === group).map((a) => a.id);
    const allOn = ids.every((id) => assignees.includes(id));
    setAssignees((a) => allOn ? a.filter((x) => !ids.includes(x)) : [...new Set([...a, ...ids])]);
  };

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
    await onSave({ id: editWkt?.id || uid(), title, date, assignees, blocks });
    setSaving(false);
  };

  const inp = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", width: "100%" };
  const filteredAthletes = athletes.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 100, overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "24px 16px" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 860, padding: 28, boxShadow: `0 0 60px ${C.tealGlow}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ margin: 0, color: C.white, fontSize: 20, fontWeight: 800 }}>{editWkt ? "Edit workout" : "New workout"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 12, marginBottom: 18 }}>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>TITLE</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Strength Power – Week 5" style={inp} /></div>
          <div><label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>DATE</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} /></div>
        </div>

        {/* Assignment — groups + individuals */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: C.muted, letterSpacing: ".05em", textTransform: "uppercase" }}>Assign to</label>
            <span style={{ fontSize: 12, color: assignees.length > 0 ? C.teal : C.muted, fontWeight: 700 }}>{assignees.length} athlete{assignees.length !== 1 ? "s" : ""} selected</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {/* Groups column */}
            <div style={{ width: 160, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden", flexShrink: 0 }}>
              <div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>Groups</div>
              <div style={{ padding: 6 }}>
                {poolGroups.map((g) => {
                  const ids = athletes.filter((a) => a.event === g).map((a) => a.id);
                  const allOn = ids.length > 0 && ids.every((id) => assignees.includes(id));
                  const someOn = ids.some((id) => assignees.includes(id));
                  return (
                    <button key={g} onClick={() => selectGroup(g)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: allOn ? C.tealGlow : "transparent", border: `1px solid ${allOn || someOn ? C.teal : "transparent"}`, borderRadius: 7, padding: "6px 8px", cursor: "pointer", marginBottom: 3, fontFamily: "inherit" }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${allOn ? C.teal : someOn ? C.teal : C.muted}`, background: allOn ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {allOn && <span style={{ color: C.bg, fontSize: 9, fontWeight: 900 }}>✓</span>}
                        {someOn && !allOn && <span style={{ color: C.teal, fontSize: 11, lineHeight: 1 }}>–</span>}
                      </div>
                      <span style={{ fontSize: 12, color: allOn ? C.teal : C.white, flex: 1, textAlign: "left" }}>{g}</span>
                      <span style={{ fontSize: 10, color: C.muted }}>{ids.length}</span>
                    </button>
                  );
                })}
                {poolGroups.length === 0 && <p style={{ color: C.muted, fontSize: 12, padding: "6px 4px", margin: 0 }}>No groups</p>}
              </div>
            </div>

            {/* Athletes column */}
            <div style={{ flex: 1, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ padding: "6px 10px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap" }}>Athletes</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 6, color: C.white, padding: "3px 8px", fontSize: 12, fontFamily: "inherit", flex: 1 }} />
              </div>
              <div style={{ overflowY: "auto", maxHeight: 200, padding: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                {filteredAthletes.map((a) => {
                  const on = assignees.includes(a.id);
                  return (
                    <button key={a.id} onClick={() => toggleAthlete(a.id)} style={{ display: "flex", alignItems: "center", gap: 6, background: on ? C.tealGlow : "transparent", border: `1px solid ${on ? C.teal : "transparent"}`, borderRadius: 7, padding: "5px 8px", cursor: "pointer", fontFamily: "inherit" }}>
                      <div style={{ width: 13, height: 13, borderRadius: 3, border: `2px solid ${on ? C.teal : C.muted}`, background: on ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {on && <span style={{ color: C.bg, fontSize: 8, fontWeight: 900 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 12, color: on ? C.teal : C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* AI generate */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.teal, whiteSpace: "nowrap" }}>✦ AI Generate</span>
          <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. strength power — DB front squat + box jumps" style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 7, color: C.white, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", flex: 1, minWidth: 180 }} />
          <Btn onClick={handleGen} disabled={generating} small>{generating ? "Generating…" : "Generate"}</Btn>
          {genErr && <span style={{ color: C.red, fontSize: 12 }}>{genErr}</span>}
        </div>

        <datalist id="exbank">{EXERCISE_BANK.map((e) => <option key={e} value={e} />)}</datalist>

        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 60px 80px 1fr 80px 24px", gap: 6, marginBottom: 6 }}>
          {["Exercise", "Sets", "Reps", "Load", "Coaching cue", "", ""].map((h, i) => (
            <span key={i} style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</span>
          ))}
        </div>

        {blocks.map((block, bi) => {
          const labels = getSupersetLabels(block.exercises);
          // Group exercises: show superset pairs together, with connector
          const rendered = [];
          const seen = new Set();
          block.exercises.forEach((ex, ei) => {
            if (seen.has(ex.id)) return;
            if (ex.pairId) {
              const partner = block.exercises.find((e) => e.id !== ex.id && e.pairId === ex.pairId);
              if (partner) {
                const partnerEi = block.exercises.indexOf(partner);
                seen.add(ex.id);
                seen.add(partner.id);
                rendered.push(
                  <div key={ex.pairId} style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}33`, borderRadius: 10, padding: "10px 10px 6px", marginBottom: 8 }}>
                    <ExRow ex={ex} label={labels[ex.id]} blockExercises={block.exercises} onChange={(u) => updEx(bi, ei, u)} onRemove={() => remEx(bi, ei)} onPair={() => handlePair(bi, ex.id)} onUnpair={() => handleUnpair(bi, ex.id)} />
                    <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "2px 0 4px 10px" }}>
                      <div style={{ width: 1, height: 12, background: C.gold, opacity: .4 }} />
                      <span style={{ fontSize: 10, color: C.gold, opacity: .7 }}>superset</span>
                    </div>
                    <ExRow ex={partner} label={labels[partner.id]} blockExercises={block.exercises} onChange={(u) => updEx(bi, partnerEi, u)} onRemove={() => remEx(bi, partnerEi)} onPair={() => handlePair(bi, partner.id)} onUnpair={() => handleUnpair(bi, partner.id)} />
                  </div>
                );
                return;
              }
            }
            seen.add(ex.id);
            rendered.push(
              <ExRow key={ex.id} ex={ex} label={null} blockExercises={block.exercises} onChange={(u) => updEx(bi, ei, u)} onRemove={() => remEx(bi, ei)} onPair={() => handlePair(bi, ex.id)} onUnpair={() => handleUnpair(bi, ex.id)} />
            );
          });

          return (
            <div key={block.id} style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 3, height: 16, borderRadius: 2, background: BLOCK_COLORS[bi] || C.muted }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: BLOCK_COLORS[bi] || C.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>{block.name}</span>
              </div>
              {rendered}
              <button onClick={() => addEx(bi)} style={{ background: "none", border: `1px dashed ${C.border}`, borderRadius: 7, color: C.muted, fontSize: 12, padding: "5px 14px", cursor: "pointer", marginTop: 4, fontFamily: "inherit" }}>+ Add exercise</button>
            </div>
          );
        })}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 18 }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={!title || assignees.length === 0 || saving}>{saving ? "Saving…" : `Save workout (${assignees.length} athlete${assignees.length !== 1 ? "s" : ""})`}</Btn>
        </div>
      </div>

      {pairTarget && (
        <PairPicker
          exercise={blocks[pairTarget.bi].exercises.find((e) => e.id === pairTarget.exId)}
          blockExercises={blocks[pairTarget.bi].exercises}
          onPick={handlePickPair}
          onClose={() => setPairTarget(null)}
        />
      )}
    </div>
  );
}

// ─── LOG MODAL ────────────────────────────────────────────────────────────────
function LogModal({ workout, athleteId, existingLog, onSave, onClose }) {
  const [sets, setSets] = useState(() => {
    const init = {};
    workout.blocks.forEach((b) => b.exercises.forEach((ex) => {
      init[ex.id] = existingLog?.sets?.[ex.id] || Array.from({ length: parseInt(ex.sets) || 3 }, () => ({ reps: "", load: "", done: false }));
    }));
    return init;
  });
  const [note, setNote] = useState(existingLog?.note || "");
  const [rpe, setRpe] = useState(existingLog?.rpe || "");
  const [saving, setSaving] = useState(false);

  const updSet = (exId, idx, k, v) => setSets((s) => ({ ...s, [exId]: s[exId].map((r, i) => i === idx ? { ...r, [k]: v } : r) }));
  const toggleDone = (exId, idx) => updSet(exId, idx, "done", !sets[exId][idx].done);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ athleteId, workoutId: workout.id, date: workout.date, sets, note, rpe });
    setSaving(false);
  };

  const inpSm = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, color: C.white, padding: "4px 6px", fontSize: 13, textAlign: "center", fontFamily: "inherit", boxSizing: "border-box" };

  const renderExerciseLog = (ex, bi, isSupersetMember = false) => (
    <div key={ex.id} style={{ background: isSupersetMember ? "transparent" : C.surfaceUp, borderRadius: isSupersetMember ? 8 : 10, padding: "10px 12px", marginBottom: isSupersetMember ? 0 : 8, border: isSupersetMember ? `1px solid ${C.border}` : "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ex.note ? 5 : 8 }}>
        <span style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>{ex.name}</span>
        <span style={{ color: C.muted, fontSize: 12 }}>{ex.sets}×{ex.reps}{ex.load ? ` @ ${ex.load}` : ""}</span>
      </div>
      {ex.note && <p style={{ margin: "0 0 8px", fontSize: 12, color: C.teal, fontStyle: "italic" }}>"{ex.note}"</p>}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {(sets[ex.id] || []).map((row, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 4, background: row.done ? C.tealGlow : "rgba(255,255,255,.03)", border: `1px solid ${row.done ? C.teal : C.border}`, borderRadius: 7, padding: "4px 7px" }}>
            <span style={{ fontSize: 10, color: C.muted, width: 14 }}>S{idx + 1}</span>
            <input value={row.reps} onChange={(e) => updSet(ex.id, idx, "reps", e.target.value)} placeholder={ex.reps} style={{ ...inpSm, width: 40 }} />
            <span style={{ color: C.muted, fontSize: 10 }}>@</span>
            <input value={row.load} onChange={(e) => updSet(ex.id, idx, "load", e.target.value)} placeholder={ex.load || "—"} style={{ ...inpSm, width: 50 }} />
            <button onClick={() => toggleDone(ex.id, idx)} style={{ background: "none", border: "none", cursor: "pointer", color: row.done ? C.teal : C.muted, fontSize: 17, padding: 0, lineHeight: 1 }}>{row.done ? "✓" : "○"}</button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", zIndex: 200, overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "24px 16px" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 640, padding: 26, boxShadow: `0 0 60px ${C.tealGlow}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, color: C.white, fontSize: 18, fontWeight: 800 }}>{workout.title}</h2>
            <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 12 }}>{fmtDate(workout.date)}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>

        {workout.blocks.map((block, bi) => {
          const labels = getSupersetLabels(block.exercises);
          const seen = new Set();
          const rendered = [];
          block.exercises.forEach((ex) => {
            if (seen.has(ex.id)) return;
            if (ex.pairId) {
              const partner = block.exercises.find((e) => e.id !== ex.id && e.pairId === ex.pairId);
              if (partner) {
                seen.add(ex.id); seen.add(partner.id);
                rendered.push(
                  <div key={ex.pairId} style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}33`, borderRadius: 12, padding: 10, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 9, fontWeight: 900, color: C.bg }}>{labels[ex.id]?.[0]}</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: C.gold }}>SUPERSET</span>
                    </div>
                    {renderExerciseLog(ex, bi, true)}
                    <div style={{ height: 6 }} />
                    {renderExerciseLog(partner, bi, true)}
                  </div>
                );
                return;
              }
            }
            seen.add(ex.id);
            rendered.push(renderExerciseLog(ex, bi, false));
          });

          return (
            <div key={block.id} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: BLOCK_COLORS[bi] || C.muted }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: BLOCK_COLORS[bi] || C.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>{block.name}</span>
              </div>
              {rendered}
            </div>
          );
        })}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 12, marginBottom: 18 }}>
          <div>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>SESSION NOTES</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="How did it feel? Any PRs? Anything to flag for coach?" rows={3} style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 13, width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>RPE 1–10</label>
            <input value={rpe} onChange={(e) => setRpe(e.target.value)} type="number" min="1" max="10" placeholder="7" style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.gold, padding: "9px 8px", fontSize: 28, fontWeight: 800, width: "100%", boxSizing: "border-box", textAlign: "center", fontFamily: "inherit" }} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save session"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ athletes, onLogin, onCoachLogin }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [coachPin, setCoachPin] = useState("");
  const [mode, setMode] = useState("athlete");
  const [err, setErr] = useState("");

  const handleAthleteLogin = () => {
    setErr("");
    const match = athletes.find((a) => a.name.toLowerCase() === name.trim().toLowerCase() && a.pin === pin);
    if (match) onLogin(match);
    else setErr("Name or PIN not found. Check with your coach.");
  };
  const handleCoachLogin = () => {
    setErr("");
    if (coachPin === "COACH2025") onCoachLogin();
    else setErr("Incorrect coach PIN.");
  };

  const fieldStyle = { background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 9, color: C.white, padding: "11px 14px", width: "100%", boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.bg} strokeWidth="2.5" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: C.white }}>Riptide <span style={{ color: C.teal }}>Strength</span></h1>
        <p style={{ margin: "6px 0 0", color: C.muted, fontSize: 14 }}>South Metro Swim Performance</p>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, width: "100%", maxWidth: 380, padding: 28, boxShadow: `0 0 80px ${C.tealGlow}` }}>
        <div style={{ display: "flex", background: C.bg, borderRadius: 30, padding: 4, marginBottom: 22 }}>
          {["athlete", "coach"].map((m) => (
            <button key={m} onClick={() => { setMode(m); setErr(""); }} style={{ flex: 1, border: "none", borderRadius: 26, padding: "7px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: mode === m ? C.teal : "transparent", color: mode === m ? C.bg : C.muted, transition: "all .15s" }}>
              {m === "athlete" ? "I'm an athlete" : "Coach"}
            </button>
          ))}
        </div>

        {mode === "athlete" ? (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>YOUR NAME</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="First Last" style={{ ...fieldStyle, fontSize: 15 }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>PIN</label>
              <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" placeholder="••••" maxLength={6} style={{ ...fieldStyle, fontSize: 22, letterSpacing: ".2em" }} onKeyDown={(e) => e.key === "Enter" && handleAthleteLogin()} />
            </div>
            {err && <p style={{ color: C.red, fontSize: 13, margin: "0 0 14px", textAlign: "center" }}>{err}</p>}
            <Btn onClick={handleAthleteLogin} style={{ width: "100%" }}>Log in →</Btn>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>COACH PIN</label>
              <input value={coachPin} onChange={(e) => setCoachPin(e.target.value)} type="password" placeholder="••••••••" style={{ ...fieldStyle, fontSize: 22, letterSpacing: ".2em" }} onKeyDown={(e) => e.key === "Enter" && handleCoachLogin()} />
            </div>
            {err && <p style={{ color: C.red, fontSize: 13, margin: "0 0 14px", textAlign: "center" }}>{err}</p>}
            <Btn onClick={handleCoachLogin} style={{ width: "100%" }}>Enter coach dashboard →</Btn>
          </>
        )}
      </div>
    </div>
  );
}

// ─── ATHLETE APP ──────────────────────────────────────────────────────────────
function AthleteApp({ athlete, workouts, logs, onLog, onLogout }) {
  const myWorkouts = workouts.filter((w) => w.assignees?.includes(athlete.id)).sort((a, b) => b.date.localeCompare(a.date));
  const myLogs = logs.filter((l) => l.athleteId === athlete.id);
  const [logTarget, setLogTarget] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 20px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={athlete.name} size={34} />
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: C.white }}>{athlete.name}</p>
              <p style={{ margin: 0, fontSize: 11, color: C.muted }}>{athlete.event}</p>
            </div>
          </div>
          <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 12, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>Log out</button>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 26 }}>
          <StatCard label="Workouts" value={myWorkouts.length} />
          <StatCard label="Logged" value={myLogs.length} accent={myLogs.length > 0 ? C.teal : undefined} />
          <StatCard label="Avg RPE" value={myLogs.filter((l) => l.rpe).length ? (myLogs.reduce((s, l) => s + (parseFloat(l.rpe) || 0), 0) / myLogs.filter((l) => l.rpe).length).toFixed(1) : "—"} accent={C.gold} />
        </div>

        <h3 style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", letterSpacing: ".06em", textTransform: "uppercase" }}>Your workouts</h3>
        {myWorkouts.length === 0 && <p style={{ color: C.muted, textAlign: "center", padding: "40px 0" }}>No workouts assigned yet — check back soon.</p>}
        {myWorkouts.map((wkt) => {
          const log = myLogs.find((l) => l.workoutId === wkt.id);
          const totalEx = wkt.blocks?.reduce((s, b) => s + b.exercises.length, 0) || 0;
          const supersetCount = wkt.blocks?.reduce((s, b) => {
            const pairs = new Set(b.exercises.filter((e) => e.pairId).map((e) => e.pairId));
            return s + pairs.size;
          }, 0) || 0;
          return (
            <div key={wkt.id} style={{ background: C.surface, border: `1px solid ${log ? C.teal : C.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: C.white, fontSize: 15 }}>{wkt.title}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: C.muted }}>
                    {fmtDate(wkt.date)} · {totalEx} exercises
                    {supersetCount > 0 && <span style={{ color: C.gold, marginLeft: 6 }}>· {supersetCount} superset{supersetCount > 1 ? "s" : ""}</span>}
                  </p>
                </div>
                <button onClick={() => setLogTarget({ wkt, existingLog: log })} style={{ background: log ? "transparent" : C.teal, color: log ? C.teal : C.bg, border: `1px solid ${C.teal}`, borderRadius: 9, padding: "7px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, marginLeft: 12 }}>
                  {log ? "View log" : "Log session"}
                </button>
              </div>
              {log && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 10, display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {log.rpe && <span style={{ fontSize: 12, color: C.gold, fontWeight: 700 }}>RPE {log.rpe}/10</span>}
                  {log.note && <span style={{ fontSize: 12, color: C.mutedUp, fontStyle: "italic" }}>"{log.note.slice(0, 90)}{log.note.length > 90 ? "…" : ""}"</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {logTarget && (
        <LogModal workout={logTarget.wkt} athleteId={athlete.id} existingLog={logTarget.existingLog}
          onSave={async (logData) => { await onLog(logData); setLogTarget(null); }}
          onClose={() => setLogTarget(null)} />
      )}
    </div>
  );
}

// ─── COACH APP ────────────────────────────────────────────────────────────────
function CoachApp({ athletes, workouts, logs, onSaveWorkout, onDeleteWorkout, onAddAthlete, onLogout }) {
  const [tab, setTab] = useState("workouts");
  const [showBuilder, setShowBuilder] = useState(false);
  const [editWkt, setEditWkt] = useState(null);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [showAddAthlete, setShowAddAthlete] = useState(false);
  const [newAthlete, setNewAthlete] = useState({ name: "", age: "", event: "", pin: "" });
  const [adding, setAdding] = useState(false);
  const [rosterFilter, setRosterFilter] = useState("All");

  const poolGroups = [...new Set(athletes.map((a) => a.event).filter(Boolean))];
  const filteredAthletes = rosterFilter === "All" ? athletes : athletes.filter((a) => a.event === rosterFilter);

  const handleAddAthlete = async () => {
    if (!newAthlete.name || !newAthlete.pin) return;
    setAdding(true);
    await onAddAthlete({ id: uid(), ...newAthlete });
    setNewAthlete({ name: "", age: "", event: "", pin: "" });
    setShowAddAthlete(false);
    setAdding(false);
  };

  const inp = { background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", width: "100%" };

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: C.teal, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.bg} strokeWidth="2.5" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
            </div>
            <span style={{ fontWeight: 900, fontSize: 16, color: C.white }}>Riptide <span style={{ color: C.teal }}>Strength</span></span>
            <span style={{ fontSize: 11, background: C.tealGlow, color: C.teal, border: `1px solid ${C.borderBright}`, borderRadius: 20, padding: "2px 10px", fontWeight: 700 }}>Coach</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", background: C.bg, borderRadius: 30, padding: 3 }}>
              {["workouts", "roster", "logs"].map((t) => (
                <button key={t} onClick={() => { setTab(t); setSelectedAthlete(null); }} style={{ border: "none", borderRadius: 26, padding: "6px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: tab === t ? C.teal : "transparent", color: tab === t ? C.bg : C.muted, transition: "all .15s", textTransform: "capitalize" }}>{t}</button>
              ))}
            </div>
            <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 12, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>Log out</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "26px 20px" }}>

        {tab === "workouts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.white }}>Workouts</h1>
                <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>{workouts.length} total · {logs.length} sessions logged</p>
              </div>
              <Btn onClick={() => { setEditWkt(null); setShowBuilder(true); }}>+ New workout</Btn>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
              <StatCard label="Workouts" value={workouts.length} />
              <StatCard label="Athletes" value={athletes.length} />
              <StatCard label="Sessions logged" value={logs.length} accent={logs.length > 0 ? C.teal : undefined} />
              <StatCard label="This week" value={workouts.filter((w) => { const diff = (Date.now() - new Date(w.date + "T12:00:00")) / 86400000; return diff >= 0 && diff < 7; }).length} />
            </div>
            {workouts.length === 0 && <div style={{ textAlign: "center", padding: "56px 0", color: C.muted }}><p style={{ fontSize: 40, margin: "0 0 10px" }}>🏋️</p><p style={{ margin: 0 }}>No workouts yet.</p></div>}
            {[...workouts].sort((a, b) => b.date.localeCompare(a.date)).map((wkt) => {
              const totalEx = wkt.blocks?.reduce((s, b) => s + b.exercises.length, 0) || 0;
              const supersetCount = wkt.blocks?.reduce((s, b) => { const p = new Set(b.exercises.filter((e) => e.pairId).map((e) => e.pairId)); return s + p.size; }, 0) || 0;
              const wktLogs = logs.filter((l) => l.workoutId === wkt.id);
              const names = wkt.assignees?.map((id) => athletes.find((a) => a.id === id)?.name.split(" ")[0]).filter(Boolean) || [];
              return (
                <div key={wkt.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, color: C.white, fontSize: 15 }}>{wkt.title}</p>
                      <p style={{ margin: "3px 0 8px", fontSize: 12, color: C.muted }}>
                        {fmtDate(wkt.date)} · {totalEx} exercises
                        {supersetCount > 0 && <span style={{ color: C.gold, marginLeft: 6 }}>· {supersetCount} superset{supersetCount > 1 ? "s" : ""}</span>}
                        <span style={{ marginLeft: 6 }}>· {wktLogs.length}/{wkt.assignees?.length || 0} logged</span>
                      </p>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {names.slice(0, 8).map((n) => <span key={n} style={{ fontSize: 11, background: C.tealGlow, color: C.teal, border: `1px solid ${C.border}`, borderRadius: 20, padding: "2px 9px" }}>{n}</span>)}
                        {names.length > 8 && <span style={{ fontSize: 11, color: C.muted }}>+{names.length - 8} more</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginLeft: 12 }}>
                      <Btn variant="ghost" small onClick={() => { setEditWkt(wkt); setShowBuilder(true); }}>Edit</Btn>
                      <button onClick={() => onDeleteWorkout(wkt.id)} style={{ background: "none", border: "none", color: C.red, fontSize: 20, cursor: "pointer", padding: "0 4px" }}>×</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "roster" && !selectedAthlete && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.white }}>Roster</h1>
              <Btn small onClick={() => setShowAddAthlete(true)}>+ Add athlete</Btn>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
              {["All", ...poolGroups].map((f) => (
                <button key={f} onClick={() => setRosterFilter(f)} style={{ border: `1px solid ${rosterFilter === f ? C.teal : C.border}`, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: rosterFilter === f ? C.tealGlow : "transparent", color: rosterFilter === f ? C.teal : C.mutedUp }}>
                  {f} <span style={{ opacity: .6 }}>({f === "All" ? athletes.length : athletes.filter((a) => a.event === f).length})</span>
                </button>
              ))}
            </div>
            {filteredAthletes.map((a) => {
              const aWkts = workouts.filter((w) => w.assignees?.includes(a.id));
              const aLogs = logs.filter((l) => l.athleteId === a.id);
              return (
                <div key={a.id} onClick={() => setSelectedAthlete(a)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 18px", marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "border-color .15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = C.teal}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
                  <Avatar name={a.name} size={44} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: C.white, fontSize: 15 }}>{a.name}</p>
                    <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 12 }}>{a.event || "No group"}{a.age ? ` · Age ${a.age}` : ""}</p>
                  </div>
                  <div style={{ display: "flex", gap: 20, textAlign: "center", marginRight: 8 }}>
                    <div><p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.white }}>{aWkts.length}</p><p style={{ margin: 0, fontSize: 10, color: C.muted }}>workouts</p></div>
                    <div><p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: aLogs.length ? C.teal : C.muted }}>{aLogs.length}</p><p style={{ margin: 0, fontSize: 10, color: C.muted }}>logged</p></div>
                  </div>
                  <span style={{ color: C.muted, fontSize: 20 }}>›</span>
                </div>
              );
            })}
            {showAddAthlete && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 420, padding: 28 }}>
                  <h2 style={{ margin: "0 0 20px", color: C.white, fontSize: 18, fontWeight: 800 }}>Add athlete</h2>
                  {[["Full name","name","text","Maya Chen"],["Age","age","number","15"],["Pool group","event","text","8 Lane"],["PIN","pin","text","1234"]].map(([label,key,type,ph]) => (
                    <div key={key} style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>{label.toUpperCase()}</label>
                      <input type={type} value={newAthlete[key]} onChange={(e) => setNewAthlete((n) => ({ ...n, [key]: e.target.value }))} placeholder={ph} style={inp} />
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 10 }}>
                    <Btn variant="ghost" onClick={() => setShowAddAthlete(false)} style={{ flex: 1 }}>Cancel</Btn>
                    <Btn onClick={handleAddAthlete} disabled={!newAthlete.name || !newAthlete.pin || adding} style={{ flex: 1 }}>{adding ? "Adding…" : "Add athlete"}</Btn>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "roster" && selectedAthlete && (() => {
          const aWkts = workouts.filter((w) => w.assignees?.includes(selectedAthlete.id)).sort((a, b) => b.date.localeCompare(a.date));
          const aLogs = logs.filter((l) => l.athleteId === selectedAthlete.id);
          return (
            <div>
              <button onClick={() => setSelectedAthlete(null)} style={{ background: "none", border: "none", color: C.teal, cursor: "pointer", fontSize: 13, marginBottom: 18, padding: 0, fontFamily: "inherit" }}>← Back to roster</button>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <Avatar name={selectedAthlete.name} size={56} />
                <div>
                  <h2 style={{ margin: 0, color: C.white, fontSize: 22, fontWeight: 900 }}>{selectedAthlete.name}</h2>
                  <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>{selectedAthlete.event || "No group"}{selectedAthlete.age ? ` · Age ${selectedAthlete.age}` : ""}</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
                <StatCard label="Assigned" value={aWkts.length} />
                <StatCard label="Logged" value={aLogs.length} accent={aLogs.length > 0 ? C.teal : undefined} />
                <StatCard label="Avg RPE" value={aLogs.filter((l) => l.rpe).length ? (aLogs.reduce((s, l) => s + (parseFloat(l.rpe) || 0), 0) / aLogs.filter((l) => l.rpe).length).toFixed(1) : "—"} accent={C.gold} />
              </div>
              {aWkts.map((wkt) => {
                const log = aLogs.find((l) => l.workoutId === wkt.id);
                return (
                  <div key={wkt.id} style={{ background: C.surface, border: `1px solid ${log ? C.teal : C.border}`, borderRadius: 14, padding: "14px 18px", marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: C.white }}>{wkt.title}</p>
                        <p style={{ margin: "3px 0 0", fontSize: 12, color: C.muted }}>{fmtDate(wkt.date)}</p>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: log ? C.teal : C.muted, alignSelf: "center" }}>{log ? "✓ Logged" : "Not logged"}</span>
                    </div>
                    {log && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                        {log.rpe && <span style={{ fontSize: 13, color: C.gold, fontWeight: 700, marginRight: 14 }}>RPE {log.rpe}/10</span>}
                        {log.note && <span style={{ fontSize: 13, color: C.mutedUp, fontStyle: "italic" }}>"{log.note}"</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {tab === "logs" && (
          <div>
            <h1 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 900, color: C.white }}>All session logs</h1>
            {logs.length === 0 && <p style={{ color: C.muted, textAlign: "center", padding: "48px 0" }}>No sessions logged yet.</p>}
            {[...logs].sort((a, b) => b.loggedAt - a.loggedAt).map((log, i) => {
              const athlete = athletes.find((a) => a.id === log.athleteId);
              const wkt = workouts.find((w) => w.id === log.workoutId);
              if (!athlete || !wkt) return null;
              return (
                <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 18px", marginBottom: 10, display: "flex", gap: 14, alignItems: "center" }}>
                  <Avatar name={athlete.name} size={42} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: C.white, fontSize: 14 }}>{athlete.name} <span style={{ color: C.muted, fontWeight: 400 }}>logged</span> {wkt.title}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: C.muted }}>{fmtDate(log.date)} {log.rpe && <span style={{ color: C.gold, fontWeight: 700 }}>· RPE {log.rpe}</span>}</p>
                    {log.note && <p style={{ margin: "5px 0 0", fontSize: 13, color: C.mutedUp, fontStyle: "italic" }}>"{log.note}"</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showBuilder && (
        <BuilderModal athletes={athletes} onSave={async (wkt) => { await onSaveWorkout(wkt); setShowBuilder(false); setEditWkt(null); }} onClose={() => { setShowBuilder(false); setEditWkt(null); }} editWkt={editWkt} />
      )}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      const [{ data: ath }, { data: wkts }, { data: lg }] = await Promise.all([
        supabase.from("athletes").select("*"),
        supabase.from("workouts").select("*"),
        supabase.from("logs").select("*"),
      ]);
      setAthletes(ath || []);
      setWorkouts((wkts || []).map((w) => ({ ...w, blocks: typeof w.blocks === "string" ? JSON.parse(w.blocks) : w.blocks, assignees: typeof w.assignees === "string" ? JSON.parse(w.assignees) : w.assignees })));
      setLogs((lg || []).map((l) => ({ ...l, sets: typeof l.sets === "string" ? JSON.parse(l.sets) : l.sets })));
      setLoading(false);
    }
    fetchAll();
  }, []);

  const saveWorkout = useCallback(async (wkt) => {
    const payload = { ...wkt, blocks: JSON.stringify(wkt.blocks), assignees: JSON.stringify(wkt.assignees) };
    const exists = workouts.find((w) => w.id === wkt.id);
    if (exists) { await supabase.from("workouts").update(payload).eq("id", wkt.id); setWorkouts((ws) => ws.map((w) => w.id === wkt.id ? wkt : w)); }
    else { await supabase.from("workouts").insert(payload); setWorkouts((ws) => [...ws, wkt]); }
  }, [workouts]);

  const deleteWorkout = useCallback(async (id) => {
    await supabase.from("workouts").delete().eq("id", id);
    setWorkouts((ws) => ws.filter((w) => w.id !== id));
  }, []);

  const saveLog = useCallback(async (log) => {
    const payload = { ...log, sets: JSON.stringify(log.sets), loggedAt: Date.now() };
    const exists = logs.find((l) => l.athleteId === log.athleteId && l.workoutId === log.workoutId);
    if (exists) { await supabase.from("logs").update(payload).eq("athleteId", log.athleteId).eq("workoutId", log.workoutId); }
    else { await supabase.from("logs").insert(payload); }
    const { data } = await supabase.from("logs").select("*");
    setLogs((data || []).map((l) => ({ ...l, sets: typeof l.sets === "string" ? JSON.parse(l.sets) : l.sets })));
  }, [logs]);

  const addAthlete = useCallback(async (athlete) => {
    await supabase.from("athletes").insert(athlete);
    setAthletes((as) => [...as, athlete]);
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: C.teal, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.bg} strokeWidth="2.5" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
      </div>
      <p style={{ color: C.muted, fontSize: 14, margin: 0, fontFamily: "system-ui" }}>Loading Riptide Strength…</p>
    </div>
  );

  if (!session) return <LoginScreen athletes={athletes} onLogin={(a) => setSession({ role: "athlete", athlete: a })} onCoachLogin={() => setSession({ role: "coach" })} />;
  if (session.role === "coach") return <CoachApp athletes={athletes} workouts={workouts} logs={logs} onSaveWorkout={saveWorkout} onDeleteWorkout={deleteWorkout} onAddAthlete={addAthlete} onLogout={() => setSession(null)} />;
  return <AthleteApp athlete={session.athlete} workouts={workouts} logs={logs} onLog={saveLog} onLogout={() => setSession(null)} />;
}
