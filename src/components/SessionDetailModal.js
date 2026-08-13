import { C, blockColor } from "../constants";
import { fmtDate, getSupersetLabels } from "../helpers";
import { Btn } from "./common";

// ─── SESSION DETAIL MODAL ─────────────────────────────────────────────────────
function SessionDetailModal({ log, workout, athlete, onClose }) {
  if (!log || !workout) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", zIndex: 200, overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderBright}`, borderRadius: 18, width: "100%", maxWidth: 640, padding: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div><h2 style={{ margin: 0, color: C.white, fontSize: 18, fontWeight: 800 }}>{workout.title}</h2><p style={{ margin: "3px 0 0", color: C.muted, fontSize: 13 }}>{athlete?.name} · {fmtDate(log.date)}</p></div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        {log.rpe && <div style={{ background: C.surfaceUp, borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 12, color: C.muted }}>RPE</span><span style={{ fontSize: 28, fontWeight: 900, color: C.gold }}>{log.rpe}<span style={{ fontSize: 14, color: C.muted }}>/10</span></span>{log.note && <span style={{ fontSize: 13, color: C.mutedUp, fontStyle: "italic", flex: 1 }}>"{log.note}"</span>}</div>}
        {workout.blocks?.map((block, bi) => {
          const labels = getSupersetLabels(block.exercises);
          const seen = new Set(); const rendered = [];
          block.exercises.forEach((ex) => {
            if (seen.has(ex.id)) return;
            const exSets = log.sets?.[ex.id] || [];
            const loggedSets = exSets.filter((s) => s.reps || s.load || s.done);
            if (ex.pairId) {
              const partner = block.exercises.find((e) => e.id !== ex.id && e.pairId === ex.pairId);
              if (partner) {
                seen.add(ex.id); seen.add(partner.id);
                const partnerSets = (log.sets?.[partner.id] || []).filter((s) => s.reps || s.load || s.done);
                rendered.push(
                  <div key={ex.pairId} style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}33`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><div style={{ width: 18, height: 18, borderRadius: 4, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 9, fontWeight: 900, color: C.bg }}>{labels[ex.id]?.[0]}</span></div><span style={{ fontSize: 11, fontWeight: 800, color: C.gold }}>SUPERSET</span></div>
                    {[{ e: ex, s: loggedSets }, { e: partner, s: partnerSets }].map(({ e, s }) => (
                      <div key={e.id} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ color: C.white, fontWeight: 600, fontSize: 13 }}>{e.name}</span><span style={{ color: C.muted, fontSize: 11 }}>{e.sets}×{e.reps}</span></div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{s.length > 0 ? s.map((row, i) => <div key={i} style={{ fontSize: 12, background: row.done ? C.tealGlow : C.surfaceUp, border: `1px solid ${row.done ? C.teal : C.border}`, borderRadius: 6, padding: "3px 10px", color: row.done ? C.teal : C.mutedUp }}>S{i + 1}: {row.reps || "—"} @ {row.load || "—"}{row.rpe ? <span style={{ color: C.gold }}> · RPE {row.rpe}</span> : null}</div>) : <span style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>Not logged</span>}</div>
                      </div>
                    ))}
                  </div>
                );
                return;
              }
            }
            seen.add(ex.id);
            rendered.push(
              <div key={ex.id} style={{ background: C.surfaceUp, borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: C.white, fontWeight: 600, fontSize: 14 }}>{ex.name}</span><span style={{ color: C.muted, fontSize: 12 }}>{ex.sets}×{ex.reps}{ex.load ? ` @ ${ex.load}` : ""}</span></div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{loggedSets.length > 0 ? loggedSets.map((row, i) => <div key={i} style={{ fontSize: 12, background: row.done ? C.tealGlow : C.bg, border: `1px solid ${row.done ? C.teal : C.border}`, borderRadius: 6, padding: "3px 10px", color: row.done ? C.teal : C.mutedUp }}>S{i + 1}: {row.reps || "—"} @ {row.load || "—"}{row.rpe ? <span style={{ color: C.gold }}> · RPE {row.rpe}</span> : null}</div>) : <span style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>Not logged</span>}</div>
              </div>
            );
          });
          return (
            <div key={block.id} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><div style={{ width: 3, height: 14, borderRadius: 2, background: blockColor(bi) }} /><span style={{ fontSize: 11, fontWeight: 800, color: blockColor(bi), textTransform: "uppercase", letterSpacing: ".06em" }}>{block.name}</span></div>
              {block.note && <p style={{ margin: "0 0 8px", padding: "6px 10px", background: C.tealGlow, border: `1px solid ${C.teal}33`, borderRadius: 7, color: C.mutedUp, fontSize: 12, whiteSpace: "pre-wrap" }}>{block.note}</p>}
              {rendered}
              {log.blockNotes?.[block.id] && <p style={{ margin: "6px 0 0", fontSize: 12, color: C.mutedUp, fontStyle: "italic", background: C.bg, borderRadius: 7, padding: "6px 10px" }}>"{log.blockNotes[block.id]}"</p>}
            </div>
          );
        })}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}><Btn variant="ghost" onClick={onClose}>Close</Btn></div>
      </div>
    </div>
  );
}

export { SessionDetailModal };
